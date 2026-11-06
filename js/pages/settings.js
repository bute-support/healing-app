import { initTheme } from "../ui/theme.js";
import { initPremiumStatus } from "../premium.js";
import { getFavorites } from "../storage/favorites.js";
import { startOffTimer, clearOffTimer } from "../timer.js";
import { getHistory, cleanHistory, updateHistoryExpire } from "../storage/history.js";
import { getRemixes, deleteRemix, moveRemixToTop, getRemixCount } from "../storage/remix.js";
import { isPremium, getRemixLimit } from "../services/premiumService.js";
import { getSavedSounds, deleteSavedSounds } from "../storage/savedSounds.js";
import { renderPreviewList } from "../ui/listView.js";
import { FREE_LIMIT } from "../services/premiumLimit.js";
import { showSaveLimitModal } from "../ui/limitModal.js";
import { vibrate } from "../ui/vibrate.js";
import { showToast } from "../ui/toast.js";
import { showLoading } from "../ui/loading.js";
import { openPremium } from "./premiumOverlay.js";
import { loadTerms, openTerms } from "./termsOverlay.js";
import { loadOverlay } from "../ui/overlayManager.js";
import { showMixMenu, closeMixMenu } from "../ui/mixMenu.js";
import { renderFavoriteInfo } from "../settings/favoriteSetting.js";
import { renderSavedInfo, openSavedSetting } from "../settings/savedSetting.js";
import { initTimer, openTimerSetting } from "../settings/timerSetting.js";
import { initHistorySettings, attachSwipeDelete } from "../settings/historySetting.js";
import { createPreview, createSimpleItem, getTitle } from "../settings/previewList.js";
import { openPlayerFromList } from "../services/soundAccess.js";

// ユーザーが自由入力した文字列（ミックス名など）を
// そのままHTMLに差し込むとコードとして実行されてしまうため、
// 必ずこの関数を通してからテンプレートに入れる
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

let settingsRoot = null;
let initialized = false;

//ロード
export async function loadSettings() {
  if(initialized){
    console.log("settings already initialized");
    return;
  }

  await loadOverlay(
    "settingsContainer",
    "components/settings.html"
  );

  settingsRoot =
    document.getElementById(
      "settingsContainer"
    );

  if(!settingsRoot){
    console.error(
      "settingsRoot見つからない"
    );
    return;
  }
  initSettings(settingsRoot);
  initialized = true;
}

//初期化
function initSettings(root) {
  initOverlay(root);
  initAccordion(root);
  initTimer(root);
  initThemeButtons(root);
  renderVersion(root);

  initEvents(root);
  renderLists();

  initHistorySettings(root, renderLists);

  initTheme();
  initPremiumStatus();

  // プランが変わったら、購入状態の表示と一覧を更新する
  window.addEventListener("premiumChanged", () => {
    initPremiumStatus();
    renderLists();
  });

  // お気に入り・保存・履歴が変わったら一覧を更新する（player 画面などから通知される）
  window.addEventListener("listsChanged", () => {
    renderLists();
  });

  document
    .getElementById("menuCancel")
    ?.addEventListener(
        "click",
        closeMixMenu
    );
}

//イベント
function initEvents(root) {
  
  const createBtn = root.querySelector("#openMixCreate");
  const detailBtn = root.querySelector("#premiumDetailBtn");

  if(root.dataset.eventsReady){
    return;
  }

  root.dataset.eventsReady = "true";

  root.addEventListener("click",(e)=>{
    if(e.target.closest(".mixMenuBtn")){
      showMixMenu(e.target.closest(".mixMenuBtn").dataset.id, renderLists);
      return;
    }
    
    if(!e.target.classList.contains("savedMix")) return;
    const mix=getRemixes().find(
      m=>m.id===e.target.dataset.id
    );
    if(!mix) return;

    // 他の一覧と同じ共通の入口から player 画面を開く
    openPlayerFromList(
      { ...mix, title: mix.title || mix.name },
      { loading: true }
    );
  });
  // 作成
  if (createBtn){
    createBtn.onclick = () => {
      if (!isPremium() && getRemixCount() >= getRemixLimit()) {

        showSaveLimitModal({
          title: "ミックス作成の上限です。",
          current: getRemixCount(),
          max: getRemixLimit(),
          description:
            "不要なミックスを削除するか、プレミアムへアップグレードすると無制限に作成できます。",
          reason: "mixLimit",

          
          manageLabel: "ミックス一覧を見る",
          manageCallback: () => {
            openMixSetting();
          }
        });
        return;
      }
      showLoading();

      setTimeout(() => {
        location.href = "pages/remix.html";
      }, 250);
    };
  }
  //ご利用について
  const termsBtn = root.querySelector("#termsBtn");

  if(termsBtn){
    termsBtn.onclick = async () => {
      showLoading();
      await openTerms();
    };
  }
}

//保存情報更新
function renderLists(){
  if(!settingsRoot) return;

  cleanHistory();

  previewConfigs.forEach(config=>{
    createPreview(settingsRoot, config, renderLists);
  });

  renderFavoriteInfo(settingsRoot, renderLists);
  renderSavedInfo(settingsRoot, renderLists);
  window.lucide?.createIcons?.();
}

const previewConfigs = [{

  containerId:"historyList",
  buttonId:"showAllHistory",
  selector:".history-item",
  getList:getHistory,
  emptyText:"履歴はありません",

  renderItem:createSimpleItem("history-item"),

  afterClick: attachSwipeDelete
},
{
  containerId:"savedMixList",
  buttonId:"showAllMix",
  getList:getRemixes,
  emptyText:"ミックスはまだ作成されていません",

  renderItem:mix=>`
    <div class="savedMixItem">
      <span class="savedMix" data-id="${mix.id}">
        ${escapeHtml(getTitle(mix))}
      </span>
      <button class="mixMenuBtn" data-id="${mix.id}">
        <i data-lucide="ellipsis-vertical"></i>
      </button>
    </div>
  `
}];

//その他
function initOverlay(root) {
  const settingsBtn = document.getElementById("settingsBtn");
  const overlay = root.querySelector("#settingsOverlay");
  const closeBtn = root.querySelector("#closeSettings");

  if (!settingsBtn || !overlay || !closeBtn) return;

  settingsBtn.onclick = () => {
    overlay.classList.add("active");
    settingsBtn.classList.add("hidden");
  };
  closeBtn.onclick = () => {
    overlay.classList.remove("active");
    settingsBtn.classList.remove("hidden");
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      settingsBtn.classList.remove("hidden");
    }
  };
}

function initAccordion(root) {

  const items =
    root.querySelectorAll(".setting-item");

  items.forEach(item=>{
    const btn = item.querySelector(".setting-btn");
    const detail = item.querySelector(".setting-detail");

    if(!btn) return;

    //詳細がない項目はアコーディオンしない
    if(!detail) return;

    btn.onclick = ()=>{
      items.forEach(i=>{
        if(i !== item){
          i.classList.remove("active");

          i.querySelector(".setting-btn")
          ?.setAttribute("aria-expanded", "false");
        }
      });

      const open = item.classList.toggle("active");
      btn.setAttribute("aria-expanded", open);
    };
  });
}

function initThemeButtons(root){
  [
    ["darkMode", "dark", true],
    ["lightMode", "light", false]
  ].forEach(([id, theme, isDark])=>{

    const btn=root.querySelector(`#${id}`);
    if(!btn) return;

    btn.onclick=()=>{
      document.body.classList.toggle("dark",isDark);
      localStorage.setItem("theme",theme);
    };
  });
}


export function openMixSetting() {
  if (!settingsRoot) return;

  const overlay = settingsRoot.querySelector("#settingsOverlay");
  const settingsBtn = document.getElementById("settingsBtn");

  overlay?.classList.add("active");
  settingsBtn?.classList.add("hidden");

  const item = [...settingsRoot.querySelectorAll(".setting-item")]
    .find(item =>
      item.querySelector(".setting-btn")?.textContent.includes("ミックス")
    );

  if (item) {
    item.classList.add("active");
    item.querySelector(".setting-btn")
      ?.setAttribute("aria-expanded", "true");
  }

  settingsRoot.querySelector("#showAllMix")?.click();
}

function renderVersion(root) {
  const el = root.querySelector("#versionText");
  if (el) {
    el.textContent = "1.0.0";
  }
}