# Google Sheet setup

Create or open a spreadsheet named `TodayCook_Data`, open Apps Script, add the files from `apps-script/`, and run `initializeTodayCook()`. It creates or repairs these sheets:

- `Recipes`: id, name, description, category, difficulty, timeMinutes, servings, imageUrl, tagsJson, ingredientsJson, stepsJson, tipsJson, enabled, sortOrder, updatedAt
- `Ingredients`: id, name, category, aliases, enabled, sortOrder
- `Settings`: key, value, description

Deploy as a Web App executing as the owner and allow access to everyone. Paste the `/exec` URL into `window.TODAYCOOK_CONFIG.API_URL` in `js/config.js`. Validate every GET endpoint listed in `apps-script/README.md`. The frontend remains fully functional with local data until this account-authorized step is complete.
