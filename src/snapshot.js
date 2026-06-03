// 내장 스냅샷: /api/feed 실패 시(로컬 개발·네트워크 오류) 사용하는 폴백 데이터
// 출처: GeekNews(news.hada.io) 2026-05-30 기준 실제 기사 (추천수/댓글수 포함)
export const SNAPSHOT = [
  { id: "30006", title: "Shopify, 재고 예약 시스템을 Redis에서 MySQL로 교체", url: "https://news.hada.io/topic?id=30006", author: "GN⁺", date: "2026-05-30", points: 23, comments: 2, summary: "오버셀 방지 핵심 인프라인 재고 예약 시스템을 Redis 기반에서 MySQL로 교체한 Shopify의 개편기" },
  { id: "29976", title: "CodeBoarding - 코드베이스용 인터랙티브 아키텍처 다이어그램", url: "https://news.hada.io/topic?id=29976", author: "xguru", date: "2026-05-29", points: 35, comments: 2, summary: "정적 분석과 LLM 추론을 결합해 코드베이스 아키텍처 다이어그램을 자동 생성하는 오픈소스 도구" },
  { id: "30020", title: "마이크로소프트, 깃허브 계정 차단 후 윈도우 제로데이 공개 비판", url: "https://news.hada.io/topic?id=30020", author: "recast7838", date: "2026-05-30", points: 5, comments: 2, summary: "MS가 미패치 제로데이를 무단 공개한 보안 연구원의 깃허브 계정을 차단하자 논란이 일어남" },
  { id: "30009", title: "죽은 경제 이론 (The Dead Economy Theory)", url: "https://news.hada.io/topic?id=30009", author: "GN⁺", date: "2026-05-30", points: 9, comments: 1, summary: "AI가 경제 전반에서 인간 노동 수요를 제거할 때 생기는 위기를 다룬 분석" },
  { id: "29937", title: "좋아하는 개발자 도구는 무엇인가요?", url: "https://news.hada.io/topic?id=29937", author: "GN⁺", date: "2026-05-28", points: 54, comments: 10, summary: "Helix·Neovim·Zed·JetBrains 등 개발자들이 실제로 애용하는 도구와 트레이드오프에 대한 현업 토론" },
  { id: "29999", title: "Postgres에서 내구성 워크플로 구축하기", url: "https://news.hada.io/topic?id=29999", author: "GN⁺", date: "2026-05-30", points: 9, comments: 2, summary: "실행 상태를 DB에 체크포인트해 충돌 후 마지막 단계부터 복구하는 내구성 워크플로를 Postgres로 구축" },
  { id: "30005", title: "AudioMass - 백엔드 없는 브라우저 기반 오픈소스 오디오 편집기", url: "https://news.hada.io/topic?id=30005", author: "xguru", date: "2026-05-30", points: 6, comments: 1, summary: "순수 JavaScript만으로 동작하는 웹 기반 오디오 에디터" },
  { id: "30002", title: "SQLite는 에이전트가 작성한 코드를 받지 않음", url: "https://news.hada.io/topic?id=30002", author: "GN⁺", date: "2026-05-30", points: 5, comments: 1, summary: "SQLite가 AGENTS.md로 에이전트 생성 코드의 PR 조건과 정책을 명확히 규정함" },
  { id: "29847", title: "Codex, 활용 사례 모음 대폭 확장", url: "https://news.hada.io/topic?id=29847", author: "GN⁺", date: "2026-05-25", points: 85, comments: 4, summary: "OpenAI가 Codex 유스케이스를 12개에서 52개로 확장, 엔지니어링·디자인 등으로 범위를 넓힘" },
  { id: "29997", title: "LLM이 만들어낸 \"AI 냄새들\"", url: "https://news.hada.io/topic?id=29997", author: "GN⁺", date: "2026-05-30", points: 6, comments: 2, summary: "LLM 보조 글쓰기의 흔적이 인터넷 전반에서 반복되며 드러나는 패턴 분석" },
  { id: "29975", title: "하루 쉬어도 될까요?", url: "https://news.hada.io/topic?id=29975", author: "GN⁺", date: "2026-05-29", points: 13, comments: 13, summary: "AI가 생산성을 10배 높인다면 노동시간도 줄어야 한다는 문제 제기" },
  { id: "29944", title: "기술 CEO들은 AI 정신증을 겪고 있는 듯하다", url: "https://news.hada.io/topic?id=29944", author: "GN⁺", date: "2026-05-28", points: 24, comments: 2, summary: "프로토타입 경험만으로 에이전트가 실제 업무를 대체한다 믿는 CEO들의 과대망상을 비판" },
  { id: "29940", title: "AI와 대화하는 데 지쳤어요", url: "https://news.hada.io/topic?id=29940", author: "GN⁺", date: "2026-05-28", points: 21, comments: 13, summary: "AI 생성 답변에 지친 개발자가 사람의 도움을 구했지만 또 동일한 AI 답변을 받은 경험담" },
  { id: "29985", title: "유저 의견을 모아 매일 자동 개발과 배포되는 웹게임 제작기", url: "https://news.hada.io/topic?id=29985", author: "frogred8", date: "2026-05-29", points: 8, comments: 2, summary: "유저 피드백을 모아 다음 날 자동 배포하는 컨셉의 웹게임을 만든 개인 제작기" },
  { id: "29939", title: "Decepticon - 레드팀을 위한 자율 해킹 에이전트", url: "https://news.hada.io/topic?id=29939", author: "xguru", date: "2026-05-28", points: 20, comments: 1, summary: "레드팀을 위한 자율형 해킹 에이전트로 실제 적대자 방식의 공격을 수행" },
  { id: "29960", title: "Anthropic, Claude Opus 4.8 출시", url: "https://news.hada.io/topic?id=29960", author: "flyingsquirrel", date: "2026-05-29", points: 11, comments: 11, summary: "Anthropic이 Opus 4.7 기반으로 코딩·협업 성능을 개선한 Claude Opus 4.8을 출시함" },
  { id: "29983", title: "네이버, AI 브리핑 인용수를 창작자 보상 기준으로 공식화 — 네이버 메이트 발표", url: "https://news.hada.io/topic?id=29983", author: "sheint17", date: "2026-05-29", points: 8, comments: 2, summary: "네이버가 창작자 펠로우십 '네이버 메이트'를 공개, 선정 기준에 AI 브리핑 인용수를 포함한 미디어·창작자 전략" },
  { id: "29907", title: "OpenHuman - 개인용 AI 슈퍼 인텔리전스", url: "https://news.hada.io/topic?id=29907", author: "xguru", date: "2026-05-27", points: 30, comments: 2, summary: "일상에 자연스럽게 통합되도록 설계된 오픈소스 에이전트형 개인 비서" },
];
