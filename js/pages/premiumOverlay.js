import { initPremiumMessage } from "../premium.js";
import {
  loadOverlay,
  showOverlay,
  hideOverlay
} from "../ui/overlayManager.js";
import {
  purchaseMonthly,
  purchaseYearly,
  purchaseLifetime,
  restorePurchases,
  initPurchases,
  renderPrices
} from "../services/purchaseService.js";
import {
  isPremium,
  getPremiumType
} from "../services/premiumService.js";
import { showToast } from "../ui/toast.js";
import { openTerms } from "./termsOverlay.js";
import { registerSwipeBack } from "../ui/swipeBack.js";

let premiumRoot = null;

function getPurchaseErrorMessage(error) {
  const detail = String(
    error?.message || error?.code || error?.errorCode || error || ""
  );

  if (
    /cancelled|canceled|user.?cancel/i.test(detail)
  ) {
    return "購入はキャンセルされました。料金は請求されていません。";
  }

  if (
    /None of the products registered|Error fetching offerings|products? .*not found|offerings|code.?23/i.test(detail)
  ) {
    return "現在、購入に必要な商品情報を取得できません。購入環境を確認してから、もう一度お試しください。";
  }

  return "購入処理を完了できませんでした。通信状況や購入設定を確認してから、もう一度お試しください。";
}

function showPurchaseMessage(error) {
  let overlay = document.getElementById("purchaseMessageOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "purchaseMessageOverlay";
    overlay.className = "purchase-message-overlay";
    overlay.innerHTML = `
      <section
        class="purchase-message-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchaseMessageTitle"
        aria-describedby="purchaseMessageText"
      >
        <div class="purchase-message-icon" aria-hidden="true">!</div>
        <h2 id="purchaseMessageTitle">購入できませんでした</h2>
        <p id="purchaseMessageText"></p>
        <button type="button" class="purchase-message-close">閉じる</button>
      </section>
    `;

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closePurchaseMessage();
    });

    overlay.querySelector(".purchase-message-card")
      .addEventListener("click", event => event.stopPropagation());

    overlay.querySelector(".purchase-message-close")
      .addEventListener("click", closePurchaseMessage);

    document.body.appendChild(overlay);
  }

  document.getElementById("purchaseMessageText").textContent =
    getPurchaseErrorMessage(error);

  overlay.classList.add("active");
  overlay.querySelector(".purchase-message-close").focus();
}

function closePurchaseMessage() {
  document.getElementById("purchaseMessageOverlay")?.remove();
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closePurchaseMessage();
});


const planConfig = {
  monthly: {
    buttonId: "monthlyBtn",
    badge: "まずはここから",
    button: "月額で始める",
    activeButton: "✓ 現在加入中",
    activeBadge: "加入中"
  },
  yearly: {
    buttonId: "yearlyBtn",
    badge: "おすすめ",
    button: "年額で始める",
    activeButton: "✓ 現在加入中",
    activeBadge: "加入中"
  },
  lifetime: {
    buttonId: "lifetimeBtn",
    badge: "長く使う方に",
    button: "買い切りで購入",
    activeButton: "✓ 購入済み",
    activeBadge: "購入済み"
  }
};

export async function loadPremium() {
  premiumRoot = await loadOverlay(
    "premiumContainer",
    "pages/premium.html"
  );

  document
    .getElementById("closePremium")
    ?.addEventListener("click", closePremium);

  registerSwipeBack(
    "premium",
    closePremium,
    () =>
      document.getElementById("premiumOverlay")
        ?.classList.contains("active") === true,
    20
  );

  initPremiumButtons();
  initSubscriptionManagementButton();
  initLegalLinks();

  // 保存済みの状態を先に反映
  updatePlanDisplay();

  // 最新の購入状態を確認して画面を更新
  initPurchases().then(async () => {
    initPremiumMessage();
    updatePlanDisplay();
    await renderPrices();
  }).catch(error => {
    console.error("[Premium] Purchase status update failed:", error);
  });
}

function updatePlanDisplay() {
  const container = document.querySelector(".premium-plan-wrap");
  if (!container) return;

  const premium = isPremium();
  const activeType = premium ? getPremiumType() : null;

  const cards = Object.keys(planConfig).map(type => {
    const config = planConfig[type];
    const button = document.getElementById(config.buttonId);
    const card = button?.closest(".premium-card");

    return { type, config, button, card };
  }).filter(item => item.card && item.button);

  // まず各カードを初期表示に戻す
  cards.forEach(({ config, button, card }) => {
    const badge = card.querySelector(".premium-badge");

    if (badge) {
      badge.textContent = config.badge;
    }

    button.disabled = false;
    button.textContent = config.button;
    button.removeAttribute("aria-label");
    button.classList.remove("premium-btn-current");
  });

  // 加入中のプランが特定できる場合、そのカードを先頭へ移動
  const activeCard = cards.find(item => item.type === activeType);

  if (premium && activeCard) {
    const { type, config, button, card } = activeCard;
    const badge = card.querySelector(".premium-badge");

    if (badge) {
      badge.textContent = config.activeBadge;
    }

    button.disabled = true;
    button.textContent = config.activeButton;
    button.setAttribute("aria-label", config.activeButton);
    button.classList.add("premium-btn-current");

    // 加入中のカードを先頭にし、残りは元の順序を維持
    container.prepend(card);
  }

  // 加入状態が変わった場合もカード順を整える
  if (!premium || !activeCard) {
    cards.forEach(({ card }) => container.append(card));
  }
}


function initSubscriptionManagementButton() {
  const button = document.getElementById("manageSubscriptionBtn");

  console.log("[Premium] 管理ボタン取得結果:", button);

  if (!button) {
    console.error("[Premium] manageSubscriptionBtn が見つかりません");
    return;
  }

  if (button.dataset.initialized === "true") {
    console.log("[Premium] クリックイベントは登録済みです");
    return;
  }

  button.dataset.initialized = "true";

  button.addEventListener("click", async () => {
  console.log("[Premium] 管理ボタンが押されました");

  const url = "https://apps.apple.com/account/subscriptions";

  try {
    const browser = window.Capacitor?.Plugins?.Browser;

    if (browser?.open) {
      await browser.open({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error(
      "[Premium] Failed to open subscription management:",
      error
    );

    window.open(url, "_blank", "noopener,noreferrer");
  }
});
}

function initLegalLinks() {
  const termsLink = document.getElementById("premiumTermsLink");
  const privacyLink = document.getElementById("premiumPrivacyLink");

  const openTermsFromPremium = async event => {
    event.preventDefault();
    closePremium();
    await openTerms();
  };

  termsLink?.addEventListener("click", openTermsFromPremium);
  privacyLink?.addEventListener("click", openTermsFromPremium);
}

function initPremiumButtons() {
  const monthlyBtn = document.getElementById("monthlyBtn");
  const yearlyBtn = document.getElementById("yearlyBtn");
  const lifetimeBtn = document.getElementById("lifetimeBtn");
  const restoreBtn = document.getElementById("restorePurchaseBtn");

  const setupPurchaseBtn = (btn, purchaseFn, defaultLabel) => {
    if (!btn) return;

    btn.addEventListener("click", async () => {
      // 加入状態を確認し、同じプランの購入を防ぐ
      updatePlanDisplay();

      if (btn.disabled) return;

      btn.disabled = true;
      btn.textContent = "購入中...";

      try {
        const result = await purchaseFn();

        if (result?.ok) {
          btn.textContent = "購入完了！";
          setTimeout(() => location.reload(), 800);
          return;
        }

        btn.disabled = false;
        btn.textContent = defaultLabel;

        if (!result?.cancelled) {
          showPurchaseMessage(result);
        }

        updatePlanDisplay();
      } catch (error) {
        console.error("[Premium] Purchase failed:", error);

        btn.disabled = false;
        btn.textContent = defaultLabel;

        showPurchaseMessage(error);
        updatePlanDisplay();
      }
    });
  };

  setupPurchaseBtn(monthlyBtn, purchaseMonthly, "月額で始める");
  setupPurchaseBtn(yearlyBtn, purchaseYearly, "年額で始める");
  setupPurchaseBtn(lifetimeBtn, purchaseLifetime, "買い切りで購入");

  if (restoreBtn) {
    restoreBtn.addEventListener("click", async () => {
      restoreBtn.disabled = true;
      restoreBtn.textContent = "確認中...";

      try {
        const result = await restorePurchases();

        if (result.success) {
          showToast("購入を復元しました");
          setTimeout(() => location.reload(), 800);
        } else {
          showToast(
            result.message || "復元できる購入が見つかりませんでした"
          );
        }
      } catch (error) {
        console.error("[Premium] Restore failed:", error);
        showToast("購入の復元に失敗しました");
      } finally {
        restoreBtn.disabled = false;
        restoreBtn.textContent = "購入を復元する";
      }
    });
  }
}

export async function openPremium() {
  if (!document.getElementById("premiumOverlay")) {
    await loadPremium();
  }

  showOverlay("premiumOverlay");
  initPremiumMessage();
  updatePlanDisplay();
  window.lucide?.createIcons?.();
}

export function closePremium() {
  hideOverlay("premiumOverlay");

  const msg = document.getElementById("premiumMessage");

  if (msg) {
    msg.textContent = "";
    msg.classList.remove("show");
  }
}

window.addEventListener("openPremium", () => {
  openPremium();
});
