# 명언 터미널

옛날 CRT 터미널 감성으로 무작위 명언을 출력하는 정적 웹 앱입니다.  
한글 번역 명언을 크게 보여주고, 원문과 저자/저서/언어/작성 시기를 함께 표시합니다.

## 기능

- 무작위 명언 출력
- 카테고리 필터 선택 후 실행
- 이전 명언으로 돌아가기
- 한글 읽기 / 원문 읽기
- 읽고 있는 단어 실시간 밑줄 표시
- 명언 복사
- CRT 스캔라인, 녹색 형광 글자, 터미널 효과음
- 별도 서버 없이 브라우저에서 실행 가능

## 실행 방법

파일을 내려받은 뒤 `index.html`을 브라우저에서 열면 됩니다.

```text
index.html
```

로컬에서 바로 열어도 동작하는 순수 HTML/CSS/JavaScript 프로젝트입니다.

## GitHub Pages 배포

GitHub 저장소에서 아래 순서로 설정하면 웹 주소로 공개할 수 있습니다.

1. `Settings`로 이동
2. `Pages` 메뉴 선택
3. `Build and deployment`에서 `Deploy from a branch` 선택
4. Branch를 `main`, 폴더를 `/root`로 설정
5. `Save`

배포 후 주소는 보통 아래 형태입니다.

```text
https://potatorious.github.io/quote-terminal/
```

## 파일 구조

```text
quote-terminal/
├─ index.html        # 화면 구조
├─ styles.css        # CRT 터미널 디자인
├─ app.js            # 무작위 출력, 필터, 음성 읽기, 효과음
├─ quotes-data.js    # 명언/저자 데이터
└─ README.md
```

## 명언 데이터 형식

명언 데이터는 `quotes-data.js`의 `window.QUOTE_DATA` 안에서 관리합니다.

- `authors`: 저자 이름, 생몰년, 언어 정보
- `quotes`: 명언 본문, 원문, 저서명, 작성 시기, 카테고리 태그

새 명언을 추가할 때는 기존 저자가 있으면 `quotes`에만 추가하고, 새 저자라면 `authors`에 저자 정보를 먼저 추가하면 됩니다.

## 추가하면 좋은 것

- `LICENSE`: 공개 저장소라면 사용 허가 범위를 명확히 하기
- `favicon`: 브라우저 탭 아이콘 추가
- `preview image`: GitHub README와 공유 링크용 미리보기 이미지
- `quotes-data.js` 정리 규칙: 명언 추가 시 데이터 형식 검증 스크립트 추가
- 명언 출처 검증: 전승 인용과 실제 저작 인용을 구분해서 신뢰도 표시

## 주의

브라우저 음성 읽기는 사용자의 운영체제와 브라우저에 설치된 음성 엔진을 사용합니다.  
따라서 같은 코드라도 PC마다 목소리, 발음, 지원 언어가 다르게 동작할 수 있습니다.
