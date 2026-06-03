// 빌드 시점에 GeekNews를 파싱하는 모듈 (scripts/fetch-feed.mjs에서 사용)
import { XMLParser } from "fast-xml-parser";

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function decode(s) {
  return String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
function strip(s) {
  return decode(String(s).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function htmlToParts(html) {
  const lis = [...String(html).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => strip(m[1])).filter(Boolean);
  const plain = strip(html);
  if (lis.length) return { bullets: lis.slice(0, 3), plain };
  const sents = plain.split(/(?<=[.。!?])\s+/).filter(Boolean).slice(0, 2);
  return { bullets: sents.length ? sents : [plain.slice(0, 160)], plain };
}

export function parseFeed(text) {
  const doc = xml.parse(text);
  let entries = doc?.feed?.entry || [];
  if (!Array.isArray(entries)) entries = [entries];
  return entries
    .map((e) => {
      const title = typeof e.title === "object" ? e.title["#text"] : e.title;
      let href = "";
      const link = e.link;
      if (Array.isArray(link)) {
        const alt = link.find((l) => l && l["@_rel"] === "alternate") || link[0];
        href = alt?.["@_href"] || "";
      } else if (link && typeof link === "object") {
        href = link["@_href"] || "";
      }
      const idText = String(e.id || href);
      const id = (idText.match(/id=(\d+)/) || [])[1] || idText;
      const author = (e.author && (e.author.name || e.author)) || "";
      const contentRaw = typeof e.content === "object" ? e.content["#text"] : e.content;
      const { bullets, plain } = htmlToParts(contentRaw || "");
      return {
        id: String(id),
        title: strip(title || ""),
        url: href,
        author: String(author).trim(),
        published: e.published || e.updated || "",
        points: 0,
        comments: 0,
        bullets,
        summary: plain,
      };
    })
    .filter((a) => a.title && a.url);
}

// 홈페이지에서 추천수/댓글수 추출 (보이는 텍스트 기준 → 마크업 변경에 강함)
function lastPoints(text) {
  let val = 0;
  const patterns = [/(\d+)\s*points?/gi, /(\d+)\s*▲/g, /▲\s*(\d+)/g];
  for (const re of patterns) {
    const all = [...text.matchAll(re)];
    if (all.length) val = Number(all[all.length - 1][1]);
  }
  return val;
}
export function parseStats(html) {
  const stats = {};
  if (!html) return stats;
  const matches = [...html.matchAll(/topic\?id=(\d+)/g)];
  for (let i = 0; i < matches.length; i++) {
    const id = matches[i][1];
    const start = matches[i].index;
    const before = html.slice(Math.max(0, start - 600), start);
    const after = html.slice(start, start + 250);
    const points = lastPoints(before);
    const c = after.match(/댓글\s*(\d+)\s*개/);
    if (!stats[id]) stats[id] = { points: 0, comments: 0 };
    if (points && !stats[id].points) stats[id].points = points;
    if (c && !stats[id].comments) stats[id].comments = Number(c[1]);
  }
  return stats;
}
