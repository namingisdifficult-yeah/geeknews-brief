// 빌드(및 매일 예약 실행) 시점에 GeekNews를 받아 public/feed.json 생성.
// GitHub Actions 러너에서 실행 → CORS 없음. 봇 차단(403) 대비:
//   1) 진짜 브라우저처럼 보이는 헤더로 직접 호출
//   2) 막히면 공개 중계(allorigins)로 한 번 더 시도
//   3) 그래도 실패하면 내장 스냅샷으로 폴백 → 빌드는 절대 깨지지 않음
import { writeFileSync, mkdirSync } from "node:fs";
import { parseFeed, parseStats } from "./parse.mjs";
import { addInsights } from "./insight.mjs";
import { SNAPSHOT } from "../src/snapshot.js";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
};

async function getText(url, required = false) {
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS });
    if (r.ok) return await r.text();
    console.warn(`직접 호출 ${r.status}: ${url}`);
  } catch (e) {
    console.warn(`직접 호출 실패: ${url} (${e.message})`);
  }
  try {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const r = await fetch(proxied, { headers: BROWSER_HEADERS });
    if (r.ok) {
      console.log(`중계로 수집: ${url}`);
      return await r.text();
    }
    console.warn(`중계 호출 ${r.status}: ${url}`);
  } catch (e) {
    console.warn(`중계 호출 실패: ${url} (${e.message})`);
  }
  if (required) throw new Error("수집 실패: " + url);
  return "";
}

async function main() {
  let items;
  let live = false;
  try {
    const rssText = await getText("https://news.hada.io/rss/news", true);
    const htmlText = await getText("https://news.hada.io/");
    items = parseFeed(rssText);
    const stats = parseStats(htmlText);
    for (const it of items) {
      const s = stats[it.id];
      if (s) {
        it.points = s.points;
        it.comments = s.comments;
      }
    }
    if (items.length < 5) throw new Error("기사가 너무 적음");
    live = true;
    console.log(`\u2713 \uc2e4\uc2dc\uac04 ${items.length}\uac74 \uc218\uc9d1`);
  } catch (e) {
    console.warn("\uc2e4\uc2dc\uac04 \uc218\uc9d1 \uc2e4\ud328 \u2192 \uc2a4\ub0c5\uc0f7 \uc0ac\uc6a9:", e.message);
    items = SNAPSHOT;
    live = false;
  }

  // "이게 왜 중요한지" 인사이트 생성(Gemini 무료 티어). 키 없으면 조용히 건너뜀.
  // 화면엔 최신 기사 일부만 노출되므로(앱의 후보 풀≈18개), 최근 24건에만 생성해
  // 토큰·할당량을 아끼고 응답 잘림을 방지. slice는 같은 객체 참조라 결과가 items에 반영됨.
  try {
    const recent = [...items]
      .sort((a, b) => new Date(b.published || b.date || 0) - new Date(a.published || a.date || 0))
      .slice(0, 24);
    await addInsights(recent);
  } catch (e) {
    console.warn("인사이트 생성 단계 예외(무시):", e.message);
  }

  mkdirSync("public", { recursive: true });
  writeFileSync(
    "public/feed.json",
    JSON.stringify({ items, live, fetchedAt: new Date().toISOString() }, null, 2)
  );
  console.log("\u2713 public/feed.json \uc791\uc131 \uc644\ub8cc (live=" + live + ")");
}

main();
