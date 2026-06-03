# 나만의 긱뉴스 브리핑 (GeekNews Daily Brief) — GitHub Pages 버전

GeekNews(news.hada.io)의 최근 기사를 **내 관심사 + 좋아요**로 매일 5개 추천하는 개인용 웹앱.
**Vercel 등 별도 서비스 가입 없이, GitHub 계정만으로 배포**됩니다.

- **맞춤 3** — 빅테크·AI 전략 / 현업 경험담 / 통신·미디어 관심사 + 좋아요 학습
- **지금 화제 2** — 취향과 무관하게 추천수(▲)·댓글이 많은 글
- **좋아요** — 이 기기(브라우저)에 저장, 로그인 불필요
- **매일 자동 갱신** — GitHub Actions가 매일 새벽 GeekNews를 받아 데이터 파일을 새로 만듦

---

## 작동 원리 (왜 Vercel이 필요 없나)

GitHub Pages는 "정적 파일"만 서빙해서 서버 프로그램을 못 돌립니다. 그래서:

1. **GitHub Actions**(GitHub에 내장된 무료 자동작업)가 매일 새벽 `scripts/fetch-feed.mjs`를 실행 → GeekNews RSS·추천수·댓글을 받아 `public/feed.json`으로 저장.
2. 그 결과를 빌드해 **GitHub Pages**에 자동 배포.
3. 사이트(브라우저)는 같은 주소의 `feed.json`만 읽으므로 CORS·서버가 전혀 필요 없음.

GeekNews가 자동 요청을 막으면(403) 공개 중계로 한 번 더 시도하고, 그래도 안 되면 내장 스냅샷으로 폴백합니다(화면은 항상 정상).

---

## 배포 (GitHub만으로) — 한 번만

준비물: **GitHub 계정**(무료). 그 외 가입 없음.

1. **저장소 만들기**
   - GitHub → **+ → New repository** → 이름을 정확히 **`geeknews-brief`** 로 입력 → **Create repository**.
   - (다른 이름을 쓰려면 `vite.config.js`의 `base: "/geeknews-brief/"`를 `/<그 이름>/`으로 바꿔야 합니다.)

2. **코드 올리기 (터미널 없이)**
   - 받은 zip의 압축을 풀고, 저장소 화면의 **"uploading an existing file"** 클릭.
   - 압축 푼 폴더 **안의 내용물 전체**(`src`, `scripts`, `.github`, `public`, `package.json`, `index.html`, `vite.config.js` …)를 드래그해 업로드 → **Commit changes**.
   - ⚠️ `node_modules` 폴더는 올리지 마세요(zip에 없습니다). 숨김 폴더 **`.github` 가 반드시 포함**되어야 자동 배포가 작동합니다.
   - (터미널이 편하면: `git init && git add . && git commit -m init && git branch -M main && git remote add origin <repo-url> && git push -u origin main`)

3. **Pages 켜기**
   - 저장소 **Settings → Pages → Build and deployment → Source** 를 **"GitHub Actions"** 로 선택.
   - **Actions** 탭에서 워크플로 실행이 보이면(없으면 "Deploy to GitHub Pages" → **Run workflow**) 1~2분 뒤 완료.
   - 완료되면 주소가 나옵니다: **`https://<내아이디>.github.io/geeknews-brief/`**

4. **매일 사용**
   - 그 주소를 매일 아침 열기. 데이터는 매일 새벽 자동 갱신됩니다.
   - 휴대폰은 브라우저 메뉴 **"홈 화면에 추가"** 로 앱처럼 사용.

코드를 수정해 GitHub에 올리면(또는 매일 예약 실행되면) Actions가 **자동으로 다시 빌드·배포**합니다.

---

## 로컬에서 실행

```bash
npm install
npm run fetch   # feed.json 생성 (외부망 차단 환경이면 스냅샷으로 채워짐)
npm run dev     # http://localhost:5173/geeknews-brief/
```

`npm run build` → `dist/`(배포본) 생성.

---

## 내 입맛대로 바꾸기

- **관심사** → `src/recommend.js`의 `INTEREST` 배열(`["키워드", 가중치]`).
- **추천 개수/비율** → `src/recommend.js`의 `pickFive`에서 `slice(0,3)`(맞춤)·`slice(0,2)`(화제).
- **자동 갱신 시각** → `.github/workflows/deploy.yml`의 `cron`(UTC 기준. `0 21 * * *` = 06:00 KST).
- **색·디자인** → `src/styles.css`의 `:root` 색상 변수.

---

## 문제 해결

- **배지가 계속 "스냅샷"이에요** → Actions가 GeekNews에서 데이터를 못 받은 경우입니다. 저장소 **Actions 탭 → 최근 실행 로그**에서 "실시간 수집 실패" 메시지를 확인하세요. GeekNews가 자동 요청을 차단(403)하는 상황일 수 있으며, 그땐 알려주시면 다른 수집 경로로 바꿔드립니다. (이 경우에도 화면은 스냅샷으로 정상 동작)
- **예약 갱신이 멈췄어요** → 저장소에 60일간 활동(커밋)이 없으면 GitHub가 예약 실행을 자동 중지합니다. **Actions 탭 → Run workflow**를 한 번 누르면 다시 깨어납니다.
- **▲(추천수)가 0이에요** → GeekNews 홈페이지 표기가 바뀐 경우. `scripts/parse.mjs`의 `parseStats` 정규식만 손보면 됩니다. (0이어도 앱은 정상, 화제 2개는 댓글·최신순으로 대체)
- **페이지가 빈 화면/깨짐** → 저장소 이름과 `vite.config.js`의 `base`가 일치하는지 확인.
- **좋아요가 사라졌어요** → 좋아요는 그 브라우저에만 저장됩니다(기기·시크릿창·데이터 삭제 시 초기화).

---

## 솔직한 한계

- **"원문 조회수"·SNS 공유수는 측정 불가** → '화제성'은 GeekNews 추천수+댓글수로 추정한 근사치.
- 좋아요는 **기기별 로컬 저장**(기기 간 동기화 없음).
- 갱신은 **하루 1회(예약 실행)** 기준 — 분 단위 실시간은 아님.

---

## 다음 단계(V2) 후보
매일 이메일 발송 · 로그인+클라우드 저장(기기 동기화) · "별로예요" 버튼 · AI 추천(본인 API 키) · 지난 날짜 아카이브.

데이터 출처: [GeekNews (news.hada.io)](https://news.hada.io/). 개인 학습·열람용 도구입니다.
