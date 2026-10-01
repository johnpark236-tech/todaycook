# TodayCook Google Apps Script

1. GitHub Pages 배포가 완료된 뒤 Google Drive에서 `TodayCook_Data` 스프레드시트를 만듭니다.
2. **확장 프로그램 → Apps Script**를 열고 `Code.gs`, `SeedData.gs` 내용을 복사합니다.
3. `initializeTodayCook()`를 한 번 실행하고 Google 권한을 승인합니다. 이 함수는 ID 기준 upsert라 다시 실행해도 중복 행을 만들지 않습니다.
4. **배포 → 새 배포 → 웹 앱**을 선택합니다. 실행 사용자는 본인, 액세스 사용자는 `모든 사용자`로 설정합니다.
5. 배포 URL을 `js/config.js`의 `API_URL`에 넣고 커밋합니다.
6. `?action=health`, `?action=recipes`, `?action=recipe&id=kimchi-jjigae`, `?action=ingredients`, `?action=settings`를 확인합니다.

API는 공개 읽기 전용입니다. 쓰기 엔드포인트나 비밀 키는 포함하지 않습니다.
