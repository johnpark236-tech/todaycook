# TodayCook architecture

```text
Mobile/Desktop browser
  ├─ GitHub Pages: vanilla HTML/CSS/JavaScript SPA
  ├─ Browser: MP3 playback + localStorage
  └─ Google Apps Script Web App
       ├─ GET recipe/settings API
       ├─ POST /api/tts
       │    └─ Google Cloud Text-to-Speech (ko-KR Neural2)
       └─ Google Sheet: Recipes / Ingredients / Settings
```

The frontend uses hash routes so refresh and deep links work on GitHub Pages. `js/api.js` reads the Apps Script URL from `js/config.js`; recipe data still falls back to `data/recipes-fallback.json` when the live API is unavailable.

Speech no longer depends on browser `speechSynthesis`. `js/speech.js` sends normalized Korean cooking text to the Apps Script `/api/tts` endpoint, receives base64 MP3 data, converts it to a browser object URL, and plays it with `Audio`. The client keeps a small in-memory audio cache. The Apps Script also caches short generated MP3 payloads and applies a configurable daily character guard before calling Google Cloud TTS.

The Apps Script calls Google Cloud Text-to-Speech with a server-side OAuth token. No Google API key or service-account JSON is placed in the frontend repository. Default voice is `ko-KR-Neural2-A` and default speaking rate is `0.94`; both can be overridden through Script Properties.

Shopping state is browser-local under `todaycook.shopping.v1`.

Routes: `#/home`, `#/recipes`, `#/recipe/:id`, `#/cook/:id`, `#/shopping`, `#/ingredients`.
