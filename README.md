# 명언 터미널

옛날 CRT 터미널 감성으로 무작위 명언을 출력하는 정적 웹 앱입니다.

첫 화면에서는 터미널 명령어와 시작 안내문만 표시하고, `실행`을 누르면 선택한 카테고리에 맞는 명언을 무작위로 출력합니다. 한글 번역 명언을 크게 보여주고, 원문과 저자/저서명/언어/작성 시기 정보를 함께 표시합니다.

## 주요 기능

- 시작 대기 화면
  - 한글 안내문과 깜박이는 터미널 커서
  - 원문 영역에는 기존 원문 출력 스타일과 같은 영어 안내문 표시
- 무작위 명언 출력
- 카테고리 필터 선택 후 실행
- 이전 명언으로 돌아가기
- 카테고리 패널 접기/펼치기
- 한글 읽기 / 원문 읽기
  - 시작 화면에서는 각각 한글/영어 안내문 읽기
  - 명언 출력 후에는 명언, 저자, 저서명을 순서대로 읽기
  - 현재 읽는 구간은 터미널 스타일 밑줄로 표시
- 명언 복사
- CRT 스캔라인, 녹색 형광 글자, 터미널 효과음
- 데스크톱/모바일 반응형 레이아웃
- 별도 서버 없이 브라우저에서 실행 가능

## 현재 데이터

명언 데이터는 `quotes-data.js`에 정적 데이터로 들어 있습니다.

- 저자: 25명
- 명언: 200개
- 언어: 16개

데이터는 `window.QUOTE_DATA` 객체로 관리합니다.

## 실행 방법

파일을 내려받은 뒤 `index.html`을 브라우저에서 열면 됩니다.

```text
file:///C:/project/index.html
```

또는 프로젝트 폴더의 `index.html`을 직접 더블클릭해도 됩니다.

이 프로젝트는 순수 HTML/CSS/JavaScript로 작성되어 별도 빌드나 서버가 필요 없습니다.

## 파일 구조

```text
quote-terminal/
├─ index.html        # 화면 구조
├─ styles.css        # CRT 터미널 디자인과 반응형 레이아웃
├─ app.js            # 명언 출력, 필터, 음성 읽기, 효과음, 시작 화면
├─ quotes-data.js    # 명언/저자 데이터
└─ README.md
```

## 명언 데이터 형식

`quotes-data.js`의 기본 구조는 아래와 같습니다.

```js
window.QUOTE_DATA = {
  authors: {
    socrates: {
      ko: {
        name: "소크라테스",
        life: "기원전 470년경-기원전 399년",
        language: "고대 그리스어"
      },
      original: {
        name: "Socrates",
        life: "c. 470 BCE-399 BCE",
        language: "Ancient Greek"
      }
    }
  },
  quotes: [
    {
      authorId: "socrates",
      tags: ["철학", "지혜"],
      ko: {
        quote: "한글 번역 명언",
        source: "한글 저서명",
        period: "작성/전승 시기"
      },
      original: {
        quote: "Original quote",
        source: "Original source",
        period: "Original period"
      }
    }
  ]
};
```

새 명언을 추가할 때는 기존 저자가 있으면 `quotes`에만 추가하고, 새 저자라면 `authors`에 저자 정보를 먼저 추가합니다.

## 검증

문법 검사는 아래 명령으로 할 수 있습니다.

```powershell
node --check app.js
node --check quotes-data.js
```

명언 데이터 개수와 누락 저자 여부는 아래처럼 확인할 수 있습니다.

```powershell
node -e "const fs=require('fs');const vm=require('vm');const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('quotes-data.js','utf8'),sandbox);const data=sandbox.window.QUOTE_DATA;const missing=data.quotes.filter(q=>!data.authors[q.authorId]);console.log({authors:Object.keys(data.authors).length,quotes:data.quotes.length,missingAuthors:missing.length});"
```

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

## 주의

브라우저 음성 읽기는 사용자의 운영체제와 브라우저에 설치된 음성 엔진을 사용합니다.

따라서 같은 코드라도 PC마다 목소리, 발음, 지원 언어가 다르게 동작할 수 있습니다. 현재 코드는 한글 읽기는 한국어 음성을, 원문 읽기는 영어 음성을 우선 선택하려고 시도하지만, 실제 사용 가능한 목소리는 사용자 환경에 따라 달라질 수 있습니다.

## 나중에 추가하면 좋은 것

- `LICENSE`: 공개 저장소라면 사용 허가 범위 명시
- `favicon`: 브라우저 탭 아이콘 추가
- 미리보기 이미지: README와 공유 링크용 스크린샷
- 데이터 검증 스크립트: 명언 추가 시 형식 자동 검사
- 출처 신뢰도 필드: 원전 인용, 전승 인용, 귀속 인용 구분
