/**
 * BGS FAQ Callcenter → Google Sheet logger (Google Apps Script web app).
 *
 * Setup (once, about 2 minutes):
 *  1. Open the Google Sheet → Extensions → Apps Script. Replace Code.gs with this file.
 *  2. Project Settings (gear) → Script properties → add  SECRET = <long random string>
 *     (the same value goes into the app's SHEET_WEBHOOK_SECRET).
 *  3. Deploy → New deployment → type "Web app"
 *       Execute as: Me    Who has access: Anyone
 *     Copy the Web app URL into the app's SHEET_WEBHOOK_URL.
 *  4. After editing this file later: Deploy → Manage deployments → Edit → Version "New version".
 *
 * The app's server is the only caller; every request must carry the shared SECRET.
 * Tabs and header rows are created automatically on first use.
 */

var TABS = {
  report: {
    name: "reports",
    headers: [
      "เวลา",
      "ช่องทาง",
      "ชื่อ - สกุล ผู้แจ้ง",
      "ตำแหน่งงาน",
      "รหัสหน่วยงาน",
      "ชื่อหน่วยงาน",
      "เบอร์ติดต่อ",
      "อีเมล",
      "เลข AnyDesk",
      "รายละเอียดปัญหา",
      "สถานะ",
    ],
  },
  view: {
    name: "views",
    headers: ["เวลา", "รหัสหัวข้อ", "หัวข้อ", "หมวด"],
  },
};

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || body.secret !== secret) return json({ ok: false, error: "unauthorized" });

    var tab = TABS[body.kind];
    if (!tab || !Array.isArray(body.row)) return json({ ok: false, error: "bad request" });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = ensureSheet(tab);
      var row = [new Date()].concat(body.row.map(clean));
      if (body.kind === "report") row.push("ใหม่");
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function ensureSheet(tab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tab.name) || ss.insertSheet(tab.name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(tab.headers);
    sheet.getRange(1, 1, 1, tab.headers.length).setFontWeight("bold").setBackground("#d6efe2");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Text only, length-capped, and never interpreted as a formula (=, +, -, @, tab, CR). */
function clean(value) {
  var s = String(value == null ? "" : value).slice(0, 2000);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
