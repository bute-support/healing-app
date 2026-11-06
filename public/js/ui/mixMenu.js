import { deleteRemix, moveRemixToTop } from "../storage/remix.js";
import { showToast } from "./toast.js";
import { vibrate } from "./vibrate.js";
import { showLoading } from "./loading.js";

export function showMixMenu(id, renderLists){

  const overlay=document.getElementById("mixMenuOverlay");

  const menuEdit=document.getElementById("menuEdit");
  const menuDelete=document.getElementById("menuDelete");
  const menuQueue=document.getElementById("menuQueue");

  overlay.classList.remove("hidden");

  overlay.onclick=(e)=>{
    if(e.target===overlay){
      closeMixMenu();
    }
  };

  menuEdit.onclick=()=>{
    closeMixMenu();

    localStorage.setItem("editRemixId",id);

    showLoading();

    setTimeout(()=>{
      location.href="components/remixEdit.html";
    },250);
  };

  menuDelete.onclick=()=>{
    closeMixMenu();
    deleteRemix(id);
    showToast("削除しました");
    vibrate();
    renderLists();
  };

  menuQueue.onclick=()=>{
    closeMixMenu();
    moveRemixToTop(id);
    showToast("先頭へ移動しました");
    vibrate();
    renderLists();
  };
}

export function closeMixMenu(){
  document
    .getElementById("mixMenuOverlay")
    ?.classList.add("hidden");
}