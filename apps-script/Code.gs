// Easy Gold Raffle — Google Apps Script backend
// Deploy as: Web App | Execute as: Me | Who has access: Anyone
//
// Replace this value before deploying:
var SHEET_ID = '1HZKo3pipY0u6tASv5fM3SHi8rsL7NLi3THE1ERTTHVM';

var DRAWS_SHEET   = 'Draws';
var WINNERS_SHEET = 'Winners';

/* ──────────────────────────────────────────────────────────── *
 * GET  ?action=history  → returns all draws + winners as JSON *
 * ──────────────────────────────────────────────────────────── */
function doGet(e) {
  try {
    ensureSheets();
    var draws   = getDraws();
    var winners = getWinners();

    // Attach winners to each draw
    var result = draws.map(function(draw) {
      draw.winners = winners.filter(function(w) { return w.drawId === draw.id; });
      return draw;
    });

    return jsonResponse({ draws: result });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

/* ──────────────────────────────────────────────────────────── *
 * POST  body: DrawResult JSON  → saves draw + winners         *
 * ──────────────────────────────────────────────────────────── */
function doPost(e) {
  try {
    ensureSheets();
    var data = JSON.parse(e.postData.contents);
    saveDraw(data);
    saveWinners(data);
    return jsonResponse({ success: true, id: data.id });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

/* ── Sheet helpers ─────────────────────────────────────────── */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function ensureSheets() {
  var ss = getSpreadsheet();

  if (!ss.getSheetByName(DRAWS_SHEET)) {
    var s = ss.insertSheet(DRAWS_SHEET);
    s.appendRow(['id', 'drawName', 'date', 'tiersCount', 'totalWinners', 'tiers']);
  }

  if (!ss.getSheetByName(WINNERS_SHEET)) {
    var s2 = ss.insertSheet(WINNERS_SHEET);
    s2.appendRow(['drawId', 'tierId', 'tierName', 'tierPrize', 'winnerName', 'winnerDept', 'ticketId', 'drawnAt']);
  }
}

function saveDraw(data) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(DRAWS_SHEET);
  sheet.appendRow([
    data.id,
    data.drawName,
    data.date,
    (data.tiers || []).length,
    (data.winners || []).length,
    JSON.stringify(data.tiers || [])
  ]);
}

function saveWinners(data) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(WINNERS_SHEET);
  (data.winners || []).forEach(function(w) {
    sheet.appendRow([
      data.id,
      w.tier.id,
      w.tier.name,
      w.tier.prize,
      w.participant.name,
      w.participant.department,
      w.participant.ticketId,
      w.drawnAt
    ]);
  });
}

function getDraws() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(DRAWS_SHEET);
  if (!sheet) return [];
  var rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(function(r) {
    var tiers = [];
    try { tiers = JSON.parse(r[5] || '[]'); } catch(e) {}
    return {
      id:           r[0],
      drawName:     r[1],
      date:         r[2],
      tiersCount:   r[3],
      totalWinners: r[4],
      tiers:        tiers,
      winners:      []
    };
  }).reverse(); // newest first
}

function getWinners() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(WINNERS_SHEET);
  if (!sheet) return [];
  var rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  return rows.slice(1).map(function(r) {
    return {
      drawId: r[0],
      tier: {
        id:    r[1],
        name:  r[2],
        prize: r[3]
      },
      participant: {
        name:       r[4],
        department: r[5],
        ticketId:   r[6]
      },
      drawnAt: r[7]
    };
  });
}

/* ── CORS / JSON helper ────────────────────────────────────── */
function jsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
