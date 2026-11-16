import { getRemixes, deleteRemix } from "../storage/remix.js";
import { openPlayerFromList } from "../services/soundAccess.js";
import { vibrate } from "../ui/vibrate.js";
import { getTitle, escapeHtml } from "./previewList.js";
import { showToast } from "../ui/toast.js";
import { isPremium, getRemixLimit } from "../services/premiumService.js";

export function renderQuickMixInfo(root, onChange) {
  const count = root.querySelector("#quickMixCount");
  const list = root.querySelector("#quickMixList");

  if (!list) return;

  const mixes = getRemixes();

  if (count) {
    const max = isPremium() ? "無制限" : getRemixLimit();
    count.textContent = `ミックス数 ${mixes.length}/${max}件`;
  }

  list.innerHTML = mixes.length === 0
    ? `
      <div class="empty-state">
        <h4>ミックスはまだ作成されていません</h4>
        <p>作成したミックスがここに表示されます</p>
      </div>
    `
    : mixes.map(mix => `
      <div class="saved-row">
        <button
          type="button"
          class="saved-name quick-mix-play"
          data-id="${escapeHtml(String(mix.id))}"
        >
          ${escapeHtml(getTitle(mix))}
        </button>
        <button
          type="button"
          class="deleteSavedBtn quick-mix-delete"
          data-id="${escapeHtml(String(mix.id))}"
          aria-label="ミックスを削除"
        >
          削除
        </button>
      </div>
    `).join("");

  list.onclick = (e) => {
    const deleteBtn = e.target.closest(".quick-mix-delete");

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const mix = getRemixes().find(item => String(item.id) === id);

      if (!mix) return;

      if (!confirm(`「${getTitle(mix)}」を削除しますか？`)) return;

      deleteRemix(id);
      vibrate();
      showToast("ミックスを削除しました");
      onChange?.();
      return;
    }

    const playBtn = e.target.closest(".quick-mix-play");

    if (playBtn) {
      const mix = getRemixes().find(
        item => String(item.id) === playBtn.dataset.id
      );

      if (!mix) return;

      openPlayerFromList(
        { ...mix, title: mix.title || mix.name },
        { loading: true }
      );
    }
  };

  window.lucide?.createIcons?.();
}
