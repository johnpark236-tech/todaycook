const RECIPES_HEADER = ['id','name','description','category','difficulty','timeMinutes','servings','imageUrl','tagsJson','ingredientsJson','stepsJson','tipsJson','enabled','sortOrder','updatedAt'];
const INGREDIENTS_HEADER = ['id','name','category','aliases','enabled','sortOrder'];
const SETTINGS_HEADER = ['key','value','description'];
const FALLBACK_DATA_URL = 'https://johnpark236-tech.github.io/todaycook/data/recipes-fallback.json';

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
  const baseUrl = 'https://johnpark236-tech.github.io/todaycook/';
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
    ['APP_NAME','오늘 무엇을 요리하지?','앱 이름'],
    ['TAGLINE','오늘도 맛있는 집밥 한 끼','홈 태그라인'],
    ['HOME_TITLE','오늘은 어떤 집밥이 좋을까요?','홈 제목'],
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
  if (/돼지|소고기|닭고기|참치|멸치|바지락/.test(name)) return '단백질';
  if (/간장|소금|고추장|된장|고춧가루|마늘|참기름|올리고당|마요네즈|새우젓/.test(name)) return '양념';
  if (/밥|소면|라면/.test(name)) return '곡물/면';
  return '채소/기타';
}

function formatSheets_(sheets) {
  sheets.forEach(function (sheet) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#ff6b35').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), 8));
  });
}
