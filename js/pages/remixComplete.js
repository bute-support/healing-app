import { initTheme } from "../ui/theme.js";
import { showInterstitialAd } from "../services/adService.js";
import { getRemixes, saveRemix } from "../storage/remix.js";
import { isPremium } from "../services/premiumService.js";

initTheme();

document.getElementById("toHome").onclick = async () => {
  const button = document.getElementById("toHome");

  // 連続タップを防ぐ
  button.disabled = true;

  try {
    await showInterstitialAd(() => {
      location.href = "../index.html";
    });
  } catch (error) {
    console.error("ホーム画面への移動に失敗:", error);
    location.href = "../index.html";
  }
};

const params = new URLSearchParams(location.search);
const mode = params.get("mode");

const title = document.getElementById("title");
const message = document.getElementById("message");

if (mode === "edit") {
  title.textContent = "ミックスを更新しました！";
  message.innerHTML = "更新したミックスは<br>「ミックス一覧」からいつでも再生できます。";
} else {
  title.textContent = "ミックスを作成しました！";
  message.innerHTML = "作成したミックスは<br>「ミックス一覧」からいつでも再生できます。";
}