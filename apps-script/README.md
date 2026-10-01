# TodayCook Google Apps Script

## 1. 기존 레시피 API 준비

1. Google Drive에서 `TodayCook_Data` 스프레드시트를 만들거나 기존 파일을 사용합니다.
2. **확장 프로그램 → Apps Script**를 엽니다.
3. 저장소의 `Code.gs`, `SeedData.gs` 내용을 반영합니다.
4. `initializeTodayCook()`를 한 번 실행하고 Google 권한을 승인합니다. 이 함수는 ID 기준 upsert라 다시 실행해도 중복 행을 만들지 않습니다.

## 2. Google Cloud Text-to-Speech 준비

1. Apps Script 프로젝트가 사용할 Google Cloud 프로젝트에서 **Cloud Text-to-Speech API**를 활성화합니다.
2. 해당 Cloud 프로젝트의 결제 상태와 TTS 사용 가능 여부를 확인합니다.
3. Apps Script의 매니페스트에 저장소의 `appsscript.json`과 동일한 OAuth scope를 반영합니다.
4. Apps Script 프로젝트 설정의 **스크립트 속성**에 아래 값을 설정합니다.

필수 권장값:

- `TODAYCOOK_GCP_PROJECT_ID`: TTS API가 활성화된 Google Cloud 프로젝트 ID

선택값:

- `TODAYCOOK_SPREADSHEET_ID`: 사용할 스프레드시트 ID
- `TODAYCOOK_TTS_VOICE`: 기본 `ko-KR-Neural2-A`
- `TODAYCOOK_TTS_RATE`: 기본 `0.94`
- `TODAYCOOK_TTS_DAILY_CHAR_LIMIT`: 기본 `100000`

API 키나 서비스 계정 JSON은 프런트 코드에 넣지 않습니다. Apps Script 서버가 `ScriptApp.getOAuthToken()`으로 Google Cloud TTS를 호출합니다.

## 3. 웹 앱 배포

1. **배포 → 새 배포 → 웹 앱**을 선택합니다.
2. 실행 사용자는 **본인**, 액세스 사용자는 MVP 테스트 범위에 맞게 설정합니다.
3. 배포 URL을 `js/config.js`의 `API_URL`에 넣습니다. TTS만 별도 서버를 쓸 경우 `TTS_API_URL`에 별도 URL을 넣을 수 있습니다.
4. 레시피 API를 확인합니다.
   - `?action=health`
   - `?action=recipes`
   - `?action=recipe&id=kimchi-jjigae`
   - `?action=ingredients`
   - `?action=settings`

## 4. TTS 확인

TTS 엔드포인트는 웹 앱 URL 뒤에 `/api/tts`를 붙입니다.

요청 본문 예시:

```json
{
  "action": "tts",
  "text": "첫 번째 단계입니다. 감자와 애호박을 2센티미터 크기로 썰어주세요."
}
```

정상 응답은 `ok: true`와 base64 `audioContent`를 반환합니다. 브라우저 프런트는 이를 MP3로 재생합니다.

오류 시 프런트 메시지는 **“음성 연결을 확인해주세요.”**로 통일합니다. 기존 **“이 브라우저에서는 음성 읽기를 지원하지 않아요.”** 메시지는 사용하지 않습니다.

## 5. 운영 보호

- 한 요청의 TTS 입력은 UTF-8 기준 4,500바이트 이하로 제한합니다.
- 짧은 MP3는 Apps Script 캐시에 저장해 동일 문장의 재호출을 줄입니다.
- 일일 문자 제한은 `TODAYCOOK_TTS_DAILY_CHAR_LIMIT`로 조절합니다.
- 공개 웹 앱 URL은 비밀값으로 간주하지 않습니다. 비용 보호를 위해 Cloud Billing 예산 알림과 API quota도 별도로 설정하는 것을 권장합니다.
