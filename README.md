# 오늘 무엇을 요리하지? · TodayCook

퇴근 후 “오늘 뭐 해먹지?”를 10초 안에 해결하도록 만든 모바일 우선 집밥 앱입니다. 26개 초보자 레시피, 검색과 필터, 단계별 조리 모드, 한국어 음성 읽기, 장보기 저장, 냉장고 재료 추천을 제공합니다.

## Features

- 오늘의 추천과 무작위 다시 추천
- 요리명·재료 검색, 카테고리·시간·난이도 필터
- 재료 체크와 초보자용 단계별 설명
- Google Cloud Text-to-Speech 기반 `ko-KR` 전체/현재 단계 읽기, 일시정지·다시 듣기
- `localStorage` 장보기 추가, 체크, 삭제, 새로고침 유지
- 보유 재료와 필수 재료 비교 추천
- Apps Script API 우선, 5초 내 실패 시 로컬 JSON fallback
- Mobile-first, safe-area, 44px 이상 터치 영역, PWA manifest

## Architecture

GitHub Pages → Google Apps Script Web App → Google Sheet (`Recipes`, `Ingredients`, `Settings`) + Google Cloud Text-to-Speech. 음성 합성은 서버측 Apps Script가 처리하고 브라우저는 MP3만 재생합니다. 장보기 상태는 브라우저 로컬 저장소를 사용합니다. 자세한 설명은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

## Run locally

정적 파일 서버를 사용하세요. 예: `python -m http.server 8080` 후 `http://localhost:8080/#/home`을 엽니다. `file://`에서는 JSON fetch가 제한될 수 있습니다.

## Google Sheet and Apps Script

[Google Sheet setup](docs/GOOGLE_SHEET_SETUP.md)과 [Apps Script guide](apps-script/README.md)를 따릅니다. 연결 전에도 앱은 fallback 데이터로 완전히 동작합니다.

## GitHub Pages

`main`에 push하면 GitHub Pages가 branch root에서 배포합니다. 운영 주소는 `https://johnpark236-tech.github.io/todaycook/`입니다.

## ChatGPT maintenance

향후 자연어 유지보수는 [docs/CHATGPT_MAINTENANCE.md](docs/CHATGPT_MAINTENANCE.md)의 파일 맵과 검증 절차를 따릅니다.

## Security

저장소와 프런트엔드에 OAuth token, service-account JSON, API key, GitHub token, password, credential, `.env` secret을 두지 않습니다. Google Cloud TTS 인증은 Apps Script의 서버측 OAuth 토큰으로 처리하며, 공개 TTS 호출에는 길이 제한·일일 문자 제한·캐시를 적용합니다.
