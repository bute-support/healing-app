//Draft一覧表示（作成途中の音表示）
import { renderSavedSounds, getSelectedSounds } from "../remixSelector.js";
import { initTheme } from "../ui/theme.js";
import { save } from "../storage/storageService.js";
import { isPremium } from "../services/premiumService.js";
import { FREE_LIMIT, PREMIUM_LIMIT, goPremium } from "../services/premiumLimit.js";
import { getRemixCount } from "../storage/remix.js";
import { showSaveLimitModal } from "../ui/limitModal.js";
import { showToast } from "../ui/toast.js";
import { initSwipeBack } from "../ui/swipeBack.js";

document.addEventListener("DOMContentLoaded", async()=>{

  initTheme();
  renderSavedSounds("soundSelectList");
});

// 音決定
document
  .getElementById("confirmSounds")
  .addEventListener("click", () => {

    const sounds =
      getSelectedSounds("soundSelectList");

    if (sounds.length === 0) {
      alert("音を選択してください");
      return;
    }

    // プランごとの音数制限
    const limit = isPremium()
      ? PREMIUM_LIMIT.mixSounds
      : FREE_LIMIT.mixSounds;

    if (sounds.length > limit) {

      if (isPremium()) {

        showToast(
          `プレミアムでは${PREMIUM_LIMIT.mixSounds}音まで選択できます`
        );

      } else {

        showToast(
          `無料プランでは${FREE_LIMIT.mixSounds}音まで選択できます`
        );

        setTimeout(() => {
          goPremium("mixLimit");
        }, 500);
      }
      return;
    }
    save("mixDraft", sounds);

    location.href = "../components/remixName.html";
  });

setTimeout(()=>{
  lucide.createIcons();
},100);

//戻るボタン
document
    .getElementById("backRemix")
    ?.addEventListener("click", () => history.back());

//スワイプで戻る
initSwipeBack(() => {
  history.back();
});