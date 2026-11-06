import { Purchases } from "@revenuecat/purchases-capacitor";
import { isPremium, setPremiumCache } from "./premiumService.js";

const API_KEY = "appl_KEarfjHdnDeUQjuSRDUTbUFfaFb";
// RevenueCat の Entitlement ID
const ENTITLEMENT_ID = "premium";

const plugin = () => Purchases;

console.log(
  "[Purchases][DIAG] Purchases.then:",
  typeof Purchases.then
);
console.log(
  "[Purchases][DIAG] Purchases.configure:",
  typeof Purchases.configure
);

// 商品IDの末尾で種別を判定（.monthly / .yearly / .lifetime）
function typeFromProductId(id = "") {
  if (id.includes("lifetime")) return "lifetime";
  if (id.includes("year")) return "yearly";
  if (id.includes("month")) return "monthly";
  return null;
}

function applyCustomerInfo(info) {
  const ent = info?.entitlements?.active?.[ENTITLEMENT_ID];
  setPremiumCache({
    active: !!ent,
    type: ent ? typeFromProductId(ent.productIdentifier) : null
  });
}

let sdkPromise = null;




async function ensureSdk() {
  console.log("[Purchases] ensureSdk entered");

  const P = plugin();

  if (!P) {
    console.error("[Purchases] plugin unavailable");
    return false;
  }

  if (!sdkPromise) {
    console.log("[Purchases] configuring SDK");

    sdkPromise = (async () => {
      if (!API_KEY || API_KEY.includes("HERE")) {
        throw new Error(
          "purchaseService.js の API_KEY を設定してください"
        );
      }

      console.log("[Purchases] configure started");
      await P.configure({ apiKey: API_KEY });
      console.log("[Purchases] configure completed");

      await P.addCustomerInfoUpdateListener(applyCustomerInfo);
      console.log("[Purchases] listener registered");

      return true;
    })().catch(error => {
      console.error("[Purchases] SDK initialization failed:", error);
      sdkPromise = null;
      throw error;
    });
  } else {
    console.log("[Purchases] reusing SDK promise");
  }

  console.log("[Purchases][SDK-1] before await sdkPromise");

const initialized = await sdkPromise;

console.log(
  "[Purchases][SDK-2] after await sdkPromise",
  initialized
);

if (!initialized) {
  return null;
}

console.log("[Purchases] SDK ready");
return true;
}

// 起動時に呼ぶ：現在の購入状態で上書き（失効・解約もここで反映される）
export async function initPurchases() {
  try {
    const initialized = await ensureSdk();

    if (!initialized) {
      return false;
    }

    const P = plugin();
    const { customerInfo } = await P.getCustomerInfo();

    console.log(
      "[Purchases][DIAG] active entitlements:",
      Object.keys(customerInfo?.entitlements?.active || {})
    );

    console.log(
      "[Purchases][DIAG] premium entitlement:",
      customerInfo?.entitlements?.active?.premium || null
    );

    applyCustomerInfo(customerInfo);

    return true;
  } catch (e) {
    console.error("[Purchases] init:", e);
    return false;
  }
}

async function getPackages() {
  console.log("[Purchases][PKG-1] getPackages start");

  try {
    const initialized = await ensureSdk();

    if (!initialized) {
      console.error("[Purchases] SDK is not initialized");
      return null;
    }

    const P = plugin();

    console.log("[Purchases][PKG-6] before getOfferings");

    const offerings = await P.getOfferings();

    console.log("[Purchases] Offering details:", JSON.stringify(
  offerings?.current,
  (key, value) => {
    if (key === "product") {
      return {
        identifier: value?.identifier,
        price: value?.price,
        priceString: value?.priceString,
        currencyCode: value?.currencyCode
      };
    }
    return value;
  },
  2
));

    console.log(
      "[Purchases][PKG-7] getOfferings resolved",
      !!offerings
    );

    const current = offerings?.current;

    if (!current) {
      console.error("[Purchases] current offering not found");
      return null;
    }

    return {
      monthly: current.monthly,
      yearly: current.annual,
      lifetime: current.lifetime
    };
  } catch (error) {
    console.error("[Purchases] getPackages failed:", error);
    throw error;
  }
}

// 価格表示は StoreKit のローカライズ価格を使う（HTML の data-price に差し込む）
export async function renderPrices() {
  try {
    const pk = await getPackages();
    if (!pk) return false;
    document.querySelectorAll("[data-price]").forEach(el => {
      const p = pk[el.dataset.price];
      if (p?.product?.priceString) el.textContent = p.product.priceString;
    });
    return true;
  } catch (e) {
    console.error("[Purchases] prices:", e);
    return false;
  }
}

async function buy(kind) {
  try {
    console.log("[Purchases] buy started:", kind);

    console.log("[Purchases][BUY-A] before ensureSdk");

    const P = plugin();

    console.log("[Purchases][BUY-B] plugin available", !!P);

    if (!P) {
      return {
        ok: false,
        message: "この環境では購入できません"
      };
    }

    console.log("[Purchases] getting packages");
    const pk = await getPackages();
    console.log("[Purchases] packages received:", {
      monthly: !!pk?.monthly,
      yearly: !!pk?.yearly,
      lifetime: !!pk?.lifetime
    });

    const pkg = pk?.[kind];

    if (!pkg) {
      return {
        ok: false,
        message: "商品情報を取得できませんでした。通信状況をご確認ください"
      };
    }

    console.log("[Purchases] calling purchasePackage:", kind);

    const { customerInfo } =
      await P.purchasePackage({ aPackage: pkg });

    console.log("[Purchases] purchasePackage completed");

    applyCustomerInfo(customerInfo);

    return isPremium()
      ? { ok: true }
      : { ok: false, message: "購入を確認できませんでした" };

  
} catch (e) {
  console.error("[Purchases] buy error:", e);
  console.error("[Purchases] error name:", e?.name);
  console.error("[Purchases] error message:", e?.message);
  console.error("[Purchases] error stack:", e?.stack);
  console.error(
    "[Purchases] error JSON:",
    JSON.stringify(e, Object.getOwnPropertyNames(e || {}))
  );

  if (e?.userCancelled) {
    return { ok: false, cancelled: true };
  }

  return {
    ok: false,
    message: e?.message || "購入処理に失敗しました。ログを確認してください。"
  };
}
}

export const purchaseMonthly = () => buy("monthly");
export const purchaseYearly = () => buy("yearly");
export const purchaseLifetime = () => buy("lifetime");

export async function restorePurchases() {
  try {
    const initialized = await ensureSdk();

if (!initialized) {
  // 既存の関数が定めている失敗時の戻り値を返す
  return false;
}

const P = plugin();
    if (!P) return { success: false, message: "この環境では復元できません" };

    const { customerInfo } = await P.restorePurchases();
    applyCustomerInfo(customerInfo);

    return isPremium()
      ? { success: true }
      : { success: false, message: "復元できる購入が見つかりませんでした" };
  } catch (e) {
    console.error("[Purchases] restore:", e);
    return { success: false, message: "復元に失敗しました" };
  }
}

// サブスクの管理・解約は Apple の画面へ誘導する
export function openManageSubscriptions() {
  console.log("[Subscriptions] 管理ボタンが押されました");
  window.location.href = "https://apps.apple.com/account/subscriptions";
}