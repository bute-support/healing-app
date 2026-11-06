import { goPremium } from "../services/premiumLimit.js";

export function showSaveLimitModal({
  title,
  current,
  max,
  description,
  reason,
  manageLabel,
  manageCallback
}) {
  const modal = document.getElementById("limitModal");

  const limitTitle = document.getElementById("limitTitle");
  if(limitTitle){
    limitTitle.textContent = title;
  }

  const limitCount = document.getElementById("limitCount");
    if(limitCount){
      limitCount.textContent = `${current} / ${max}`;
    }

    const limitDescription = document.getElementById("limitDescription");
      if(limitDescription){
        limitDescription.textContent = description;
      }

  const manageBtn = document.getElementById("limitManageBtn");
  if(manageBtn) {
    if (manageCallback) {
      manageBtn.hidden = false;

      if (manageLabel) {
        manageBtn.textContent = manageLabel;
      }
      manageBtn.onclick = () => {
        modal.classList.add("hidden");
        manageCallback();
      };
    } else {
      manageBtn.hidden = true;
    }
  }

  document.getElementById("limitPremiumBtn").onclick=()=>{
    modal.classList.add("hidden");
    goPremium(reason);
  };

  document.getElementById("limitCancelBtn").onclick=()=>{
    modal.classList.add("hidden");
  };
  modal.classList.remove("hidden");

  modal.onclick = (e)=>{
    if(e.target === modal){
      modal.classList.add("hidden");
    }
  };
}