import { load, save } from "./storageService.js";
import { isDailySound } from "../services/soundCatalog.js";

const KEY = "history";
const DAY = 24 * 60 * 60 * 1000;

function expireFor(mode, base) {
  if (mode === "7") return base + 7 * DAY;
  if (mode === "30") return base + 30 * DAY;
  return null; // "off"
}

// 期限切れと今日の音を取り除く（変更があったときだけ保存する）
export function cleanHistory() {
  const list = load(KEY) || [];
  const now = Date.now();

  const cleaned = list.filter(item => {
    if (isDailySound(item)) return false;
    if (!item.expireAt) return true;
    return item.expireAt > now;
  });

  if (cleaned.length !== list.length) {
    save(KEY, cleaned);
  }
  return cleaned;
}

export function getHistory() {
  return cleanHistory();
}

export function addHistory(item) {
  // 今日の音は履歴に残さない
  if (!item || isDailySound(item)) return;

  let list = getHistory();

  // 同じIDは重複させない
  list = list.filter(i => String(i.id) !== String(item.id));

  const now = Date.now();
  const mode = localStorage.getItem("historyMode") || "7";

  list.unshift({
    id: item.id,
    type: item.type || "sound",
    title:
      item.title ||
      item.label ||
      item.name,
    image: item.image,
    audio: item.audio,
    sounds: item.sounds,
    volume: item.volume,

    time: now,
    expireAt: expireFor(mode, now)
  });

  save(KEY, list);
}

// 削除期間の変更：各履歴の「再生した日時」を基準に期限を計算し直す
export function updateHistoryExpire(mode) {
  const list = load(KEY) || [];
  const now = Date.now();

  const updated = list.map(item => ({
    ...item,
    expireAt: expireFor(mode, item.time || now)
  }));

  save(KEY, updated);
}