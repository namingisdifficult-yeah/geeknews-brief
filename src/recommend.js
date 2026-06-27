// =========================================================================
// 추천 엔진 (순수 함수) — 화면/저장 방식과 독립적이라 그대로 테스트·재사용 가능
// 맞춤 3 = 관심사 프로필 + 좋아요 학습 / 화제 2 = 추천수+댓글(화제성) 상위
// =========================================================================

/* 관심사 프로필 (키워드, 가중치) — 제목+요약에 등장하면 가중치 합산 */
export const INTEREST = [
  // ① 빅테크·AI 기업의 전략/경영/기술 변화
  ["구글", 2], ["google", 2], ["애플", 2], ["apple", 2], ["마이크로소프트", 2], ["microsoft", 2],
  ["메타", 2], ["meta", 2], ["아마존", 2], ["amazon", 2], ["엔비디아", 2], ["nvidia", 2],
  ["openai", 2], ["anthropic", 2], ["claude", 2], ["클로드", 2], ["네이버", 2], ["카카오", 2],
  ["삼성", 2], ["테슬라", 2], ["tesla", 2], ["deepmind", 2], ["shopify", 2], ["codex", 1.5],
  ["전략", 1.5], ["경영", 1.5], ["인수", 1.5], ["합병", 1.5], ["구조조정", 1.5], ["해고", 1.5],
  ["감원", 1.5], ["매출", 1.5], ["실적", 1.5], ["투자", 1.2], ["출시", 1.5], ["발표", 1.2],
  ["ceo", 1.8], ["상장", 1.5], ["기업가치", 1.5], ["로드맵", 1.2], ["비즈니스", 1.2],
  ["아키텍처", 1.2], ["인프라", 1.5], ["마이그레이션", 1.5], ["엔지니어링", 1.2], ["플랫폼", 1], ["모델", 1],
  // ② 테크 현업자의 경험담
  ["경험", 1.5], ["후기", 1.5], ["회고", 1.5], ["제작기", 2], ["배운", 1.5], ["교훈", 1.5],
  ["현업", 2], ["개발자", 1.3], ["엔지니어", 1.3], ["커리어", 1.8], ["이직", 1.8], ["번아웃", 1.8],
  ["운영", 1.2], ["일하는", 1.5], ["만들어", 1.2], ["lessons", 1.5], ["building", 1.2],
  // ③ 통신·미디어 산업 연계 변화
  ["통신", 2], ["통신사", 2], ["5g", 2], ["6g", 2], ["skt", 2], ["네트워크", 1.2], ["미디어", 2],
  ["콘텐츠", 1.5], ["스트리밍", 2], ["넷플릭스", 2], ["ott", 2], ["방송", 2], ["언론", 2],
  ["신문", 1.5], ["광고", 1.5], ["구독", 1.5], ["창작자", 2], ["유튜브", 2], ["youtube", 1.5],
];

const STOP = new Set([
  "the", "a", "an", "to", "of", "and", "in", "is", "for", "on", "with", "as", "at", "by", "it",
  "그", "수", "및", "이", "가", "은", "는", "을", "를", "에", "의", "도", "와", "과", "로", "으로",
  "등", "것", "하는", "있는", "위한", "대한", "통해", "한다", "했다", "함", "됨", "된", "이다",
  "에서", "에게", "까지", "부터", "보다", "처럼", "같은", "더", "왜", "무엇", "어떻게", "해도",
]);

const KST_MS = 9 * 60 * 60 * 1000;
export function kstDateKey(d) {
  const ms = d.getTime() + d.getTimezoneOffset() * 60000 + KST_MS;
  const k = new Date(ms);
  return `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, "0")}-${String(k.getDate()).padStart(2, "0")}`;
}
export const todayKey = () => kstDateKey(new Date());

export function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^0-9a-z가-힣]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

// API/스냅샷 원본 → 화면·엔진이 쓰는 표준 형태로 변환
export function normalize(raw, i = 0) {
  const summary = (raw.summary || (raw.bullets ? raw.bullets.join(" ") : "")).trim();
  const date = raw.published || raw.date ? new Date(raw.published || raw.date) : null;
  const id = raw.id || (String(raw.url || "").match(/id=(\d+)/) || [])[1] || "x" + i;
  return {
    id: String(id),
    title: (raw.title || "").trim(),
    url: raw.url || "",
    author: (raw.author || "").trim(),
    date,
    dateKey: date && !isNaN(date) ? kstDateKey(date) : "",
    points: Number(raw.points) || 0,
    comments: Number(raw.comments) || 0,
    bullets: raw.bullets && raw.bullets.length ? raw.bullets.slice(0, 3) : summary ? [summary] : [],
    summary,
    insight: (raw.insight || "").trim(),
    tokens: tokenize((raw.title || "") + " " + summary),
  };
}

export function buildProfile(ratings) {
  const profile = {};
  let liked = 0;
  for (const id in ratings) {
    const r = ratings[id];
    if (!r || !r.liked) continue;
    liked++;
    for (const t of r.tokens || []) profile[t] = (profile[t] || 0) + 1;
  }
  return { profile, liked };
}

// 관심사 점수: 키워드가 제목+요약에 등장하면 가중치 합산
export function seedAffinity(a) {
  const text = (a.title + " " + a.summary).toLowerCase();
  let s = 0;
  for (const [kw, w] of INTEREST) if (text.includes(kw)) s += w;
  return s;
}

// 좋아요 학습 점수: 좋아요한 글의 키워드와 겹치는 정도
export function learnedAffinity(a, profile) {
  if (!a.tokens.length) return 0;
  let s = 0;
  for (const t of a.tokens) if (profile[t]) s += profile[t];
  return s / Math.sqrt(a.tokens.length);
}

// 화제성: 원문 조회수·SNS 공유수는 측정 불가 → GeekNews 추천수+댓글수로 근사
export function engagement(a) {
  return (a.points || 0) + 2 * (a.comments || 0);
}

// 5개 선정: 맞춤 3(관심사+좋아요) + 화제 2(추천·댓글 상위, 취향 무관)
export function pickFive(pool, ratings) {
  const { profile, liked } = buildProfile(ratings);
  const scored = pool.map((a) => ({
    a,
    aff: seedAffinity(a) + 1.5 * learnedAffinity(a, profile),
    eng: engagement(a),
  }));
  const picks = [...scored].sort((x, y) => y.aff - x.aff || y.eng - x.eng).slice(0, 3);
  const taken = new Set(picks.map((p) => p.a.id));
  const broaden = scored
    .filter((s) => !taken.has(s.a.id))
    .sort((x, y) => y.eng - x.eng)
    .slice(0, 2);
  return {
    liked,
    picks: [
      ...picks.map((s) => ({ ...s.a, bucket: "pick" })),
      ...broaden.map((s) => ({ ...s.a, bucket: "broaden" })),
    ],
  };
}

// 최근 글 중심 후보 풀 (최신순 18개)
export function buildPool(items) {
  const sorted = [...items].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  return sorted.slice(0, 18);
}
