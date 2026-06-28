// 기사 "인사이트" 생성 모듈 — Gemini(무료 티어) API 사용.
// 요약을 옮기는 게 아니라 "이 글이 왜 중요한지"를 한두 문장으로 쉽게 풀어줌.
//
// 동작 방식
//   - 빌드 시점(fetch-feed.mjs)에 풀 전체 기사에 대해 '한 번의 요청'으로 인사이트를 생성.
//     (5개 선정은 브라우저에서 사용자별로 달라지므로, 풀 전체에 미리 붙여 둠 + 무료 할당량 절약)
//   - 환경변수 GEMINI_API_KEY 가 없거나 호출이 실패하면 조용히 건너뜀(빌드는 절대 안 깨짐).
//     이 경우 인사이트는 비고, 화면에서는 표시되지 않음.
//
// 키 발급: https://aistudio.google.com/apikey (Google 계정만 있으면 무료)
// 모델 변경: 환경변수 GEMINI_MODEL (기본 gemini-2.5-flash, 무료 대안 gemini-2.0-flash)

const ENDPOINT = "https://generativelanguage.googleapis.com";

function buildPrompt(items) {
  const list = items
    .map((it, i) => `${i + 1}. 제목: ${it.title}\n   요약: ${it.summary || "(없음)"}`)
    .join("\n");
  return [
    "너는 한국어 테크 뉴스 큐레이터다.",
    "아래 기사 목록 각각에 대해, 요약을 그대로 옮기지 말고",
    '"이게 왜 중요한지 / 어떤 의미인지"를 비전문가도 이해할 수 있게 1~2문장으로 풀어줘.',
    "맥락·시사점·파급효과 중심으로 쓰되, 과장·추측은 피하고 담백하게.",
    "각 인사이트는 80자 이내 권장, 한국어 평서문.",
    "",
    "반드시 아래 JSON 배열 형식으로만 답하라(코드블록·설명 없이):",
    '[{"n": 1, "insight": "..."}, {"n": 2, "insight": "..."}]',
    "",
    "기사 목록:",
    list,
  ].join("\n");
}

function extractJson(text) {
  if (!text) return null;
  // 코드펜스 제거
  let t = text.replace(/```(?:json)?/gi, "").trim();
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

// items 배열 각 원소에 it.insight 를 채워 넣음(가능한 경우). 반환: 생성 성공 개수.
export async function addInsights(items) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY 없음 → 인사이트 생성 건너뜀(요약만 표시)");
    return 0;
  }
  if (!items || !items.length) return 0;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  // 키는 쿼리스트링(?key=) 대신 헤더로 전달 → URL/로그/프록시 기록에 키가 남지 않음(Google 권장).
  const url = `${ENDPOINT}/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: buildPrompt(items) }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  };

  let data;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) {
      console.warn(`Gemini 호출 실패 ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return 0;
    }
    data = await r.json();
  } catch (e) {
    console.warn(`Gemini 호출 예외: ${e.message}`);
    return 0;
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  const arr = extractJson(text);
  if (!Array.isArray(arr)) {
    console.warn("Gemini 응답 파싱 실패 → 인사이트 건너뜀");
    return 0;
  }

  let n = 0;
  for (const row of arr) {
    const idx = Number(row?.n) - 1;
    const insight = String(row?.insight || "").trim();
    if (idx >= 0 && idx < items.length && insight) {
      items[idx].insight = insight;
      n++;
    }
  }
  console.log(`✓ 인사이트 ${n}/${items.length}건 생성`);
  return n;
}
