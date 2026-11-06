import { addHistory as saveHistory } from "./history.js";

/**
 * 再生履歴を保存する
 * @param {object} item 再生する音のデータ
 */
export function addHistory(item) {
  if (!item) return;

  try {
    saveHistory(item);
    window.dispatchEvent(new Event("listsChanged"));
  } catch (error) {
    console.error("[History] 履歴の保存に失敗しました:", error);
  }
}