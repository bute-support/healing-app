import { initTheme } from "../ui/theme.js";

initTheme();

lucide.createIcons();

//ダミーレビュー
document.getElementById("reviewBtn")?.addEventListener("click", () => {
  const appId = "ここにApp Store ConnectでアプリIDが発行されたら入れる";
  window.location.href = `itms-apps://apps.apple.com/app/id${appId}?action=write-review`;
});