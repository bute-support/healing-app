import { isPremium, getPremiumType } from "./services/premiumService.js";
import { FREE_LIMIT, PREMIUM_LIMIT } from "./services/premiumLimit.js";
import { openPremium } from "./pages/premiumOverlay.js";
import { openManageSubscriptions } from "./services/purchaseService.js";

export function initPremiumMessage() {
  const el = document.getElementById("premiumMessage");
  if (!el) return;

  const reason = localStorage.getItem("premiumReason");

  // =========================
  // プレミアム限定機能から開いた場合
  // =========================
  if (reason) {

    const messages = {
      movie:
        "癒し動画はプレミアム限定です。",
      sound:
        "この音声はプレミアム限定です。",
      today:
        "今日の音はプレミアム限定です。\n毎日ランダムで3音が解放され、再生と動画をお楽しみいただけます。",
      saveLimit:
        `無料プランでは音声の保存は${FREE_LIMIT.savedSounds}件までです。\nプレミアムなら無制限に保存できます。`,
      mixLimit:
        `無料プランでは${FREE_LIMIT.mixSounds}音までミックスできます。\nプレミアムなら${PREMIUM_LIMIT.mixSounds}音までミックスできます。`,
      remixLimit:
        "無料プランではミックス作成は5個までです。\nプレミアムなら無制限に作成できます。"
    };

    el.textContent =
      messages[reason] ||
      "この機能はプレミアム限定です。";

    el.classList.add("show");
    // 一度表示したら理由を削除
    localStorage.removeItem("premiumReason");

    return;
  }

  // =========================
  // 設定から直接開いた場合
  // =========================
  if (isPremium()) {
    el.textContent =
      "現在：プレミアムプランをご利用中です。\nいつもありがとうございます♪";

  } else {

    el.textContent =
      "現在：無料プランです。\nプレミアムに変更しませんか？";
  }
  el.classList.add("show");
}

// ========================================
// プレミアム状態表示（設定画面）
// ========================================

export function initPremiumStatus() {
  const area = document.getElementById("premiumArea");
  if (!area) return;

  const premium = isPremium();
  const status = premium
    ? "現在：プレミアムプラン"
    : "現在：無料プラン";

  // 状態表示とボタンを先にまとめて生成する
  let html = `<p class="premium-status">${status}</p>`;

  // プレミアム購入画面内では状態表示だけにする
  if (location.pathname.endsWith("premium.html")) {
    area.innerHTML = html;
    return;
  }

  const type = getPremiumType();
  const canManageSubscription =
    premium && (type === "monthly" || type === "yearly");

  if (canManageSubscription) {
    html += `
      <button id="manageSubBtn" class="app-btn auto-width-btn">
        サブスクリプションを管理
      </button>
    `;
  }

  html += `
    <button id="premiumDetailBtn" class="app-btn auto-width-btn">
      ${premium ? "プラン内容・価格を確認する ▶︎" : "詳しいプランを見る ▶︎"}
    </button>
  `;

  // HTMLを一度だけ反映する
  area.innerHTML = html;

  // 要素生成後にイベントを登録する
  const manageSubBtn = area.querySelector("#manageSubBtn");

  if (manageSubBtn) {
    console.log("[Subscriptions] 管理ボタンを作成しました");

    manageSubBtn.addEventListener("click", () => {
      console.log("[Subscriptions] 設定画面の管理ボタンがクリックされました");
      openManageSubscriptions();
    });
  }

  area
    .querySelector("#premiumDetailBtn")
    ?.addEventListener("click", openPremium);
}