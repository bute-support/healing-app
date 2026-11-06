import { getSavedSounds, deleteSavedSounds } from "../storage/savedSounds.js";
import { isPremium } from "../services/premiumService.js";
import { FREE_LIMIT } from "../services/premiumLimit.js";
import { filterVisible, openPlayerFromList } from "../services/soundAccess.js";
import { showToast } from "../ui/toast.js";
import { vibrate } from "../ui/vibrate.js";
import { getTitle, escapeHtml } from "./previewList.js";

export function renderSavedInfo(root, onChange){
  const count = root.querySelector("#savedCount");
  const list = root.querySelector("#savedSoundList");
  const showBtn = root.querySelector("#showAllSaved");

  const saved = filterVisible(getSavedSounds());

  if(count){
    const max = isPremium() ? "無制限" : FREE_LIMIT.savedSounds;
    count.textContent = `保存数 ${saved.length}/${max}件`;
  }

  if(list){
    list.innerHTML = saved.length === 0
      ? `
      <div class="empty-box">
        <i data-lucide="music-2"></i>
        <h4>まだ保存した音声はありません</h4>
        <p>お気に入りの音を保存するとここに表示されます</p>
      </div>
      `
      : saved.map(sound => `
        <div class="saved-row">
          <button class="saved-name" data-id="${sound.id}">
            ${escapeHtml(getTitle(sound))}
          </button>
          <button class="deleteSavedBtn" data-id="${sound.id}">
            削除
          </button>
        </div>
      `).join("");

    // 音声名 → player画面
    list.querySelectorAll(".saved-name").forEach(btn => {
      btn.onclick = () => {
        const sound = saved.find(
          s => String(s.id) === btn.dataset.id
        );

        if(sound){
          openPlayerFromList(sound, { loading: true });
        }
      };
    });
  }

  if(showBtn && list){
    showBtn.onclick = () => {
      list.classList.toggle("hidden");

      showBtn.textContent =
        list.classList.contains("hidden")
          ? "保存一覧を見る"
          : "閉じる";
    };
  }

  // 削除ボタン
  initSavedDelete(root, onChange);

  window.lucide?.createIcons?.();
}


// ==============================
// 保存音声の削除
// ==============================
function initSavedDelete(root, onChange){

  root.querySelectorAll(".deleteSavedBtn").forEach(btn => {

    btn.onclick = () => {

      const id = btn.dataset.id;

      if(!id) return;

      deleteSavedSounds(id);

      vibrate();

      showToast("削除しました");

      // 一覧・件数を再描画
      onChange?.();
    };

  });

}


// ==============================
// どこからでも保存一覧を開く
// ==============================
export function openSavedSetting() {
  const list = document.getElementById("savedSoundList");
  const btn = document.getElementById("showAllSaved");

  if (list?.classList.contains("hidden")) {
    btn?.click();
  }

  document
    .getElementById("settingsOverlay")
    ?.classList.add("active");

  const item = [...document.querySelectorAll(".setting-item")]
    .find(item =>
      item.querySelector(".setting-btn")?.textContent.includes("保存")
    );

  item?.classList.add("active");
}