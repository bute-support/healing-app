import { getSavedSounds } from "./storage/savedSounds.js";
import { isPremium } from "./services/premiumService.js";
import { FREE_LIMIT, PREMIUM_LIMIT, goPremium } from "./services/premiumLimit.js";
import { showToast } from "./ui/toast.js";

// 保存済音声一覧
export function renderSavedSounds(containerId, selectedSounds = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const selectedMap = new Map(
    selectedSounds.map(item => {
      if (item && typeof item === "object") {
        return [
          String(item.id),
          Number.isFinite(Number(item.volume))
            ? Math.max(0, Math.min(1, Number(item.volume)))
            : 1
        ];
      }

      return [String(item), 1];
    })
  );

  container.innerHTML = getSavedSounds()
    .map(sound => {
      const id = String(sound.id);
      const checked = selectedMap.has(id);
      const volume = selectedMap.get(id) ?? 1;
      const title = sound.title || sound.label || sound.name || "";

      return `
        <div class="editSoundItem">
          <label class="editSoundMain">
            <input
              type="checkbox"
              class="editSoundCheckbox"
              value="${id}"
              ${checked ? "checked" : ""}
            >
            <img src="../assets/${sound.image || ""}" alt="">
            <span>${title}</span>
          </label>

          <div class="editSoundVolume" ${checked ? "" : "hidden"}>
            <div class="editSoundVolumeHeader">
              <span>音量</span>
              <span class="editSoundVolumeValue">${Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              class="editSoundVolumeSlider"
              min="0"
              max="1"
              step="0.01"
              value="${volume}"
              aria-label="${title}の音量"
            >
          </div>
        </div>
      `;
    })
    .join("");

  // 選択・音量調整
  container.querySelectorAll(".editSoundItem").forEach(item => {
    const checkbox = item.querySelector(".editSoundCheckbox");
    const volumeArea = item.querySelector(".editSoundVolume");
    const slider = item.querySelector(".editSoundVolumeSlider");
    const valueLabel = item.querySelector(".editSoundVolumeValue");

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        const limit = isPremium()
          ? PREMIUM_LIMIT.mixSounds
          : FREE_LIMIT.mixSounds;

        const checkedCount = container.querySelectorAll(
          ".editSoundCheckbox:checked"
        ).length;

        if (checkedCount > limit) {
          checkbox.checked = false;

          showToast(
            isPremium()
              ? `プレミアムでは${limit}音まで選択できます`
              : `無料プランでは${limit}音まで選択できます`
          );

          if (!isPremium()) {
            setTimeout(() => goPremium("mixLimit"), 500);
          }

          return;
        }
      }

      volumeArea.hidden = !checkbox.checked;
    });

    slider.addEventListener("input", () => {
      valueLabel.textContent =
        `${Math.round(Number(slider.value) * 100)}%`;
    });
  });
}

// 選択された音と個別音量を取得
export function getSelectedSounds(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  return [
    ...container.querySelectorAll(".editSoundCheckbox:checked")
  ].map(checkbox => {
    const item = checkbox.closest(".editSoundItem");
    const slider = item.querySelector(".editSoundVolumeSlider");

    return {
      id: checkbox.value,
      volume: Number(slider.value)
    };
  });
}

// 初期化
export function initSelector() {}
