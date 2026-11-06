import { load, save } from "./storageService.js";
import { isPremium } from "../services/premiumService.js";
import { initSwipeBack } from "../ui/swipeBack.js";

const KEY = "remix";

// 保存
export function saveRemix(data) {
  const list = load(KEY) || [];
  const exists = list.find(
    m => (m.title || m.name) === data.name
  );

  if(exists) {
    throw new Error("already_exists");
  }

  list.push({
    id: "mix_" + Date.now(),
    type: "mix",
    title: data.name,
    // 互換性のため残す
    name: data.name,
    sounds: data.sounds,
    createdAt: Date.now()
  });
  save(KEY, list);
}

// 取得
export function getRemixes() {
  return load(KEY) || [];
}

//削除
export function deleteRemix(id) {
  const list = getRemixes();
  save(KEY, list.filter(m => m.id !== id));
}

//強化
export function getRemix(id) {
  return getRemixes().find(mix => mix.id === id);
}

export function renameRemix(remixId, newName) {
  const list = getRemixes();
  const exists = list.find(
    r =>
      r.name === newName &&
      r.id !== remixId
  );

  if (exists) {
    throw new Error("already_exists");
  }

  const remix = list.find(r => r.id === remixId);

  if (!remix) return false;
  remix.name = newName;
  remix.title = newName;
  save(KEY, list);
  return true;
}

//編集用関数
export function updateRemix(remixId, updates) {
  const list = getRemixes();
  //同じ名前が存在するかの確認
  const exists = list.find(r =>
    r.id !== remixId &&
    (r.title || r.name) === (updates.title || updates.name)
  );
  if(exists){
    throw new Error("already_exists");
  }

  const index = list.findIndex(r => r.id === remixId);

  if (index === -1) return false;
  list[index] = {
    ...list[index],
    ...updates
  };
  save(KEY, list);
  return true;
}

//リミックス「︙」
export function moveRemixToTop(id){
  const list=getRemixes();
  const index=list.findIndex(r=>r.id===id);

  if(index===-1) return;
  const remix=list.splice(index,1)[0];
  list.unshift(remix);

  save(KEY,list);
}

// ミックス数取得
export function getRemixCount() {
  return getRemixes().length;
}