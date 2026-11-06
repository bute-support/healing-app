import { load, save } from "./storageService.js";
import { isDailySound } from "../services/soundCatalog.js";

const KEY = "savedSounds";

//取得（今日の音は除外）
export function getSavedSounds() {
  return (load(KEY) || []).filter(s => !isDailySound(s));
}

//保存（今日の音・保存済みの音は false を返す）
export function saveSound(sound) {
  if (!sound || isDailySound(sound)) return false;

  const list = getSavedSounds();
  if (list.some(s => String(s.id) === String(sound.id))) return false;

  list.push({
    id: sound.id,
    type: sound.type || "sound",
    title:
      sound.title ||
      sound.name ||
      sound.label,
    image: sound.image,
    audio: sound.audio,
    sounds: sound.sounds,
    volume: sound.volume
  });
  save(KEY, list);
  return true;
}

//削除
export function deleteSavedSounds(id) {
  const list = getSavedSounds();
  save(
    KEY,
    list.filter(s => String(s.id) !== String(id))
  );
}