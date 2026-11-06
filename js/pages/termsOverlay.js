import { initTheme } from "../ui/theme.js";
import { loadOverlay, showOverlay, hideOverlay } from "../ui/overlayManager.js";
import { registerSwipeBack } from "../ui/swipeBack.js";

let termsRoot = null;

/* =========================================================
   利用規約ページ読み込み
========================================================= */
export async function loadTerms() {

  termsRoot = await loadOverlay(
    "termsContainer",
    "components/terms.html"
  );

  /* 戻る */
  document
    .getElementById("backTerms")
    ?.addEventListener("click", closeTerms);

  /* スライドで戻る */
  registerSwipeBack(
    "terms",
    closeTerms,
    () =>
        document.getElementById("termsOverlay")
            ?.classList.contains("active") === true,
    30
  );

  /* レビュー */
  document.getElementById("reviewBtn")?.addEventListener("click", () => {
    const appId = "ここにApp Store ConnectでアプリIDが発行されたら入れる";
    window.location.href = `itms-apps://apps.apple.com/app/id${appId}?action=write-review`;
  });

  /* =========================================================
   全文アコーディオン
　========================================================= */
  document
    .querySelectorAll(".terms-accordion-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {
        const isOpen =
          button.getAttribute("aria-expanded") === "true";

        button.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );
      });
    });

  /* =========================================================
   各条文アコーディオン
　========================================================= */
  document
    .querySelectorAll(".terms-article-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const isOpen =
          button.getAttribute("aria-expanded") === "true";

        button.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );
      });
  });
 
  /* お問い合わせ：アドレスをコピー
     （メールが開けない環境でも、他のアプリに貼り付けられるように） */
  document
    .getElementById("copyEmailBtn")
    ?.addEventListener("click", async () => {

      try {
        await navigator.clipboard.writeText("bute.support@gmail.com");
        alert("メールアドレスをコピーしました");
      } catch (err) {
        console.error("[Terms] clipboard error:", err);
      }
  });

  /* Theme / Lucide */
  initTheme();
  window.lucide?.createIcons?.();

}

/* =========================================================
   利用規約を開く
========================================================= */
export async function openTerms() {
  if (!document.getElementById("termsOverlay")) {
    await loadTerms();
  }

  showOverlay("termsOverlay");

  initTheme();
  window.lucide?.createIcons?.();

}

/* =========================================================
   利用規約を閉じる
========================================================= */
export function closeTerms() {

  hideOverlay("termsOverlay");

}