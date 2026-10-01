# Google Cloud TTS MVP checklist

## Goal

Replace browser `speechSynthesis` with server-side Google Cloud Text-to-Speech and play generated MP3 in TodayCook.

## Implemented in code

- `POST /api/tts` route in Apps Script using `e.pathInfo`
- Server-side OAuth call to `https://texttospeech.googleapis.com/v1/text:synthesize`
- Default Korean voice `ko-KR-Neural2-A`
- Default speaking rate `0.94`
- MP3 response as base64 JSON
- Client MP3 playback with `Audio`
- Current-step listen button
- Pause / resume
- Replay
- Full-recipe listen
- Auto stop when changing step or route
- Korean cooking-unit normalization
- Client memory cache + server cache
- Configurable daily character guard
- User-facing failure message: `음성 연결을 확인해주세요.`

## External setup still required before live verification

- Enable Cloud Text-to-Speech API in the chosen Google Cloud project
- Confirm billing/quota
- Link/update Apps Script project and OAuth scopes
- Deploy a new Apps Script Web App version
- Put the deployment URL in `js/config.js`
- Test on Android Chrome and iOS Safari
- Verify first-play behavior, pause/resume, route changes, repeated cached playback, and network failure handling

Do not report Google TTS as live until these external steps and an actual MP3 playback test pass.
