// 브라우저 localStorage 래퍼 — 좋아요·일일 캐시 저장 (로그인 불필요, 이 기기에만 저장)
const PREFIX = "gnb:";

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("저장 실패", e);
  }
}
