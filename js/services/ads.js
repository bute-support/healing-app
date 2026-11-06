import { isPremium } from "./premiumService.js";

// バナー広告
export function showBanner() {
  if (isPremium()) return;
  console.log("バナー広告表示");
}

// 全画面広告
export function showInterstitial(callback) {
  if (isPremium()) {
    callback();
    return;
  }
  console.log("全画面広告");
  // 本番ではここで広告SDK
  setTimeout(()=>{
    callback();
  }, 1500);
}