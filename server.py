#!/usr/bin/env python3
"""
Bridge Habit Map — local server.

Uses ~/Claude Generic/starters/browser-pwa-firebase/server_base.py patterns:
- Falls back to HTTP if no certs in ./certs/
- Generate self-signed certs to enable iOS home-screen PWA install:
    cd certs
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes \\
      -subj "/CN=BridgeHabitMap" -addext "subjectAltName=DNS:$(hostname).local"
"""

from pathlib import Path
from server_base import LocalAppHandler, run_server


PORT = 8791
HEALTH_PORT = 8792
BASE_DIR = Path(__file__).parent.resolve()


class HabitMapHandler(LocalAppHandler):
    WEB_DIR = BASE_DIR / "web"
    PORT = PORT
    VERSION_PREFIX = "habit-map-v"
    CERTS_DIR = BASE_DIR / "certs"


if __name__ == "__main__":
    run_server(
        handler_class=HabitMapHandler,
        port=PORT,
        certs_dir=BASE_DIR / "certs",
        health_port=HEALTH_PORT,
        app_name="Bridge Habit Map",
    )
