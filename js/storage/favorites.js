import { load, save } from "./storageService.js";
import { isDailySound } from "../services/soundCatalog.js";

const KEY = "favorites";

// 今日の音は、過去のデータに混ざっていても読み出し時に除外する
export function getFavorites() {
  return (load(KEY) || []).filter(i => !isDailySound(i));
}

// 追加・削除を切り替える。今日の音は追加できない（false を返す）
export function toggleFavorite(item) {
  if (!item || isDailySound(item)) return false;

  let list = getFavorites();
  const exists = list.some(i => String(i.id) === String(item.id));

  if (exists) {
    list = list.filter(i => String(i.id) !== String(item.id));
  } else {
    list.push({
      id: item.id,
      type: item.type || "sound",
      title: item.type === "mix"
        ? item.title || item.name
        : item.title || item.label,
      subtitle: item.subtitle || "",
      description: item.description || "",
      category: item.category || "",
      image: item.image,
      audio: item.audio,
      video: item.video,
      sounds: item.sounds,
      volume: item.volume
    });
  }

  save(KEY, list);
  return true;
}

export function isFavorite(id) {
  return getFavorites().some(i => String(i.id) === String(id));
}

export function updateFavoriteIcon(buttonId, itemId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const icon = btn.querySelector("svg");
  if (!icon) return;

  if (isFavorite(itemId)) {
    icon.classList.add("active");
  } else {
    icon.classList.remove("active");
  }
}

export function toggleFavoriteAndRefresh(buttonId, item) {
  const changed = toggleFavorite(item);
  updateFavoriteIcon(buttonId, item.id);
  return changed;
}

//削除
export function deleteFavorite(id) {
  const list = getFavorites().filter(i => String(i.id) !== String(id));
  save(KEY, list);
}