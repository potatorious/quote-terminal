# 명언 터미널

CRT 터미널 감성으로 명언을 탐색하고 읽어주는 정적 웹앱입니다. 브라우저에서 바로 열 수 있고, 별도 서버나 빌드 과정 없이 동작합니다.

## 주요 기능

- 시작 대기 화면과 터미널 커서
- 카테고리별 명언 필터
- 무작위 명언 실행과 이전 명언으로 돌아가기
- 한국어 번역문과 원문 함께 표시
- 저자/문헌, 출처, 원문 언어 메타데이터 표시
- 한국어 읽기와 영어 음성 원문 읽기
- 읽는 구간 밑줄 표시
- 명언 복사
- 사용자 시스템 시간과 CRT 스캔라인/글로우 효과
- 데스크톱과 모바일 반응형 레이아웃

## 데이터

명언 데이터는 [`quotes-data.js`](./quotes-data.js)의 `window.QUOTE_DATA`에 정적으로 포함되어 있습니다.

| 항목 | 개수 |
| --- | ---: |
| 저자/문헌 | 25개 |
| 명언 | 450개 |
| 카테고리 | 9개 |

## 실행

이 폴더의 [`index.html`](./index.html)을 브라우저에서 열면 됩니다.

## 파일 구조

```text
quote-terminal/
├─ index.html       # 화면 구조
├─ styles.css       # CRT 디자인과 반응형 스타일
├─ app.js           # 명언 출력, 필터, 음성 읽기, 복사, UI 상태
├─ quotes-data.js   # 저자/문헌과 명언 데이터
└─ README.md
```

## 데이터 형식

각 명언은 `quotes-data.js`의 `quotes` 배열에 추가합니다. 새 저자나 문헌이 필요하면 먼저 `authors`에 정보를 추가하고 `authorId`로 연결합니다.

```js
window.QUOTE_DATA = {
  authors: {
    socrates: {
      ko: {
        name: "소크라테스",
        language: "고대 그리스어"
      },
      original: {
        name: "Socrates",
        language: "Ancient Greek"
      }
    }
  },
  quotes: [
    {
      authorId: "socrates",
      tags: ["철학", "지혜"],
      ko: {
        quote: "한국어 번역문",
        source: "한국어 출처명"
      },
      original: {
        quote: "Original quote",
        source: "Original source"
      }
    }
  ]
};
```

## 검증

JavaScript 문법은 아래 명령으로 확인합니다.

```powershell
node --check app.js
node --check quotes-data.js
```

데이터 개수와 누락된 저자 연결은 아래 명령으로 확인할 수 있습니다.

```powershell
node -e "const fs=require('fs');const vm=require('vm');const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('quotes-data.js','utf8'),sandbox);const data=sandbox.window.QUOTE_DATA;const missing=data.quotes.filter(q=>!data.authors[q.authorId]);console.log({authors:Object.keys(data.authors).length,quotes:data.quotes.length,missingAuthors:missing.length});"
```

## GitHub Pages 배포

GitHub 저장소에서 다음 순서로 설정하면 정적 페이지로 배포할 수 있습니다.

1. `Settings`로 이동
2. `Pages` 선택
3. `Build and deployment`에서 `Deploy from a branch` 선택
4. Branch를 `main`, 폴더를 `/root`로 설정
5. `Save`

배포 주소는 보통 아래 형식입니다.

```text
https://potatorious.github.io/quote-terminal/
```

## 메모

음성 읽기는 브라우저의 Web Speech API를 사용합니다. 실제 목소리, 발음, 지원 언어는 운영체제와 브라우저에 설치된 음성 엔진에 따라 달라질 수 있습니다.
