import { getFavorites, deleteFavorite } from "../storage/favorites.js";
import { filterVisible, openPlayerFromList } from "../services/soundAccess.js";
import { vibrate } from "../ui/vibrate.js";
import { getTitle, escapeHtml } from "./previewList.js";
import { showToast } from "../ui/toast.js";

//お気に入り
export function renderFavoriteInfo(root, onChange){
  const count = root.querySelector("#favoriteCount");
  const list = root.querySelector("#favoriteList");
  const btn = root.querySelector("#showFavoriteSetting");

  const favorites = filterVisible(getFavorites());

  // 件数表示
  if(count){
    count.textContent = `お気に入り ${favorites.length}件`;
  }

  // 一覧
  if(list){
    list.innerHTML =
      favorites.length === 0
      ? `
      <div class="empty-box">
        <i data-lucide="heart"></i>
        <h4>お気に入りはありません</h4>
        <p>音声をお気に入り登録するとここに表示されます</p>
      </div>
      `
      : favorites.map(item => `
        <div class="saved-row">
          <span class="saved-name favorite-row" data-id="${item.id}">
            ${escapeHtml(getTitle(item))}
          </span>
          <button class="deleteFavoriteBtn" data-id="${item.id}">
            削除
          </button>
        </div>
      `).join("");
  }

  // 開閉
  if(btn && list){
    btn.onclick = () => {
      list.classList.toggle("hidden");
      btn.textContent =
        list.classList.contains("hidden")
        ? "お気に入り一覧を見る"
        : "閉じる";
    };
  }

  initFavoriteClick(root, favorites);
  initFavoriteDelete(root, onChange);
  window.lucide?.createIcons?.();
}

//お気に入りクリック → player画面
function initFavoriteClick(root, favorites){
  root.querySelectorAll(".favorite-row").forEach(el => {
    el.onclick = () => {
      const item = favorites.find(i => String(i.id) === el.dataset.id);
      if(!item) return;
      openPlayerFromList(item, { loading: true });
    };
  });
}

//削除イベント
function initFavoriteDelete(root, onChange) {
  root.querySelectorAll(".deleteFavoriteBtn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const item = getFavorites().find(i => String(i.id) === String(id));
      const name = item ? getTitle(item) : "この音声";

      if(!confirm(`「${name}」をお気に入りから削除しますか？`)) return;

      deleteFavorite(id);
      vibrate();
      showToast("お気に入りから削除しました");
      onChange?.();
    };
  });
}