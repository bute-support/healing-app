import { initTheme } from "../ui/theme.js";
import { purchaseMonthly, purchaseLifetime } from "../services/purchaseService.js";
import { initPremiumStatus, initPremiumMessage } from "../premium.js";

/* =========================
  初期化
========================= */
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  initTheme();
  initPremiumStatus();
  initPremiumMessage();
  renderFeatures();
  initButtons();
});

/* =========================
  特典リスト
========================= */
const features = [
  "広告なし",
  "プレミアム限定サウンド",
  "癒し動画",
  "ミックス保存 無制限",
  "8音までミックス作成可能",
  "フェードアウトタイマー",
  "今夜の限定コンテンツ"
];

function renderFeatures() {
  const list =
    document.getElementById("featureList");

  if (!list) return;

  list.innerHTML = features
    .map(text =>
      `<div class="premium-feature">${text}</div>`
    )
    .join("");
}

/* =========================
  ボタン処理
========================= */
function initButtons() {
  const monthlyBtn =
    document.getElementById("monthlyBtn");

  const lifetimeBtn =
    document.getElementById("lifetimeBtn");

  // HTMLの id="closePremium" と一致
  const backBtn =
    document.getElementById("closePremium");

  /* =========================
    戻る
  ========================= */
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.back();
    });
  }

  /* =========================
    月額購入
  ========================= */
  if (monthlyBtn) {
    monthlyBtn.addEventListener("click", async () => {
      monthlyBtn.disabled = true;
      monthlyBtn.textContent = "購入中...";

      try {
        const result = await purchaseMonthly();

        if (result) {
          monthlyBtn.textContent = "購入完了！";

          setTimeout(() => {
            location.href = "index.html";
          }, 800);
        } else {

          monthlyBtn.disabled = false;
          monthlyBtn.textContent = "月額で始める";

          alert("購入できませんでした");
        }
      } catch (error) {

        console.error("月額購入エラー:", error);
        monthlyBtn.disabled = false;
        monthlyBtn.textContent = "月額で始める";

        alert("購入できませんでした");
      }
    });
  }

  /* =========================
    買い切り購入
  ========================= */
  if (lifetimeBtn) {
    lifetimeBtn.addEventListener("click", async () => {
      lifetimeBtn.disabled = true;
      lifetimeBtn.textContent = "購入中...";

      try {
        const result = await purchaseLifetime();

        if (result) {
          lifetimeBtn.textContent = "購入完了！";

          setTimeout(() => {
            location.href = "index.html";
          }, 800);

        } else {

          lifetimeBtn.disabled = false;
          lifetimeBtn.textContent = "買い切りで購入";

          alert("購入できませんでした");
        }
      } catch (error) {

        console.error("買い切り購入エラー:", error);

        lifetimeBtn.disabled = false;
        lifetimeBtn.textContent = "買い切りで購入";

        alert("購入できませんでした");
      }
    });
  }
}