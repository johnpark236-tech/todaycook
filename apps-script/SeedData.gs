const RECIPES_HEADER = ['id','name','description','category','difficulty','timeMinutes','servings','imageUrl','tagsJson','ingredientsJson','stepsJson','tipsJson','enabled','sortOrder','updatedAt'];
const INGREDIENTS_HEADER = ['id','name','category','aliases','enabled','sortOrder'];
const SETTINGS_HEADER = ['key','value','description'];
const FALLBACK_DATA_URL = 'https://raw.githubusercontent.com/johnpark236-tech/todaycook/project/todayeat-snack/data/recipes-fallback.json';

/**
 * Creates or updates TodayCook_Data. Safe to run repeatedly: recipe and ingredient rows are upserted by ID.
 * When bound to a spreadsheet, it uses the active spreadsheet; otherwise it creates TodayCook_Data.
 */
function initializeTodayCook() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) spreadsheet = SpreadsheetApp.create('TodayCook_Data');
  PropertiesService.getScriptProperties().setProperty('TODAYCOOK_SPREADSHEET_ID', spreadsheet.getId());

  const recipesSheet = ensureSheet_(spreadsheet, TODAYCOOK_SHEET_NAMES.RECIPES, RECIPES_HEADER);
  const ingredientsSheet = ensureSheet_(spreadsheet, TODAYCOOK_SHEET_NAMES.INGREDIENTS, INGREDIENTS_HEADER);
  const settingsSheet = ensureSheet_(spreadsheet, TODAYCOOK_SHEET_NAMES.SETTINGS, SETTINGS_HEADER);

  const recipes = fetchSeedRecipes_();
  const baseUrl = 'https://raw.githubusercontent.com/johnpark236-tech/todaycook/project/todayeat-snack/';
  const now = new Date().toISOString();
  const recipeRows = recipes.map(function (recipe, index) {
    return [recipe.id, recipe.name, recipe.description, recipe.category, recipe.difficulty, recipe.timeMinutes,
      recipe.servings, baseUrl + recipe.image, JSON.stringify(recipe.tags || []), JSON.stringify(recipe.ingredients || []),
      JSON.stringify(recipe.steps || []), JSON.stringify(recipe.tips || []), true, index + 1, now];
  });
  upsertRows_(recipesSheet, RECIPES_HEADER, recipeRows, 0);

  const ingredientMap = {};
  recipes.forEach(function (recipe) { (recipe.ingredients || []).forEach(function (item) { ingredientMap[item.id] = item.name; }); });
  const ingredientRows = Object.keys(ingredientMap).sort().map(function (id, index) {
    return [id, ingredientMap[id], ingredientCategory_(ingredientMap[id]), '', true, index + 1];
  });
  upsertRows_(ingredientsSheet, INGREDIENTS_HEADER, ingredientRows, 0);

  const settingRows = [
    ['APP_NAME','오늘 뭐먹지? · 간식편','앱 이름'],
    ['TAGLINE','오늘은 어떤 간식이 당길까요?','홈 태그라인'],
    ['HOME_TITLE','오늘 뭐먹지? 간식편','홈 제목'],
    ['FEATURE_SPEECH','true','음성 기능'],
    ['FEATURE_FRIDGE','true','재료 추천'],
    ['FEATURE_SHOPPING','true','장보기 목록']
  ];
  upsertRows_(settingsSheet, SETTINGS_HEADER, settingRows, 0);
  formatSheets_([recipesSheet, ingredientsSheet, settingsSheet]);
  Logger.log('TodayCook initialized: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function fetchSeedRecipes_() {
  const response = UrlFetchApp.fetch(FALLBACK_DATA_URL, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) throw new Error('Seed data download failed. Deploy GitHub Pages first: HTTP ' + response.getResponseCode());
  const parsed = JSON.parse(response.getContentText());
  if (!parsed.recipes || !parsed.recipes.length) throw new Error('Seed data has no recipes.');
  return parsed.recipes;
}

function ensureSheet_(spreadsheet, name, header) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, header.length).setValues([header]);
  else sheet.getRange(1, 1, 1, header.length).setValues([header]);
  return sheet;
}

function upsertRows_(sheet, header, incomingRows, idColumn) {
  const values = sheet.getDataRange().getValues();
  const rowById = {};
  for (let row = 1; row < values.length; row++) rowById[String(values[row][idColumn])] = row + 1;
  incomingRows.forEach(function (incoming) {
    const id = String(incoming[idColumn]);
    if (rowById[id]) sheet.getRange(rowById[id], 1, 1, header.length).setValues([incoming]);
    else sheet.appendRow(incoming);
  });
}

function ingredientCategory_(name) {
  if (/계란|우유|치즈|요거트/.test(name)) return '단백질/유제품';
  if (/소금|설탕|고추장|고춧가루|올리고당|마요네즈|케첩|버터|코코아|라면수프/.test(name)) return '양념/토핑';
  if (/식빵|밀가루|라면|떡/.test(name)) return '곡물/빵/떡';
  return '채소/기타';
}

function formatSheets_(sheets) {
  sheets.forEach(function (sheet) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#ff6b35').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), 8));
  });
}
