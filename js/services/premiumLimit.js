import { openPremium } from "../pages/premiumOverlay.js";

// 無料版の上限
export const FREE_LIMIT = {
  savedSounds: 10,
  mixSounds: 4,
  remixes: 5
};

// プレミアム版の上限
export const PREMIUM_LIMIT = {
  mixSounds: 8,
  remixes: Infinity
};

// ミックス作成回数の上限を取得
export function getRemixCreationLimit(premium) {
  return premium
    ? PREMIUM_LIMIT.remixes
    : FREE_LIMIT.remixes;
}

// プレミアム画面を開く
export function goPremium(reason) {
  localStorage.setItem("premiumReason", reason);
  openPremium();
}