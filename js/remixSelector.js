import { getSavedSounds } from "./storage/savedSounds.js";
import { isPremium } from "./services/premiumService.js";
import { FREE_LIMIT, PREMIUM_LIMIT, goPremium } from "./services/premiumLimit.js";
import { showToast } from "./ui/toast.js";

// 保存済音声一覧
export function renderSavedSounds(containerId, selectedIds = []) {

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = getSavedSounds()
    .map(sound => {

      const checked =
        selectedIds.includes(sound.id)
          ? "checked"
          : "";

      return `
        <label class="editSoundItem">
          <input
            type="checkbox"
            value="${sound.id}"
            ${checked}
          >

          <img src="../assets/${sound.image}" alt="">
          <span>
            ${sound.title || sound.label || sound.name}
          </span>
        </label>
      `;
    })
    .join("");

  // チェックボックスの上限処理
  container
    .querySelectorAll("input[type='checkbox']")
    .forEach(box => {

      box.addEventListener("change", () => {

        const limit = isPremium()
          ? PREMIUM_LIMIT.mixSounds
          : FREE_LIMIT.mixSounds;

        const checkedBoxes =
          container.querySelectorAll(
            "input[type='checkbox']:checked"
          );

        const checkedCount = checkedBoxes.length;

        // 上限を超えた
        if (checkedCount > limit) {
          // 今押したものを元に戻す
          box.checked = false;

          // プレミアム
          if (isPremium()) {
            showToast(
              `プレミアムでは${limit}音まで選択できます`
            );
          }

          // 無料
          else {
            showToast(`無料プランでは${limit}音まで選択できます`);

            // 少し遅らせてプレミアム案内
            setTimeout(() => {
              goPremium("mixLimit");
            }, 500);
          }
          return;
        }
      });
    });
}

// 選択された音を取得
export function getSelectedSounds(containerId) {
  return [
    ...document.querySelectorAll(
      `#${containerId} input:checked`
    )
  ].map(checkbox => checkbox.value);

}

// 初期化
export function initSelector() {}