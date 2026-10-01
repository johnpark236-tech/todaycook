# ChatGPT / Codex maintenance map

| Key | Value |
|---|---|
| PROJECT_NAME | TodayCook |
| REPOSITORY | https://github.com/johnpark236-tech/todaycook |
| BRANCH | main |
| DEPLOYMENT_URL | https://johnpark236-tech.github.io/todaycook/ |
| MAIN_HTML | index.html |
| MAIN_CSS | css/app.css |
| CONFIG_FILE | js/config.js |
| RECIPE_FALLBACK_FILE | data/recipes-fallback.json |
| APPS_SCRIPT_FILE | apps-script/Code.gs, apps-script/SeedData.gs |
| SHEET_SCHEMA | Recipes, Ingredients, Settings |
| SPEECH_FILE | js/speech.js |
| SHOPPING_FILE | js/shopping.js |
| INGREDIENT_MATCH_FILE | js/ingredients.js |

## Maintenance rules

1. Read the related repository files before changing anything; never guess the structure.
2. Confirm the latest commit/SHA and work from `main`.
3. Change only necessary files. Do not rewrite the whole project for a small request.
4. Never change the Apps Script URL or Google Sheet ID without an explicit deployment change.
5. Never print or commit secrets, OAuth tokens, API keys, passwords, or credentials.
6. Commit and push the focused change, report the commit SHA, and check the GitHub Pages build.
7. Open the production URL and verify the affected route. Never report a failed or unverified deployment as successful.

## Natural-language request routing

- “홈 화면 제목 바꿔줘.” → `js/config.js` or the home view in `js/app.js`.
- “카드 글씨 크게 해줘.” → `css/app.css`.
- “새 레시피 추가해줘.” → Google Sheet CMS and `data/recipes-fallback.json` for offline parity.
- “음성 속도 조금 느리게 해줘.” → `js/speech.js`.
- “추천 카드 이미지 크게 해줘.” → `css/app.css` hero rules.

After a recipe content change, keep the Sheet and fallback JSON aligned. Image files belong in `assets/recipes/` and must be recorded in `assets/recipes/manifest.json`.
