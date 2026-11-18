/**
 * BGS FAQ Callcenter ↔ Google Sheet (Google Apps Script web app).
 *
 * Does two jobs for the app's server (the only caller; every request carries the SECRET):
 *  1. Logging  — appends rows to "reports" (problem reports) and "views" (topic views).
 *  2. Database — DATA_BACKEND=sheets: FAQ topics in "faq_topics", admin accounts in
 *                "admin_users" (read/insert/update with version checks under a lock).
 *  3. Counters — "usage_daily": daily usage counts (views, reports, helpful votes, visits)
 *                for every backend that keeps its counters here (DATA_BACKEND=sheets).
 *
 * Setup (once, about 2 minutes):
 *  1. Open the Google Sheet → Extensions → Apps Script. Replace Code.gs with this file.
 *  2. Project Settings (gear) → Script properties → add  SECRET = <long random string>
 *     (the same value goes into the app's SHEET_WEBHOOK_SECRET).
 *  3. Deploy → New deployment → type "Web app"
 *       Execute as: Me    Who has access: Anyone
 *     Copy the Web app URL into the app's SHEET_WEBHOOK_URL.
 *  4. Share the Sheet as "Restricted" — the script runs as you, so the app still works,
 *     and nobody else can read reporters' details or admin password hashes.
 *  5. After editing this file later: Deploy → Manage deployments → Edit → Version "New version".
 *
 * Tabs and header rows are created automatically on first use.
 * Do not edit "admin_users" by hand (password_hash must stay exactly as written by the app).
 */

var LOG_TABS = {
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
      "หัวข้อที่เปิดก่อนแจ้ง",
    ],
  },
  view: {
    name: "views",
    headers: ["เวลา", "รหัสหัวข้อ", "หัวข้อ", "หมวด"],
  },
};

var DATA_TABS = {
  topics: {
    name: "faq_topics",
    headers: [
      "id",
      "origin",
      "version",
      "hidden",
      "content_json",
      "draft_json",
      "created_at",
      "updated_at",
      "updated_by",
      "deleted",
    ],
  },
  settings: {
    name: "settings",
    headers: ["key", "value_json", "version"],
  },
  usage: {
    name: "usage_daily",
    headers: ["day", "kind", "topic_id", "count"],
  },
  admins: {
    name: "admin_users",
    headers: ["id", "email", "display_name", "role", "password_hash", "active"],
  },
};

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || body.secret !== secret) return json({ ok: false, error: "unauthorized" });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (body.kind) return json(appendLog(body));
      switch (body.action) {
        case "topics.list":
          return json({ ok: true, data: readRows(DATA_TABS.topics) });
        case "topics.upsert":
          return json(upsertTopic(body.row, body.expectedVersion));
        case "topics.delete":
          deleteRow(DATA_TABS.topics, String(body.id));
          return json({ ok: true });
        case "settings.get": {
          var setting = findRow(DATA_TABS.settings, "key", String(body.key));
          return json({ ok: true, data: setting ? setting.record : null });
        }
        case "settings.set":
          return json(setSetting(body));
        case "usage.increment":
          return json(incrementUsage(body));
        case "usage.list":
          return json({ ok: true, data: listUsage(body.sinceDay) });
        case "admins.list":
          return json({ ok: true, data: readRows(DATA_TABS.admins) });
        case "admins.upsert":
          return json(upsertAdmin(body.row));
        default:
          return json({ ok: false, error: "unknown action" });
      }
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ── Logging ──────────────────────────────────────────────────────────────

function appendLog(body) {
  var tab = LOG_TABS[body.kind];
  if (!tab || !Array.isArray(body.row)) return { ok: false, error: "bad request" };
  var sheet = ensureSheet(tab, false);
  var row = [new Date()].concat(
    body.row.map(function (v) {
      return clean(v, 2000);
    }),
  );
  if (body.kind === "report") row.push("ใหม่");
  // Columns added later go after "สถานะ" so older tabs keep their column order.
  if (Array.isArray(body.tail)) {
    body.tail.forEach(function (v) {
      row.push(clean(v, 2000));
    });
  }
  sheet.appendRow(row);
  return { ok: true };
}

// ── Database tabs ────────────────────────────────────────────────────────

function upsertTopic(row, expectedVersion) {
  var tab = DATA_TABS.topics;
  var found = findRow(tab, "id", row.id);
  if (expectedVersion === null || expectedVersion === undefined) {
    if (found) return { ok: false, conflict: true };
  } else if (!found || String(found.record.version) !== String(expectedVersion)) {
    return { ok: false, conflict: true };
  }
  writeRow(tab, found ? found.index : null, row);
  return { ok: true, data: row };
}

function setSetting(body) {
  var tab = DATA_TABS.settings;
  var found = findRow(tab, "key", String(body.key));
  var expected = body.expectedVersion;
  if (expected === null || expected === undefined) {
    if (found) return { ok: false, conflict: true };
  } else if (!found || String(found.record.version) !== String(expected)) {
    return { ok: false, conflict: true };
  }
  writeRow(tab, found ? found.index : null, {
    key: String(body.key),
    value_json: String(body.value_json),
    version: String(body.version),
  });
  return { ok: true };
}

function upsertAdmin(row) {
  var tab = DATA_TABS.admins;
  row.email = String(row.email).trim().toLowerCase();
  var sameEmail = findRow(tab, "email", row.email);
  if (sameEmail && sameEmail.record.id !== row.id) return { ok: false, conflict: true };
  var found = findRow(tab, "id", row.id);
  writeRow(tab, found ? found.index : null, row);
  return { ok: true, data: row };
}

// ── Usage counters ───────────────────────────────────────────────────────

var USAGE_KINDS = ["view", "report", "visit", "helpful", "unhelpful"];

/** Rows read from the bottom of "usage_daily" when looking for today's counter. */
var USAGE_TAIL_ROWS = 500;

/**
 * +1 on the (day, kind, topic_id) row; runs under the script lock taken in doPost.
 * Rows are appended day by day, so today's counters sit at the bottom: only the last
 * USAGE_TAIL_ROWS rows are read (never the whole tab, which grows forever). If a counter is
 * not found there a new row is added — a duplicate key is harmless because readers sum rows.
 */
function incrementUsage(body) {
  var day = String(body.day || "");
  var kind = String(body.kind || "");
  var topicId = String(body.topicId || "").slice(0, 100);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || USAGE_KINDS.indexOf(kind) === -1) {
    return { ok: false, error: "bad request" };
  }
  var tab = DATA_TABS.usage;
  var sheet = ensureSheet(tab, true);
  var last = sheet.getLastRow();
  var first = Math.max(2, last - USAGE_TAIL_ROWS + 1);
  if (last >= first) {
    var values = sheet.getRange(first, 1, last - first + 1, 4).getValues();
    for (var i = values.length - 1; i >= 0; i--) {
      var rowDay = String(values[i][0]);
      if (rowDay < day) break; // older days only from here up
      if (rowDay === day && String(values[i][1]) === kind && String(values[i][2]) === topicId) {
        var count = (Number(values[i][3]) || 0) + 1;
        writeRow(tab, first + i, { day: day, kind: kind, topic_id: topicId, count: String(count) });
        return { ok: true };
      }
    }
  }
  writeRow(tab, null, { day: day, kind: kind, topic_id: topicId, count: "1" });
  return { ok: true };
}

function listUsage(sinceDay) {
  var since = sinceDay ? String(sinceDay) : "";
  return readRows(DATA_TABS.usage).filter(function (row) {
    return !since || row.day >= since;
  });
}

function readRows(tab) {
  var sheet = ensureSheet(tab, true);
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    if (values[r].join("") === "") continue;
    var rec = {};
    for (var c = 0; c < header.length; c++) rec[header[c]] = String(values[r][c]);
    out.push(rec);
  }
  return out;
}

/** {index: sheet row number (1-based), record} or null. */
function findRow(tab, key, value) {
  var sheet = ensureSheet(tab, true);
  var values = sheet.getDataRange().getValues();
  var col = values[0].indexOf(key);
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][col]) === String(value)) {
      var rec = {};
      for (var c = 0; c < values[0].length; c++) rec[values[0][c]] = String(values[r][c]);
      return { index: r + 1, record: rec };
    }
  }
  return null;
}

function writeRow(tab, index, row) {
  var sheet = ensureSheet(tab, true);
  var cells = [
    tab.headers.map(function (h) {
      return clean(row[h], 45000);
    }),
  ];
  var target = index || sheet.getLastRow() + 1;
  var range = sheet.getRange(target, 1, 1, tab.headers.length);
  range.setNumberFormat("@");
  range.setValues(cells);
}

function deleteRow(tab, id) {
  var found = findRow(tab, "id", id);
  if (found) ensureSheet(tab, true).deleteRow(found.index);
}

// ── Helpers ──────────────────────────────────────────────────────────────

function ensureSheet(tab, plainText) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tab.name) || ss.insertSheet(tab.name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(tab.headers);
    sheet.getRange(1, 1, 1, tab.headers.length).setFontWeight("bold").setBackground("#d6efe2");
    sheet.setFrozenRows(1);
    // Data tabs are plain text so ids, versions and JSON are stored exactly as sent.
    if (plainText)
      sheet.getRange(1, 1, sheet.getMaxRows(), tab.headers.length).setNumberFormat("@");
  }
  return sheet;
}

/** Text only, length-capped, and never interpreted as a formula (=, +, -, @, tab, CR). */
function clean(value, max) {
  var s = String(value == null ? "" : value).slice(0, max);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
