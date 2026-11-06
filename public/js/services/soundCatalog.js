// 音声データの検索と「今日の音」の判定
// ※ data.js 以外には依存しない（storage 側からも安全に import できるようにするため）
import { sounds, todaySounds } from "../data.js";

export const allSounds = [...sounds, ...todaySounds];

const dailyIds = new Set(todaySounds.map(s => String(s.id)));

export const isMix = item =>
  item?.type === "mix" || Array.isArray(item?.sounds);

export function findSound(id) {
  return allSounds.find(s => String(s.id) === String(id)) || null;
}

// 今日の音か（item でも id でも渡せる）
export function isDailySound(itemOrId) {
  const id = typeof itemOrId === "object" ? itemOrId?.id : itemOrId;
  return dailyIds.has(String(id));
}