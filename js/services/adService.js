import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents
} from "@capacitor-community/admob";
import { isPremium } from "./premiumService.js";

let initialized = false;
let bannerShown = false;
let bannerListenersRegistered = false;

// ==============================
// App Tracking Transparency
// ==============================

let attRequestCompleted = false;

async function requestATTIfNeeded() {
  if (Capacitor.getPlatform() !== "ios") {
    return;
  }

  if (attRequestCompleted) {
    return;
  }

  try {
    const result = await AdMob.trackingAuthorizationStatus();

    recordAdDiagnostic("ATT：現在の許可状態", {
      status: result.status
    });

    if (result.status === "notDetermined") {
      recordAdDiagnostic("ATT：許可画面を表示");

      await AdMob.requestTrackingAuthorization();

      const updated = await AdMob.trackingAuthorizationStatus();

      recordAdDiagnostic("ATT：許可画面終了", {
        status: updated.status
      });
    }

    attRequestCompleted = true;

  } catch (error) {
    recordAdDiagnostic(
      "ATT：処理失敗",
      formatAdError(error)
    );
  }
}

const DIAG_KEY = "adDiagnostics";

function getDiagnostics() {
  try {
    return JSON.parse(localStorage.getItem(DIAG_KEY) || "[]");
  } catch {
    return [];
  }
}

const ADS_ENABLED = true;

// true：テスト広告
// false：本番広告
const USE_TEST_ADS = true;

const TEST_BANNER_IDS = {
  android: "ca-app-pub-3940256099942544/9214589741",
  ios: "ca-app-pub-3940256099942544/2934735716"
};

const PRODUCTION_BANNER_IDS = {
  android: "ca-app-pub-3588583677502543/5289987059",
  ios: "ca-app-pub-3588583677502543/0069"
};

const TEST_INTERSTITIAL_IDS = {
  android: "ca-app-pub-3940256099942544/1033173712",
  ios: "ca-app-pub-3940256099942544/4411468910"
};

const PRODUCTION_INTERSTITIAL_IDS = {
  android: "ca-app-pub-3588583677502543/8307032637",
  ios: "ca-app-pub-3588583677502543/7070"
};

function recordAdDiagnostic(type, detail = null) {
  const entry = {
    time: new Date().toLocaleTimeString("ja-JP"),
    type,
    detail
  };

  try {
    const history = getDiagnostics();
    history.push(entry);
    localStorage.setItem(
      DIAG_KEY,
      JSON.stringify(history.slice(-40))
    );
  } catch (error) {
    console.warn("[AdDiagnostics] 保存失敗:", error);
  }

  console.log("[AdDiagnostics]", entry);

}

function formatAdError(error) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? String(error ?? "詳細不明")
  };
}


// ==============================
// バナー広告イベント監視
// ==============================

async function registerBannerListeners() {
  if (bannerListenersRegistered) return;

  bannerListenersRegistered = true;

  try {
    await AdMob.addListener(
      BannerAdPluginEvents.SizeChanged,
      info => {
        const height = Math.max(0, Number(info?.height) || 0);
        document.documentElement.style.setProperty(
          "--ad-banner-height",
          `${height}px`
        );
        recordAdDiagnostic("バナー：表示サイズ変更", {
          width: info?.width,
          height
        });
      }
    );
    await AdMob.addListener(
      BannerAdPluginEvents.Loaded,
      () => {
        recordAdDiagnostic("バナー：読み込み成功");
      }
    );

    await AdMob.addListener(
      BannerAdPluginEvents.FailedToLoad,
      error => {
        document.documentElement.style.setProperty(
          "--ad-banner-height",
          "0px"
        );
        recordAdDiagnostic(
          "バナー：読み込み失敗",
          formatAdError(error)
        );
      }
    );

    await AdMob.addListener(
      BannerAdPluginEvents.AdImpression,
      () => {
        recordAdDiagnostic("バナー：インプレッション発生");
      }
    );

    await AdMob.addListener(
      BannerAdPluginEvents.Opened,
      () => {
        recordAdDiagnostic("バナー：広告が開かれた");
      }
    );

    await AdMob.addListener(
      BannerAdPluginEvents.Closed,
      () => {
        recordAdDiagnostic("バナー：広告が閉じられた");
      }
    );

    recordAdDiagnostic("バナー：イベント監視を登録");
  } catch (error) {
    recordAdDiagnostic(
      "バナー：イベント登録失敗",
      formatAdError(error)
    );
  }
}

// ==============================
// バナー広告
// ==============================

export async function showBanner() {
  recordAdDiagnostic("バナー：表示処理開始");

  if (!ADS_ENABLED) {
    recordAdDiagnostic("バナー：一時停止中");
    await hideBanner();
    return;
  }

  if (!Capacitor.isNativePlatform()) {
    recordAdDiagnostic("バナー：ネイティブ環境ではないため終了");
    return;
  }

  if (isPremium()) {
    recordAdDiagnostic("バナー：プレミアムのため非表示");
    await hideBanner();
    return;
  }

  if (bannerShown) {
    recordAdDiagnostic("バナー：すでに表示処理済み");
    return;
  }

  try {
    await registerBannerListeners();

    recordAdDiagnostic("バナー：同意情報を確認中");

    let consent = await AdMob.requestConsentInfo();

    recordAdDiagnostic("バナー：同意情報取得", {
      status: consent.status,
      canRequestAds: consent.canRequestAds,
      isConsentFormAvailable: consent.isConsentFormAvailable,
      privacyOptionsRequirementStatus: consent.privacyOptionsRequirementStatus
    });

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      recordAdDiagnostic("バナー：同意フォーム表示");
      consent = await AdMob.showConsentForm();

      recordAdDiagnostic("バナー：同意フォーム終了", {
        status: consent.status,
        canRequestAds: consent.canRequestAds
      });
    }

    if (!consent.canRequestAds) {
      recordAdDiagnostic("バナー：広告リクエスト不可");
      return;
    }

    await requestATTIfNeeded();

    if (!initialized) {
      recordAdDiagnostic("AdMob：初期化開始");
      await AdMob.initialize();
      initialized = true;
      recordAdDiagnostic("AdMob：初期化成功");
    }

    const platform = Capacitor.getPlatform();
    const adId = (USE_TEST_ADS ? TEST_BANNER_IDS : PRODUCTION_BANNER_IDS)[platform];

    recordAdDiagnostic("バナー：広告リクエスト開始", {
      platform,
      adUnitId: adId
    });

    await AdMob.showBanner({
      adId,
      npa: true,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0
    });

    bannerShown = true;

    recordAdDiagnostic(
      "バナー：showBanner処理完了（読み込み成功とは別）"
    );

  } catch (error) {
    recordAdDiagnostic(
      "バナー：処理中に例外発生",
      formatAdError(error)
    );
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.hideBanner();
    recordAdDiagnostic("バナー：非表示処理完了");
  } catch (error) {
    recordAdDiagnostic(
      "バナー：非表示失敗",
      formatAdError(error)
    );
  } finally {
    bannerShown = false;
    document.documentElement.style.setProperty(
      "--ad-banner-height",
      "0px"
    );
  }
}

// ==============================
// 全画面広告
// ==============================

export async function showInterstitialAd(onComplete = () => {}) {
  let finished = false;
  const listeners = [];

  const finish = async () => {
    if (finished) return;

    finished = true;

    await Promise.all(
      listeners.map(async listener => {
        try {
          await listener.remove();
        } catch (error) {
          console.warn("広告イベント解除失敗:", error);
        }
      })
    );

    recordAdDiagnostic("全画面広告：終了・次の処理へ");
    onComplete();
  };

  recordAdDiagnostic("全画面広告：表示処理開始");

  if (!ADS_ENABLED) {
    recordAdDiagnostic("全画面広告：一時停止中");
    await finish();
    return;
  }

  if (!Capacitor.isNativePlatform()) {
    recordAdDiagnostic("全画面広告：ネイティブ環境ではない");
    await finish();
    return;
  }

  if (isPremium()) {
    recordAdDiagnostic("全画面広告：プレミアムのため非表示");
    await finish();
    return;
  }

  try {
    recordAdDiagnostic("全画面広告：同意情報を確認中");

    let consent = await AdMob.requestConsentInfo();

    recordAdDiagnostic("全画面広告：同意情報取得", {
      status: consent.status,
      canRequestAds: consent.canRequestAds,
      privacyOptionsRequirementStatus: consent.privacyOptionsRequirementStatus
    });

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
    }

    if (!consent.canRequestAds) {
      recordAdDiagnostic("全画面広告：広告リクエスト不可");
      await finish();
      return;
    }

    await requestATTIfNeeded();

    if (!initialized) {
      recordAdDiagnostic("AdMob：初期化開始");
      await AdMob.initialize();
      initialized = true;
      recordAdDiagnostic("AdMob：初期化成功");
    }

    const platform = Capacitor.getPlatform();
    const adId = (USE_TEST_ADS ? TEST_INTERSTITIAL_IDS : PRODUCTION_INTERSTITIAL_IDS)[platform];

    if (!adId) {
      recordAdDiagnostic("全画面広告：広告IDが見つからない", {
        platform
      });
      await finish();
      return;
    }

    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.Loaded,
        () => {
          recordAdDiagnostic("全画面広告：読み込み成功");
        }
      )
    );

    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToLoad,
        error => {
          recordAdDiagnostic(
            "全画面広告：読み込み失敗",
            formatAdError(error)
          );
          void finish();
        }
      )
    );

    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.Showed,
        () => {
          recordAdDiagnostic("全画面広告：表示開始");
        }
      )
    );

    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        error => {
          recordAdDiagnostic(
            "全画面広告：表示失敗",
            formatAdError(error)
          );
          void finish();
        }
      )
    );

    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.AdImpression,
        () => {
          recordAdDiagnostic("全画面広告：インプレッション発生");
        }
      )
    );

    listeners.push(
      await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          recordAdDiagnostic("全画面広告：閉じられた");
          void finish();
        }
      )
    );

    recordAdDiagnostic("全画面広告：読み込みリクエスト開始", {
      platform,
      adUnitId: adId
    });

    await AdMob.prepareInterstitial({ adId, npa: true });

    recordAdDiagnostic("全画面広告：prepareInterstitial処理完了");

    await AdMob.showInterstitial();

    recordAdDiagnostic("全画面広告：showInterstitial処理完了");

  } catch (error) {
    recordAdDiagnostic(
      "全画面広告：処理中に例外発生",
      formatAdError(error)
    );

    await finish();
  }
}

// ==============================
// プレミアム状態変更
// ==============================

if (typeof window !== "undefined") {
  window.addEventListener("premiumChanged", () => {
    if (isPremium()) {
      void hideBanner();
      return;
    }

    if (window.location.pathname.endsWith("/index.html")) {
      void showBanner();
    }
  });
}