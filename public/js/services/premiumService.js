// プレミアム状態
// 判定の元は購入サービス(RevenueCat)。ここには「結果のキャッシュ」だけを持つ。
// localStorage は端末上で書き換えられるので、起動のたびに purchaseService が上書きして再検証する。

import { getRemixCreationLimit } from "./premiumLimit.js";

const KEY = "premiumCache"; // { active, type: "monthly"|"yearly"|"lifetime"|null, checkedAt }

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {
    return null;
  }
}

//export function isPremium() {
  //return readCache()?.active === true;
//}
//export function getPremiumType() {
  //return readCache()?.type || null;
//}
// 開発テスト専用：無料プランを強制する
// テストが終わったら false に戻す+↑戻す
const FORCE_FREE_FOR_TESTING = true;

export function isPremium() {
    if (FORCE_FREE_FOR_TESTING) return false;
    return readCache()?.active === true;
}

export function getPremiumType() {
    if (FORCE_FREE_FOR_TESTING) return null;
    return readCache()?.type || null;
}

// purchaseService だけが呼ぶ。状態が変わったときは画面更新用のイベントを出す
export function setPremiumCache({ active, type = null }) {
  const before = isPremium();
  localStorage.setItem(
    KEY,
    JSON.stringify({ active: !!active, type, checkedAt: Date.now() })
  );
  if (before !== !!active) {
    window.dispatchEvent(new Event("premiumChanged"));
  }
}

// ミックス作成回数の上限
export function getRemixLimit() {
  return getRemixCreationLimit(isPremium());
}