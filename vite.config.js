import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 프로젝트 주소(username.github.io/<repo>/)에 맞춰 base 설정.
// ⚠️ 저장소 이름을 'geeknews-brief'가 아닌 다른 이름으로 만들면, 아래 base를
//    '/<그 이름>/' 으로 바꿔야 합니다.
export default defineConfig({
  base: "/geeknews-brief/",
  plugins: [react()],
});
