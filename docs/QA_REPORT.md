# QA report

Tested 2026-10-02 in the browser against a local HTTP server before deployment.

| Check | Result |
|---|---|
| Recipe JSON | PASS — 26 recipes, 26 unique IDs, required ingredients and steps present |
| Local images | PASS — 26/26 paths exist; visible images loaded with positive natural width |
| JavaScript syntax | PASS — all eight modules pass `node --check` |
| Local HTTP | PASS — index and static assets served normally |
| Splash / Home / recommendation | PASS |
| Random and quick 15-minute recommendation | PASS |
| Search / category / time / difficulty UI | PASS — 김치 search exercised after 15-minute filter |
| Recipe detail / ingredient checkboxes | PASS |
| Shopping add / check UI / reload persistence | PASS — three required ingredients remained after reload |
| Cooking mode | PASS — first, next, and previous state verified |
| Speech | PASS for browser API call, `ko-KR`, route-change cancel path; audible Korean voice quality remains device-dependent |
| Ingredient selection / matching | PASS — ready-now and one-or-two-missing groups verified |
| Hash route refresh | PASS — shopping route restored after reload |
| API disabled fallback | PASS — `API_URL` empty and full app rendered from fallback JSON |
| 360px viewport | PASS — no horizontal overflow |
| 390×844 viewport | PASS — visual inspection and no horizontal overflow |
| 430px viewport | PASS — no horizontal overflow |
| 1440px viewport | PASS — centered 520px app and no horizontal overflow |
| Browser console warnings/errors | PASS — 0 |
| GitHub Pages build | PASS — branch build completed successfully |
| Production HTTP | PASS — `https://johnpark236-tech.github.io/todaycook/` returned 200 |
| Production home / image loading | PASS — 390×844, visible images loaded, no horizontal overflow |
| Production recipe / cooking route | PASS — 김치찌개 detail and `#/cook/kimchi-jjigae` verified |
| Production console warnings/errors | PASS — 0 |

Deletion controls are implemented but were not destructively exercised in browser automation. Their state functions use filtered array writes to the same storage key.

The speech implementation sets `ko-KR`, reacts to delayed voice loading, cancels before a new utterance and on route changes, and leaves all non-speech functionality available when unsupported.
