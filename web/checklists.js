// Bridge Habit Map — checklist data
// Edit freely. Each item: { id, text }. Groups have a title.

const CHECKLISTS = {

  auction: {
    title: "Auction",
    subtitle: "Same for declarer & defender — run during the bidding",
    groups: [
      {
        title: "Listen & anticipate",
        items: [
          { id: "a1", text: "Think during every bid — don't wait for your turn" },
          { id: "a2", text: "Convert each bid into shape + HCP for the bidder" },
          { id: "a3", text: "Note what's asked vs not asked (missing major = no 4-card major)" },
          { id: "a4", text: "Spot the system tools in play (Stayman, transfers, NMF, 4SF, cues)" },
        ],
      },
      {
        title: "Build the picture",
        items: [
          { id: "a5", text: "Form a mental shape-pattern for at least one opponent" },
          { id: "a6", text: "Start from minimum length promised — refine as bids land" },
          { id: "a7", text: "Add visible HCP, subtract from 40 → partner's range" },
        ],
      },
      {
        title: "Lead prep (if you'll be on lead)",
        items: [
          { id: "a8", text: "Pick a tentative opening lead during the auction, not after" },
          { id: "a9", text: "Watch for lead-directing double opportunities on artificial bids" },
        ],
      },
    ],
  },

  declarerCommon: {
    title: "Declarer — Plan",
    subtitle: "Pause 10s before calling from dummy",
    groups: [
      {
        title: "Discipline",
        items: [
          { id: "dc1", text: "Pause at least 10 seconds before playing from dummy" },
          { id: "dc2", text: "Treat it as a play problem handed to you on paper" },
          { id: "dc3", text: "Review the auction — what's bid, what's not" },
          { id: "dc4", text: "Analyse the opening lead — length, honor, shortness?" },
        ],
      },
    ],
  },

  declarerNT: {
    title: "Declarer — NT branch",
    subtitle: "",
    groups: [
      {
        title: "Count",
        items: [
          { id: "dn1", text: "Count sure winners (off the top)" },
          { id: "dn2", text: "Work out how many extra tricks needed" },
        ],
      },
      {
        title: "Source of extras",
        items: [
          { id: "dn3", text: "Pick suit(s) to develop — Force, Length, or Position" },
          { id: "dn4", text: "Prefer Force when you can afford to lose the lead" },
        ],
      },
      {
        title: "Hazards & control",
        items: [
          { id: "dn5", text: "How many tricks can defenders cash when in?" },
          { id: "dn6", text: "Identify the danger hand — who must you keep off lead?" },
          { id: "dn7", text: "Plan hold-ups to sever defensive communication" },
        ],
      },
      {
        title: "Execution",
        items: [
          { id: "dn8", text: "Plan entries between hands; unblock high cards" },
          { id: "dn9", text: "Decide which suit to attack first" },
          { id: "dn10", text: "Cash short-suit winners last if needed as entries" },
        ],
      },
    ],
  },

  declarerSuit: {
    title: "Declarer — Suit branch",
    subtitle: "",
    groups: [
      {
        title: "Count",
        items: [
          { id: "ds1", text: "Count losers in each suit" },
          { id: "ds2", text: "Pick a master hand (long-trump hand; stronger in 4-4)" },
          { id: "ds3", text: "Cross-check by counting winners" },
        ],
      },
      {
        title: "Source of extras",
        items: [
          { id: "ds4", text: "Can dummy cover losers? (ruffs, side-suit, finesse, throw-in)" },
          { id: "ds5", text: "Consider dummy reversal, cross-ruff, loser-on-loser, endplay" },
        ],
      },
      {
        title: "Trump management",
        items: [
          { id: "ds6", text: "Draw trumps now or postpone?" },
          { id: "ds7", text: "If ruffs needed in dummy — set up before drawing" },
          { id: "ds8", text: "Estimate trump leads needed; count opps' trumps as you go" },
        ],
      },
      {
        title: "Hazards & control",
        items: [
          { id: "ds9", text: "What will defenders attack when they get in?" },
          { id: "ds10", text: "Identify the danger hand — keep them off lead" },
        ],
      },
      {
        title: "Execution",
        items: [
          { id: "ds11", text: "Plan entries between hands" },
          { id: "ds12", text: "Decide order of attack across suits" },
        ],
      },
    ],
  },

  defender: {
    title: "Defender — Plan",
    subtitle: "Don't rush trick 1",
    groups: [
      {
        title: "Discipline",
        items: [
          { id: "df1", text: "Don't rush, don't get rushed — especially trick 1" },
          { id: "df2", text: "Have a reason for what you do" },
        ],
      },
      {
        title: "Count the points",
        items: [
          { id: "df3", text: "Add declarer + dummy HCP, subtract from 40" },
          { id: "df4", text: "Divide missing points using the auction" },
          { id: "df5", text: "If dummy is strong, give declarer minimum for their bid" },
        ],
      },
      {
        title: "Picture the unseen hands",
        items: [
          { id: "df6", text: "Build a hand-pattern for declarer (e.g. 3-5-3-2)" },
          { id: "df7", text: "Memorise your hand + dummy before playing" },
        ],
      },
      {
        title: "Count declarer's tricks",
        items: [
          { id: "df8", text: "Count declarer's distribution, HCP, and tricks" },
          { id: "df9", text: "No side-suit tricks for you? Look to trump (overruff, uppercut, promotion)" },
        ],
      },
      {
        title: "Identify the winning defense",
        items: [
          { id: "df10", text: "Which 2–3 declarer hand-patterns let you beat the contract?" },
          { id: "df11", text: "What suit does declarer fear?" },
        ],
      },
      {
        title: "Active or passive (binary)",
        items: [
          { id: "df12", text: "Long-suit declarer with a source of tricks → ACTIVE" },
          { id: "df13", text: "Balanced declarer, no obvious source → PASSIVE (don't break suits)" },
          { id: "df14", text: "Don't grab aces prematurely — aces capture kings" },
        ],
      },
      {
        title: "Opening lead (if on lead)",
        items: [
          { id: "df15", text: "Avoid suits opponents bid; favour unbid suits" },
          { id: "df16", text: "vs NT: 4th best from longest, or top of sequence" },
          { id: "df17", text: "vs suit: K from AK, top of doubleton; don't underlead an ace" },
          { id: "df18", text: "Trump lead if auction suggests a cross-ruff; not vs misfit" },
          { id: "df19", text: "Lead partner's bid suit unless you have a clear reason not to" },
        ],
      },
      {
        title: "Watch & remember",
        items: [
          { id: "df20", text: "Commit the first few cards from partner + declarer to memory" },
          { id: "df21", text: "Decide now which spot cards in which suits will matter" },
        ],
      },
    ],
  },

};
