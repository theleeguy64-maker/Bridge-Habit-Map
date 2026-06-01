#!/usr/bin/env python3
"""
Generic Local App Server — Reusable HTTPS server for local-first web apps.
Serves static files, handles CORS for local network access, and provides
health/version endpoints. Subclass LocalAppHandler and override do_POST()
to add app-specific endpoints.
"""

import gzip
import json
import logging
import re
import ssl
import socket
import threading
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote

# MIME types for static files
MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
}

# Only serve files with these extensions
SERVEABLE_EXTENSIONS = {".html", ".js", ".css", ".png", ".ico", ".json"}

# Max upload size: 25 MB
MAX_UPLOAD_BYTES = 25 * 1024 * 1024

# Pre-compiled regex for local network CORS origins (HTTP and HTTPS)
# Covers all RFC 1918 private ranges (192.168.*, 10.*, 172.16-31.*) and .local mDNS hostnames
_LAN_ORIGIN_RE = re.compile(
    r"^https?://("
    r"192\.168\.\d{1,3}\.\d{1,3}"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
    r"|[a-zA-Z0-9\-]+\.local"
    r")(:\d+)?$"
)


def _unique_path(directory, filename):
    """Return a non-colliding path in directory, appending _1, _2, etc. if needed."""
    dest = directory / filename
    if not dest.exists():
        return dest
    stem, suffix = dest.stem, dest.suffix
    counter = 1
    while dest.exists():
        dest = directory / f"{stem}_{counter}{suffix}"
        counter += 1
    return dest


def _extract_version(web_dir, version_prefix):
    """Read the app version from sw.js CACHE_NAME using the given prefix.
    Supports both numeric (v5) and semantic (v1.54) version strings."""
    try:
        sw_text = (web_dir / "sw.js").read_text()
        m = re.search(rf'CACHE_NAME\s*=\s*"{re.escape(version_prefix)}([^"]+)"', sw_text)
        return m.group(1) if m else "0"
    except Exception:
        return "0"


def setup_error_logger(base_dir):
    """Create an error logger that writes to base_dir/logs/errors.log.
    Call once at startup. Returns the logger instance."""
    log_dir = base_dir / "logs"
    log_dir.mkdir(exist_ok=True)
    logger = logging.getLogger(f"server_errors_{base_dir.name}")
    logger.setLevel(logging.ERROR)
    if not logger.handlers:
        handler = logging.FileHandler(log_dir / "errors.log")
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
        logger.addHandler(handler)
    return logger


class LocalAppHandler(BaseHTTPRequestHandler):
    """Base HTTP handler for local-first web apps.

    Subclass and set class attributes, then override do_POST() for app-specific endpoints.

    Class attributes to set:
        WEB_DIR (Path): Directory containing static web files
        BLOCKED_FILES (set): Filenames that must never be served
        PORT (int): Server port (used for CORS)
        VERSION_PREFIX (str): Prefix for sw.js CACHE_NAME version (e.g. "myapp-v")
        CERTS_DIR (Path): Directory containing cert.pem and key.pem
    """
    WEB_DIR = None
    BLOCKED_FILES = set()
    PORT = 8765
    VERSION_PREFIX = "app-v"
    CERTS_DIR = None
    error_logger = None  # Set by run_server via setup_error_logger

    def do_GET(self):
        path = unquote(self.path.split("?")[0])

        if path == "/health":
            self._json_response({"status": "ok"})
            return

        if path == "/version":
            version = _extract_version(self.WEB_DIR, self.VERSION_PREFIX)
            self._json_response({"version": version})
            return

        # Serve static files
        if path == "/":
            path = "/index.html"
        elif path.endswith("/"):
            path = path + "index.html"

        filepath = self.WEB_DIR / path.lstrip("/")

        # Security: prevent directory traversal
        try:
            filepath = filepath.resolve()
            if not str(filepath).startswith(str(self.WEB_DIR)):
                self._error(403, "Forbidden")
                return
        except (ValueError, OSError):
            self._error(403, "Forbidden")
            return

        # Security: block sensitive files
        if filepath.name in self.BLOCKED_FILES:
            self._error(403, "Forbidden")
            return

        # Security: only serve known safe extensions
        ext = filepath.suffix.lower()
        if ext not in SERVEABLE_EXTENSIONS:
            self._error(403, "Forbidden")
            return

        if filepath.is_file():
            mime = MIME_TYPES.get(ext, "application/octet-stream")
            data = filepath.read_bytes()
            self.send_response(200)
            self._cors_headers()
            self.send_header("Content-Type", mime)
            # Gzip large JS files for faster mobile transfer
            accept_enc = self.headers.get("Accept-Encoding", "")
            if "gzip" in accept_enc and ext == ".js" and len(data) > 10000:
                data = gzip.compress(data)
                self.send_header("Content-Encoding", "gzip")
            # Prevent iOS from caching sw.js — must always fetch fresh for updates.
            # Also use no-store for HTML/JS/CSS so dev changes are never stale
            # (browsers treat no-cache without ETag/Last-Modified as permanent cache).
            if filepath.name == "sw.js" or ext in (".html", ".js", ".css", ".mjs"):
                self.send_header("Cache-Control", "no-store")
            else:
                self.send_header("Cache-Control", "no-cache")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self._error(404, "Not Found")

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _parse_multipart(self, body, boundary):
        """Simple multipart form data parser to extract file."""
        boundary_bytes = boundary.encode()
        parts = body.split(b"--" + boundary_bytes)

        for part in parts:
            if b"Content-Disposition" not in part:
                continue

            # Extract headers and body
            header_end = part.find(b"\r\n\r\n")
            if header_end == -1:
                continue

            headers = part[:header_end].decode("utf-8", errors="replace")
            file_body = part[header_end + 4:]

            # Strip the single trailing CRLF before the next boundary
            if file_body.endswith(b"\r\n--"):
                file_body = file_body[:-4]
            elif file_body.endswith(b"\r\n"):
                file_body = file_body[:-2]

            # Extract filename
            fname_match = re.search(r'filename="([^"]+)"', headers)
            if fname_match:
                return fname_match.group(1), file_body

        return None, None

    def _json_response(self, data, status=200):
        """Send a JSON response."""
        self.send_response(status)
        self._cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _error(self, status, message):
        """Send an error response."""
        self.send_response(status)
        self._cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode("utf-8"))

    def _log_error(self, endpoint, exc):
        """Log an error with full traceback to errors.log."""
        if self.error_logger:
            self.error_logger.error("%s: %s\n%s", endpoint, exc, traceback.format_exc())

    def _cors_headers(self):
        """Add CORS headers to response (call after send_response)."""
        origin = self.headers.get("Origin", "")
        # Allow localhost, local network IPs, and null (WKWebView file://)
        allowed = (
            origin in (
                f"http://localhost:{self.PORT}", f"http://127.0.0.1:{self.PORT}",
                f"https://localhost:{self.PORT}", f"https://127.0.0.1:{self.PORT}",
            )
            or origin == "null"
            or _LAN_ORIGIN_RE.match(origin)
        )
        self.send_header(
            "Access-Control-Allow-Origin", origin if allowed else f"http://localhost:{self.PORT}"
        )
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[{self.log_date_time_string()}] {format % args}")


class DualStackHTTPServer(HTTPServer):
    """HTTP server that listens on both IPv4 and IPv6 (dual-stack)."""
    address_family = socket.AF_INET6

    allow_reuse_address = True

    def server_bind(self):
        # Allow dual-stack: IPv6 socket accepts IPv4 connections too
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


class HealthCheckHandler(BaseHTTPRequestHandler):
    """Minimal HTTP handler that serves /health and parameterized /version."""
    _web_dir = None
    _version_prefix = "app-v"

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        elif self.path == "/version":
            version = _extract_version(self._web_dir, self._version_prefix)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"version": version}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Silence health-check logs


def run_server(handler_class, port, certs_dir, health_port, app_name):
    """Start the HTTPS server (falls back to HTTP if no certs).

    Args:
        handler_class: BaseHTTPRequestHandler subclass (must have WEB_DIR, VERSION_PREFIX)
        port: Main server port
        certs_dir: Path to directory containing cert.pem and key.pem
        health_port: Port for plain HTTP health-check server
        app_name: Display name for log messages
    """
    # Set up error logging for this app
    base_dir = certs_dir.parent if certs_dir else Path(".")
    error_logger = setup_error_logger(base_dir)
    handler_class.error_logger = error_logger

    server = DualStackHTTPServer(("::", port), handler_class)

    cert_file = certs_dir / "cert.pem"
    key_file = certs_dir / "key.pem"
    use_https = cert_file.exists() and key_file.exists()
    if use_https:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(str(cert_file), str(key_file))
        server.socket = ctx.wrap_socket(server.socket, server_side=True)
        print(f"{app_name} server running at https://localhost:{port}")

        # Start plain HTTP health-check server for PWA standalone mode
        # Create a handler class with the right config
        health_handler = type("AppHealthHandler", (HealthCheckHandler,), {
            "_web_dir": handler_class.WEB_DIR,
            "_version_prefix": handler_class.VERSION_PREFIX,
        })
        health_server = DualStackHTTPServer(("::", health_port), health_handler)
        health_thread = threading.Thread(target=health_server.serve_forever, daemon=True)
        health_thread.start()
        print(f"Health-check HTTP server on port {health_port}")
    else:
        print(f"{app_name} server running at http://localhost:{port} (no certs found)")

    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()
    except Exception as e:
        error_logger.error("Server crashed: %s\n%s", e, traceback.format_exc())
        raise
