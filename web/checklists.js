// Bridge Habit Map — checklist data
// Edit freely. Each item: { id, text }. Groups have a title.

const CHECKLISTS = {

  auction: {
    title: "Auction",
    subtitle: "Same for declarer & defender — run during the bidding",
    groups: [
      {
        title: "General",
        items: [
          { id: "a1", text: "Check vulnerability" },
          { id: "a2", text: "Use every bid to get info — partner + opps → HCP + shape" },
          { id: "a3", text: "Start from minimum length & min HCP promised — refine as bids land" },
          { id: "a4", text: "Bids not made are as important as bids made (e.g. passed → not 1 opener, no 6-card major)" },
          { id: "a5", text: "Remember conventions tend to show the bidder's shape / HCP" },
          { id: "a6", text: "By end of auction — summarise what you know about opps + partner" },
        ],
      },
      {
        title: "Lead prep (if you'll be on lead)",
        items: [
          { id: "a7", text: "Pick a tentative opening lead during the auction, not after" },
          { id: "a8", text: "Watch for lead-directing double opportunities on artificial bids" },
        ],
      },
      {
        title: "Uncontested auction",
        items: [
          { id: "bid1", text: "Bid slightly conservatively — invite when you can rather than just bidding game" },
          { id: "bid2", text: "Good hand → follow the auction and partner's positivity (or lack of it)" },
          { id: "bid3", text: "Bid of a minor after 4th-hand protection shows a weak 2 in that minor" },
          { id: "bid4", text: "Responder reverse shows 12+ — game force" },
        ],
      },
      {
        title: "Competitive auction",
        items: [
          { id: "bid5", text: "If it's our hand → bid our contract, or Dbl" },
          { id: "bid6", text: "Fit + opps support a suit + you have length or shortage → need fewer points for game (~20)" },
          { id: "bid7", text: "After our T/O Dbl: NT from responder tends to show a max hand" },
          { id: "bid8", text: "After our T/O Dbl: a new suit or NT is strong" },
          { id: "bid9", text: "After our Neg Dbl: a new suit is a weak 6-card suit" },
          { id: "bid10", text: "Opps sacrifice → partner's Dbl is for penalties" },
          { id: "bid11", text: "Opps sacrifice → Pass is a forcing pass (partner must Dbl or bid the suit again)" },
          { id: "bid12", text: "Opps sacrifice → bidding the suit again shows the strongest hand" },
        ],
      },
      {
        title: "Bidding cautions",
        items: [
          { id: "bid13", text: "You can reopen with a Dbl" },
          { id: "bid14", text: "When opps bid strangely, be careful" },
          { id: "bid15", text: "After you T/O and opps make a game try — don't push the bidding" },
        ],
      },
      {
        title: "Scoring strategy (IMPs vs Matchpoints)",
        items: [
          { id: "imp1", text: "IMPs: bid games & small slams aggressively; MPs: only bid high-confidence games/slams" },
          { id: "imp2", text: "IMPs: don't bid part-scores too aggressively; MPs: bid part-scores aggressively" },
          { id: "imp3", text: "IMPs: don't Dbl into game; MPs: Dbl aggressively" },
          { id: "imp4", text: "MPs: play with the field — favour the higher-probability outcome" },
          { id: "imp5", text: "Cautious: don't Dbl part-scores into game unless 100% it's off" },
          { id: "imp6", text: "Cautious: don't sacrifice unless confident you're only 1 off — a phantom sac is lethal" },
          { id: "imp7", text: "Cautious: don't bid grand slams unless 100% making; don't open 3-level on a poor suit/hand" },
          { id: "imp8", text: "Bullish: bid tight vulnerable games; at favourable vul, push opps to the 3 level" },
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
      {
        title: "Pre-play evaluation",
        items: [
          { id: "dcp1", text: "Count points for us and the defenders" },
          { id: "dcp2", text: "Count our winners and losers" },
          { id: "dcp3", text: "Use info from opps' bidding and passing" },
          { id: "dcp4", text: "Use info from the opening lead" },
          { id: "dcp5", text: "Work out likely suit splits and where opps' high cards sit" },
        ],
      },
      {
        title: "Design the play",
        items: [
          { id: "dcp6", text: "Tricks to create = contract − winners" },
          { id: "dcp7", text: "Tools: ruff in short hand, create shortage for a ruff, cross-ruff, finesse" },
          { id: "dcp8", text: "Look for loser-on-loser elimination, squeeze, or throw-in" },
          { id: "dcp9", text: "Confirm entries for the planned play" },
          { id: "dcp10", text: "Decide when and how to draw trumps" },
        ],
      },
      {
        title: "Playing it out",
        items: [
          { id: "dcp11", text: "Don't be afraid to draw trumps even on a misfit" },
          { id: "dcp12", text: "If cross-ruffing, set up side suits first" },
          { id: "dcp13", text: "Play safe / the percentages — allow for 4-1 or 3-0 splits when a finesse is on" },
          { id: "dcp14", text: "If drawing trumps, make sure you have no suit losers in the short-trump hand" },
          { id: "dcp15", text: "Find losers in the long hand — discard them on dummy's winners" },
          { id: "dcp16", text: "In NT, if they lead your hidden 5-card suit, still play the hand properly" },
          { id: "dcp17", text: "If the outcome is fixed, try to fool the opps and sneak a trick" },
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
      {
        title: "Defensive evaluation",
        items: [
          { id: "dfp1", text: "REAP — Zia update" },
          { id: "dfp2", text: "In competitive auctions, weigh partner's bids — especially the no-bids" },
          { id: "dfp3", text: "At trick 1, fix declarer's and partner's points and shape" },
        ],
      },
      {
        title: "Defensive play",
        items: [
          { id: "dfp4", text: "Changing suit: high discourages, low encourages the same-suit return" },
          { id: "dfp5", text: "Partner's discouraging opening lead → think about where his values are" },
        ],
      },
      {
        title: "Leads",
        items: [
          { id: "dfp6", text: "Lead a trump if opps are playing in their second suit (cut dummy's ruffs)" },
          { id: "dfp7", text: "Lead the ace of our suit if you have it — don't underlead it" },
          { id: "dfp8", text: "Don't lead trumps on a misfit unless it reduces ruffing" },
        ],
      },
      {
        title: "Signals & declarer set-ups",
        items: [
          { id: "dfp9", text: "Give and look for all defensive signals" },
          { id: "dfp10", text: "When signalling, don't make dummy's cards high" },
          { id: "dfp11", text: "Don't make dummy high or give declarer discards — if you must, take your tricks" },
          { id: "dfp12", text: "Careful cashing winners at the end unless you know you won't set up declarer" },
          { id: "dfp13", text: "Always reduce dummy's trumps if a short-suit ruff is possible" },
        ],
      },
    ],
  },

};
