import { getHistory, cleanHistory, updateHistoryExpire } from "../storage/history.js";
import { showToast } from "../ui/toast.js";
import { vibrate } from "../ui/vibrate.js";

//スワイプ削除
export function attachSwipeDelete(container, renderLists) {

  if (!container) return;

  container.querySelectorAll(".history-item").forEach(el => {
    let startX = 0;

    el.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    el.addEventListener("touchend", e => {
      const endX = e.changedTouches[0].clientX;

      if (startX - endX > 80) {
        const id = el.dataset.id;

        const list = getHistory().filter(i => i.id !== id);
        localStorage.setItem("history", JSON.stringify(list));
        vibrate();
        showToast("履歴を削除しました");
        renderLists?.();   // ← 追加：一覧を再描画
      }
    });
  });
}

//履歴設定
export function initHistorySettings(root, renderLists) {
  const buttons = root.querySelectorAll("[data-mode]");
  const clearBtn = root.querySelector("#clearHistory");
  const modeText = root.querySelector("#historyModeText");

  let currentMode = localStorage.getItem("historyMode") || "7";

  updateModeUI();

  buttons.forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;

      let message;

      if(mode === "off") {
        message = 
          "自動削除を停止しますか？\n\n今後、履歴は自動削除されません。";
      } else {
        message =
          `${mode}日後に自動削除へ変更しますか？\n\n保存済み履歴にも適用されます。`;
      }

      if(!confirm(message)) {
        return;
      }
      currentMode = mode;

      localStorage.setItem("historyMode", mode);

      updateHistoryExpire(mode);
      cleanHistory();
      updateModeUI();
      renderLists();
    };
  });

  function updateModeUI() {
    buttons.forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.mode === currentMode
      );
    });

    if(!modeText) return;

    if(currentMode === "7") {
      modeText.textContent =
      "7日後に自動削除中";
    }
   
    if(currentMode === "30") {
      modeText.textContent =
      "30日後に自動削除中";
    }
  
    if (currentMode === "off") {
      modeText.textContent =
      "自動削除なし";
    }
  }

  clearBtn?.addEventListener("click", ()=> {
    if(!confirm(
      "履歴を全て削除しますか？"
    )){
      return;
    }
    localStorage.removeItem("history");
    showToast("履歴を削除しました");
    renderLists();
  });
}