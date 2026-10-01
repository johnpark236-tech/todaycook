# 오늘 뭐먹지? · 간식편

기존 `todaycook` 집밥편의 모바일 UX와 단계별 레시피 구조를 재사용해 만든 **간식 전용 에디션**입니다.

## 콘셉트

- 스마트폰 9:16 모바일 우선
- 큰 글씨 / 큰 터치 영역
- 오늘의 추천 간식 1개를 가장 크게 노출
- 5~20분 안에 만들 수 있는 초보자 간식 중심
- 단계별 조리 카드
- 장보기
- 집에 있는 재료로 간식 추천
- Google Cloud TTS 구조 재사용
- 직접 제작한 SVG 간식 일러스트 포함

## 현재 간식 12종

길거리 계란토스트, 프렌치토스트, 떡꼬치, 컵 떡볶이, 콘치즈, 고구마 맛탕, 버터 감자구이, 바나나 팬케이크, 과일 요거트볼, 라면땅, 컵 계란빵, 초코 머그케이크.

## 이미지

모든 대표 이미지는 `assets/snacks/*.svg`에 저장되어 있으며 외부 이미지 URL에 의존하지 않습니다.

## 현재 Git 상태

이 브랜치는 새 독립 저장소로 옮길 수 있도록 준비한 간식편 스테이징 버전입니다.

- Base repository: `johnpark236-tech/todaycook`
- Branch: `project/todayeat-snack`
- Intended new project name: `오늘 뭐먹지? · 간식편`

기존 `main` 집밥편은 수정하지 않습니다.

## 실행

정적 서버에서 실행:

```bash
python -m http.server 8080
```

브라우저:

```text
http://localhost:8080/#/home
```

Google Apps Script URL이 비어 있으면 로컬 JSON 레시피로 동작합니다.
