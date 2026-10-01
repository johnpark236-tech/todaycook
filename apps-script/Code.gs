/** TodayCook public read-only API for Google Apps Script Web App. */
const TODAYCOOK_SHEET_NAMES = Object.freeze({
  RECIPES: 'Recipes', INGREDIENTS: 'Ingredients', SETTINGS: 'Settings'
});

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health').toLowerCase();
    let data;
    if (action === 'health') data = { status: 'ok', service: 'TodayCook API', timestamp: new Date().toISOString() };
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
