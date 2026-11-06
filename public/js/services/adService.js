import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  AdmobConsentStatus,
  InterstitialAdPluginEvents
} from "@capacitor-community/admob";

import { isPremium } from "./premiumService.js";

let initialized = false;
let bannerShown = false;

const TEST_BANNER_IDS = {
  android: "ca-app-pub-3940256099942544/9214589741",
  ios: "ca-app-pub-3940256099942544/2435281174"
};

export async function showBanner() {
  // Webブラウザではネイティブ広告を表示しない
  if (!Capacitor.isNativePlatform()) return;

  // プレミアム会員には広告を表示しない
  if (isPremium()) {
    await hideBanner();
    return;
  }

  // 同じバナーの重複表示を防ぐ
  if (bannerShown) return;

  try {
    let consent = await AdMob.requestConsentInfo();

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
    }

    if (!consent.canRequestAds) {
      console.log("広告の同意が完了していないため表示を保留");
      return;
    }

    if (!initialized) {
      await AdMob.initialize();
      initialized = true;
    }

    const platform = Capacitor.getPlatform();
    const adId = TEST_BANNER_IDS[platform];

    await AdMob.showBanner({
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0
    });

    bannerShown = true;
    console.log("テストバナー広告を表示しました");
  } catch (error) {
    console.error("バナー広告の表示に失敗:", error);
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error("バナー広告の非表示に失敗:", error);
  } finally {
    bannerShown = false;
  }
}

//広告設定

const TEST_INTERSTITIAL_IDS = {
  android: "ca-app-pub-3940256099942544/1033173712",
  ios: "ca-app-pub-3940256099942544/4411468910"
};

// 全画面広告を表示し、閉じたら処理を続ける
export async function showInterstitialAd(onComplete = () => {}) {
  let finished = false;
  const listeners = [];

  // 広告が閉じられた場合も、失敗した場合も一度だけ実行
  const finish = async () => {
    if (finished) return;
    finished = true;

    await Promise.all(
      listeners.map(async (listener) => {
        try {
          await listener.remove();
        } catch (error) {
          console.warn("広告イベントの解除に失敗:", error);
        }
      })
    );

    onComplete();
  };

  // Web・プレミアムでは広告を出さずに続行
  if (!Capacitor.isNativePlatform() || isPremium()) {
    await finish();
    return;
  }

  try {
    // 広告の同意状況を確認
    let consent = await AdMob.requestConsentInfo();

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
    }

    // 広告をリクエストできない場合はホームへ進む
    if (!consent.canRequestAds) {
      await finish();
      return;
    }

    // AdMobを初期化
    if (!initialized) {
      await AdMob.initialize();
      initialized = true;
    }

    const platform = Capacitor.getPlatform();
    const adId = TEST_INTERSTITIAL_IDS[platform];

    if (!adId) {
      await finish();
      return;
    }

    // 広告が閉じられたとき
    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          void finish();
        }
      )
    );

    // 広告の読み込みに失敗したとき
    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToLoad,
        () => {
          void finish();
        }
      )
    );

    // 広告の表示に失敗したとき
    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        () => {
          void finish();
        }
      )
    );

    // 広告を読み込んで表示
    await AdMob.prepareInterstitial({ adId });
    await AdMob.showInterstitial();
  } catch (error) {
    console.error("全画面広告の表示に失敗:", error);
    await finish();
  }
}

// プレミアム状態が変わったらバナー広告を更新
if (typeof window !== "undefined") {
  window.addEventListener("premiumChanged", () => {
    if (isPremium()) {
      void hideBanner();
      return;
    }

    // 無料プランに戻った場合、トップ画面にいるときだけ再表示
    if (window.location.pathname.endsWith("/index.html")) {
      void showBanner();
    }
  });
}