import { useState, useEffect, useCallback } from "react";
import { SNAPSHOT } from "./snapshot.js";
import { loadJSON, saveJSON } from "./storage.js";
import { normalize, buildPool, pickFive, todayKey } from "./recommend.js";

/* --- 작은 인라인 아이콘들 (외부 의존성 없음) --- */
const Icon = ({ d, fill = "none", size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const ThumbsUp = (p) => <Icon {...p} d={<><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></>} />;
const Refresh = (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></>} />;
const ExtLink = (p) => <Icon {...p} size={14} d={<><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>} />;
const Heart = (p) => <Icon {...p} size={11} fill="currentColor" d={<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />} />;
const Flame = (p) => <Icon {...p} size={11} fill="currentColor" d={<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.85-4.24 1-6 .25 2.5 1.5 3.5 3 4.5 2 1.5 3 3 3 5a6 6 0 1 1-12 0c0-1.5.5-3 2.5-4.5-.5 1.5-.5 2.5 0 3.5Z" />} />;
const Check = (p) => <Icon {...p} size={13} d={<path d="M20 6 9 17l-5-5" />} />;
const Bulb = (p) => <Icon {...p} size={12} d={<><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /></>} />;

function LikeButton({ liked, onToggle }) {
  return (
    <button className={"like-btn" + (liked ? " on" : "")} onClick={onToggle} aria-pressed={liked} type="button">
      <ThumbsUp fill={liked ? "currentColor" : "none"} /> 좋아요{liked && <Check />}
    </button>
  );
}

function Card({ article, liked, onToggle }) {
  const isPick = article.bucket === "pick";
  return (
    <article className="card">
      <div className="card-top">
        <span className={"tag " + (isPick ? "pick" : "hot")}>
          {isPick ? <Heart /> : <Flame />} {isPick ? "내 취향 맞춤" : "지금 화제"}
        </span>
        <span className="meta">▲ {article.points} · 댓글 {article.comments}{article.author ? ` · ${article.author}` : ""}</span>
      </div>
      <a className="title-link" href={article.url} target="_blank" rel="noopener noreferrer">
        <h3 className="title">{article.title}</h3>
        <span className="ext"><ExtLink /></span>
      </a>
      <ul className="bullets">
        {article.bullets.map((b, i) => (
          <li key={i}><span className="dot" /><span>{b}</span></li>
        ))}
      </ul>
      {article.insight && (
        <div className="insight">
          <span className="insight-label"><Bulb /> 왜 중요한가</span>
          <p className="insight-text">{article.insight}</p>
        </div>
      )}
      <div className="card-foot">
        <span className="ask">이 글, 마음에 드나요?</span>
        <LikeButton liked={liked} onToggle={() => onToggle(article)} />
      </div>
    </article>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [pool, setPool] = useState([]);
  const [picks, setPicks] = useState([]);
  const [ratings, setRatings] = useState({});
  const [view, setView] = useState("brief"); // brief | liked
  const [source, setSource] = useState("snapshot"); // live | snapshot
  const [refreshing, setRefreshing] = useState(false);
  const [warn, setWarn] = useState("");
  const [toast, setToast] = useState("");

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1800); };
  const likedCount = Object.values(ratings).filter((r) => r && r.liked).length;

  // 기사 가져오기: 매일 빌드 때 생성된 feed.json(같은 출처라 CORS 없음) → 실패 시 내장 스냅샷
  const fetchItems = useCallback(async () => {
    try {
      const r = await fetch(import.meta.env.BASE_URL + "feed.json", { cache: "no-store" });
      if (!r.ok) throw new Error("no feed");
      const data = await r.json();
      if (!Array.isArray(data.items) || data.items.length < 5) throw new Error("empty");
      return { items: data.items.map(normalize), live: data.live !== false };
    } catch {
      return { items: SNAPSHOT.map(normalize), live: false };
    }
  }, []);

  const build = useCallback((items, live, currentRatings, persist) => {
    const p = buildPool(items);
    const { picks: pk } = pickFive(p, currentRatings);
    setPool(p); setPicks(pk); setSource(live ? "live" : "snapshot");
    setWarn(live ? "" : "데이터를 불러오지 못해 내장 스냅샷을 표시합니다. 새로고침을 눌러보세요.");
    if (persist) saveJSON("daily:" + todayKey(), { picks: pk, source: live ? "live" : "snapshot" });
  }, []);

  // 첫 로드: 오늘 캐시가 있으면 사용, 없으면 새로 가져오기
  useEffect(() => {
    (async () => {
      const savedRatings = loadJSON("ratings", {}) || {};
      setRatings(savedRatings);
      const cached = loadJSON("daily:" + todayKey());
      if (cached && Array.isArray(cached.picks) && cached.picks.length === 5) {
        setPicks(cached.picks); setSource(cached.source || "snapshot"); setReady(true);
        return;
      }
      const { items, live } = await fetchItems();
      build(items, live, savedRatings, true);
      setReady(true);
    })();
  }, [fetchItems, build]);

  const refresh = async () => {
    setRefreshing(true); setWarn("");
    const { items, live } = await fetchItems();
    build(items, live, ratings, true);
    setRefreshing(false);
    if (live) flash("최신 글로 업데이트됐어요");
  };

  const regenerate = () => {
    if (!pool.length) return;
    const { picks: pk } = pickFive(pool, ratings);
    setPicks(pk);
    saveJSON("daily:" + todayKey(), { picks: pk, source });
  };

  const toggleLike = (article) => {
    const cur = !!ratings[article.id]?.liked;
    const next = { ...ratings };
    if (cur) delete next[article.id];
    else next[article.id] = { liked: true, title: article.title, url: article.url, tokens: article.tokens, ts: new Date().toISOString() };
    setRatings(next);
    saveJSON("ratings", next);
    flash(cur ? "좋아요 취소됨" : "좋아요 저장됨 · 추천에 반영돼요");
  };

  // '좋아요 한 뉴스' 목록: 최근 좋아요순. URL이 없는 과거 데이터는 기사 id로 복원.
  const unlikeById = (id) => {
    const next = { ...ratings };
    delete next[id];
    setRatings(next);
    saveJSON("ratings", next);
    flash("좋아요 취소됨");
  };

  const likedList = Object.entries(ratings)
    .filter(([, r]) => r && r.liked)
    .map(([id, r]) => ({
      id,
      title: r.title || "(제목 없음)",
      url: r.url || `https://news.hada.io/topic?id=${id}`,
      ts: r.ts || "",
    }))
    .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  const pickList = picks.filter((p) => p.bucket === "pick");
  const hotList = picks.filter((p) => p.bucket === "broaden");
  const likedOf = (a) => !!ratings[a.id]?.liked;

  return (
    <div className="container">
      <header className="masthead">
        <div className="kicker">Daily Brief · GeekNews</div>
        <h1 className="h1">나만의 긱뉴스 브리핑</h1>
        <p className="sub">최근 기사 중 5개 · 관심사 + 좋아요 {likedCount}개 반영 중</p>
        <nav className="tabs">
          <button className={"tab" + (view === "brief" ? " on" : "")} onClick={() => setView("brief")} type="button">
            오늘의 추천
          </button>
          <button className={"tab" + (view === "liked" ? " on" : "")} onClick={() => setView("liked")} type="button">
            <Heart /> 좋아요 한 뉴스{likedCount > 0 ? ` ${likedCount}` : ""}
          </button>
        </nav>
        {view === "brief" && (
          <div className="toolbar">
            <button className="btn" onClick={regenerate} type="button"><Refresh size={14} /> 다시 고르기</button>
            <button className="btn btn-primary" onClick={refresh} disabled={refreshing} type="button">
              <Refresh size={14} /> {refreshing ? "불러오는 중…" : "새로고침"}
            </button>
            <span className={"badge" + (source === "live" ? " live" : "")}>{source === "live" ? "최신" : "스냅샷"}</span>
          </div>
        )}
        {view === "brief" && warn && <div className="note warn">{warn}</div>}
      </header>

      {view === "liked" ? (
        <section className="section">
          <h2 className="section-title">좋아요 한 뉴스 · {likedList.length}</h2>
          <p className="section-sub">제목을 누르면 해당 뉴스로 이동합니다. 이 기기(브라우저)에 저장돼요.</p>
          {likedList.length === 0 ? (
            <div className="empty">
              아직 좋아요한 뉴스가 없어요.<br />
              ‘오늘의 추천’에서 카드의 <b>좋아요</b>를 누르면 여기에 모입니다.
            </div>
          ) : (
            <ul className="liked-list">
              {likedList.map((it) => (
                <li className="liked-item" key={it.id}>
                  <a className="liked-title" href={it.url} target="_blank" rel="noopener noreferrer">
                    <span>{it.title}</span>
                    <ExtLink />
                  </a>
                  <button className="liked-remove" onClick={() => unlikeById(it.id)} type="button" aria-label="좋아요 취소" title="좋아요 취소">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : !ready ? (
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <div className="sk" key={i}>
              <div className="sk-line" style={{ width: "30%" }} />
              <div className="sk-line" style={{ width: "75%", height: "1.1rem" }} />
              <div className="sk-line" style={{ width: "90%" }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="section">
            <h2 className="section-title">내 취향 맞춤 · 3</h2>
            <p className="section-sub">빅테크·AI 전략 · 현업 경험담 · 통신/미디어 관심사 + 좋아요 반영</p>
            <div className="grid">
              {pickList.map((a) => <Card key={a.id} article={a} liked={likedOf(a)} onToggle={toggleLike} />)}
            </div>
          </section>
          <section className="section">
            <h2 className="section-title">지금 가장 화제 · 2</h2>
            <p className="section-sub">취향과 무관하게 추천·댓글이 많은(화제성 높은) 글</p>
            <div className="grid">
              {hotList.map((a) => <Card key={a.id} article={a} liked={likedOf(a)} onToggle={toggleLike} />)}
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <p>
          요약 출처: <a href="https://news.hada.io/" target="_blank" rel="noopener noreferrer">GeekNews(news.hada.io)</a>.
          제목을 누르면 원문·댓글로 이동합니다. 좋아요는 이 브라우저(기기)에 저장되어 추천에 반영됩니다.
        </p>
        <p style={{ marginTop: "0.4rem" }}>
          ‘화제성(▲·댓글)’은 원문 조회수·SNS 공유수를 직접 알 수 없어 GeekNews 추천수·댓글수로 추정한 근사치입니다. 데이터는 매일 자동으로 갱신됩니다.
          ‘왜 중요한가’ 인사이트는 Gemini가 자동 생성한 참고용 해설로, 사실과 다를 수 있습니다.
        </p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
