import { purchaseMonthly, purchaseLifetime } from "../services/purchaseService.js";

document.addEventListener("DOMContentLoaded", () => {
  const monthlyBtn = document.getElementById("monthlyBtn");
  const lifetimeBtn = document.getElementById("lifetimeBtn");

  if (monthlyBtn) {
    monthlyBtn.addEventListener("click", async () => {
      monthlyBtn.disabled = true;
      monthlyBtn.textContent = "購入中...";

      const result = await purchaseMonthly();

      if (result) {
        monthlyBtn.textContent = "購入完了！";
        setTimeout(() => location.reload(), 800);
      } else {
        monthlyBtn.disabled = false;
        monthlyBtn.textContent = "月額で始める";
        alert("購入できませんでした");
      }
    });
  }

  if (lifetimeBtn) {
    lifetimeBtn.addEventListener("click", async () => {
      lifetimeBtn.disabled = true;
      lifetimeBtn.textContent = "購入中...";

      const result = await purchaseLifetime();

      if (result) {
        lifetimeBtn.textContent = "購入完了！";
        setTimeout(() => location.reload(), 800);
      } else {
        lifetimeBtn.disabled = false;
        lifetimeBtn.textContent = "買い切りで購入";
        alert("購入できませんでした");
      }
    });
  }
});