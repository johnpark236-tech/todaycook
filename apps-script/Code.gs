/** TodayCook public API for recipes and server-side Google Cloud Text-to-Speech. */
const TODAYCOOK_SHEET_NAMES = Object.freeze({
  RECIPES: 'Recipes', INGREDIENTS: 'Ingredients', SETTINGS: 'Settings'
});
const TODAYCOOK_TTS_DEFAULTS = Object.freeze({
  LANGUAGE: 'ko-KR', VOICE: 'ko-KR-Neural2-A', RATE: 0.94, MAX_UTF8_BYTES: 4500
});

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health').toLowerCase();
    let data;
    if (action === 'health') data = { status: 'ok', service: 'TodayCook API', timestamp: new Date().toISOString(), tts: 'google-cloud' };
    else if (action === 'recipes') data = getRecipes_();
    else if (action === 'recipe') {
      const id = String((e.parameter && e.parameter.id) || '');
      data = getRecipes_().find(function (recipe) { return recipe.id === id; });
      if (!data) throw new Error('Recipe not found: ' + id);
    }
    else if (action === 'ingredients') data = readObjects_(TODAYCOOK_SHEET_NAMES.INGREDIENTS).filter(isEnabled_);
    else if (action === 'settings') data = settingsObject_();
    else throw new Error('Unknown action: ' + action);
    return json_({ ok: true, data: data });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const body = parsePostBody_(e);
    const path = String((e && e.pathInfo) || '').replace(/^\/+|\/+$/g, '').toLowerCase();
    const parameterAction = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
    const action = path === 'api/tts' ? 'tts' : String(body.action || parameterAction || '').toLowerCase();
    if (action !== 'tts') throw new Error('Unknown POST action: ' + action);
    return json_({ ok: true, data: synthesizeSpeech_(body) });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function synthesizeSpeech_(body) {
  const text = String((body && body.text) || '').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('TTS text is required.');
  const byteLength = Utilities.newBlob(text).getBytes().length;
  if (byteLength > TODAYCOOK_TTS_DEFAULTS.MAX_UTF8_BYTES) throw new Error('TTS text is too long.');

  const props = PropertiesService.getScriptProperties();
  const voice = props.getProperty('TODAYCOOK_TTS_VOICE') || TODAYCOOK_TTS_DEFAULTS.VOICE;
  const rate = Number(props.getProperty('TODAYCOOK_TTS_RATE') || TODAYCOOK_TTS_DEFAULTS.RATE);
  const cacheKey = 'tts:' + sha256_(voice + '|' + rate + '|' + text);
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) return { audioContent: cached, mimeType: 'audio/mpeg', voice: voice, rate: rate, cached: true };

  enforceTtsDailyLimit_(text, props);

  const requestBody = {
    input: { text: text },
    voice: { languageCode: TODAYCOOK_TTS_DEFAULTS.LANGUAGE, name: voice, ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: rate }
  };
  const headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  const projectId = props.getProperty('TODAYCOOK_GCP_PROJECT_ID');
  if (projectId) headers['x-goog-user-project'] = projectId;

  const response = UrlFetchApp.fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: headers,
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  const payload = parseJson_(response.getContentText(), {});
  if (status < 200 || status >= 300 || !payload.audioContent) {
    const message = payload && payload.error && payload.error.message ? payload.error.message : 'Google Cloud TTS request failed.';
    throw new Error('TTS ' + status + ': ' + message);
  }

  if (payload.audioContent.length < 90000) cache.put(cacheKey, payload.audioContent, 21600);
  return { audioContent: payload.audioContent, mimeType: 'audio/mpeg', voice: voice, rate: rate, cached: false };
}


function enforceTtsDailyLimit_(text, props) {
  const limit = Number(props.getProperty('TODAYCOOK_TTS_DAILY_CHAR_LIMIT') || 100000);
  if (!Number.isFinite(limit) || limit <= 0) return;
  const day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
  const key = 'TODAYCOOK_TTS_USAGE_' + day;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('TTS is busy. Please retry.');
  try {
    const used = Number(props.getProperty(key) || 0);
    const next = used + text.length;
    if (next > limit) throw new Error('Daily TTS limit reached.');
    props.setProperty(key, String(next));
  } finally {
    lock.releaseLock();
  }
}

function parsePostBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return parseJson_(e.postData.contents, {});
}

function sha256_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
}

function getRecipes_() {
  return readObjects_(TODAYCOOK_SHEET_NAMES.RECIPES)
    .filter(isEnabled_)
    .sort(function (a, b) { return Number(a.sortOrder || 0) - Number(b.sortOrder || 0); })
    .map(function (row) {
      return {
        id: row.id, name: row.name, description: row.description, category: row.category,
        difficulty: row.difficulty, timeMinutes: Number(row.timeMinutes), servings: Number(row.servings),
        image: row.imageUrl, tags: parseJson_(row.tagsJson, []), ingredients: parseJson_(row.ingredientsJson, []),
        steps: parseJson_(row.stepsJson, []), tips: parseJson_(row.tipsJson, [])
      };
    });
}

function readObjects_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing sheet: ' + sheetName + '. Run initializeTodayCook().');
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift().map(String);
  return values.filter(function (row) { return row.some(function (cell) { return cell !== ''; }); }).map(function (row) {
    return headers.reduce(function (result, header, index) { result[header] = row[index]; return result; }, {});
  });
}

function settingsObject_() {
  return readObjects_(TODAYCOOK_SHEET_NAMES.SETTINGS).reduce(function (result, row) {
    result[row.key] = row.value;
    return result;
  }, {});
}

function getSpreadsheet_() {
  const configuredId = PropertiesService.getScriptProperties().getProperty('TODAYCOOK_SPREADSHEET_ID');
  if (configuredId) return SpreadsheetApp.openById(configuredId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Spreadsheet is not configured. Run initializeTodayCook().');
  return active;
}

function isEnabled_(row) { return row.enabled === true || String(row.enabled).toLowerCase() === 'true' || row.enabled === 1; }
function parseJson_(value, fallback) { try { return value ? JSON.parse(String(value)) : fallback; } catch (error) { return fallback; } }
function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
