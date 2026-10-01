# TodayCook architecture

```text
Mobile/Desktop browser
  ├─ GitHub Pages: vanilla HTML/CSS/JavaScript SPA
  ├─ Browser APIs: speechSynthesis + localStorage
  └─ Google Apps Script Web App (optional live CMS)
       └─ Google Sheet: Recipes / Ingredients / Settings
```

The frontend uses hash routes so refresh and deep links work on GitHub Pages. `js/api.js` reads the Apps Script URL only from `js/config.js`; when it is empty, times out, or returns invalid data, the app silently uses `data/recipes-fallback.json`. Shopping state is browser-local under `todaycook.shopping.v1`. No authentication or secret is required for the public read-only API.

Routes: `#/home`, `#/recipes`, `#/recipe/:id`, `#/cook/:id`, `#/shopping`, `#/ingredients`.
