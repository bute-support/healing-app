import { load, save } from "./storageService.js";

const KEY = "mixDraft";

// 追加（＋ボタン）
export function addDraft(sound) {
  const list = load(KEY) || [];
  // 重複防止
  if (!list.find(s => s.id === sound.id)) {
    list.push(sound);
    save(KEY, list);
  }
}

// 取得
export function getDraft() {
  return load(KEY) || [];
}

// クリア（作成後）
export function clearDraft() {
  save(KEY, []);
}

//Draft削除
export function removeDraft(id) {
  const list = getDraft();
  save(
    KEY,
    list.filter(
      s => s.id !== id
    )
  );
}