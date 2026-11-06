import { getRemixes, getRemixCount, saveRemix } from "./storage/remix.js";
import { initTheme } from "./ui/theme.js";
import { load, remove } from "./storage/storageService.js";
import { isPremium, getRemixLimit } from "./services/premiumService.js";
import { goPremium } from "./services/premiumLimit.js";
import { initSwipeBack } from "./ui/swipeBack.js";

initTheme();

document.getElementById("createMixBtn").onclick=()=>{

const name = document.getElementById("mixName").value.trim();
  if(!name){
    alert("名前を入力してください");
    return;
  }
  
  //名前重複チェックのみ
  const remixes = getRemixes();
  const exists = remixes.some(
    mix => (mix.title || mix.name) === name
  );
  
  if(exists) {
    alert("このミックス名はすでに使用されています。\n別の名前を入力してください。");
    return;
  }

  if (!isPremium() && getRemixCount() >= getRemixLimit()) {
    goPremium("remixLimit");
    return;
  }

  const sounds = load("mixDraft");
    //保存
    try{
      saveRemix({
        name,
        sounds
      });

      remove("mixDraft");
      location.href = "../remixComplete.html";

    }catch(error){
      console.error(error);
      alert("ミックスを作成できませんでした。");
    }
};

//戻るボタン
document
  .getElementById("backRemixName")
  ?.addEventListener("click", () => history.back());

//スワイプで戻る
initSwipeBack(() => {
  history.back();
});