//新規作成
import { getRemix, updateRemix } from "../storage/remix.js";
import { initTheme } from "../ui/theme.js";
import { renderSavedSounds, getSelectedSounds } from "../remixSelector.js";
import { initSwipeBack } from "../ui/swipeBack.js";

initTheme();

const remixId = localStorage.getItem("editRemixId");
const remix = getRemix(remixId);

if(!remix){
  location.href="pages/remix.html";
  throw new Error("mix not found");
}

const input = document.getElementById("editName");
input.value = remix.title || remix.name;

//保存済音声一覧
renderSavedSounds("soundList", remix.sounds);

//保存
document.getElementById("saveEdit").addEventListener("click", () => {
 
  const name = input.value.trim();
  //名前未入力チェック
  if(name === ""){
    alert("ミックス名を入力してください");
    return;
  }

  const checkedIds = getSelectedSounds("soundList");
  //音未選択チェック
  if(checkedIds.length === 0){
    alert("音を１つ以上選択してください");
    return;
  }
  try{
    updateRemix(remixId, {
      title: input.value.trim(),
      name: input.value.trim(),
      sounds: checkedIds
    });

    location.href = "../remixComplete.html?mode=edit";

  }catch(err){
    if(err.message === "already_exists"){
      alert("同じ名前のミックスがすでに存在します");
      return;
    }
    throw err;
  }
});

//戻る
document
  .getElementById("backRemixEdit")
  ?.addEventListener("click", () => history.back());

//スワイプで戻る
initSwipeBack(() => {
  history.back();
});


const editNameInput = document.getElementById("editName");

editNameInput?.addEventListener("focus", () => {
    console.log("[RemixEdit] input focus");
});

editNameInput?.addEventListener("click", () => {
    console.log("[RemixEdit] input click");
});

editNameInput?.addEventListener("blur", () => {
    console.log("[RemixEdit] input blur");
});