import { startOffTimer, clearOffTimer } from "../timer.js";
import { showToast } from "../ui/toast.js";
import { vibrate } from "../ui/vibrate.js";

let timerInterval = null;

/* ========================================
   タイマー設定
======================================== */


export function initTimer(root) {
  const hour = root.querySelector("#hourSelect");
  const min = root.querySelector("#minuteSelect");
  const start = root.querySelector("#startTimerBtn");
  const cancel = root.querySelector("#cancelTimerBtn");
  const status = root.querySelector("#timerStatus");

  if (!hour || !min || !start || !cancel || !status) {
    return;
  }

  /* ========================================
     ボタン選択状態
  ======================================== */

  const setButtonState = (state) => {
    start.classList.toggle("selected", state === "start");
    cancel.classList.toggle("selected", state === "stop");

    start.setAttribute("aria-pressed", String(state === "start"));
    cancel.setAttribute("aria-pressed", String(state === "stop"));
  };

  /* ========================================
     時間選択肢
  ======================================== */

  if (!hour.dataset.ready) {
    for (let i = 0; i < 24; i++) {
      hour.innerHTML += `
        <option value="${i}">${i}</option>
      `;
    }

    for (let i = 0; i < 60; i++) {
      min.innerHTML += `
        <option value="${i}">${i}</option>
      `;
    }

    hour.dataset.ready = "true";
  }

  /* ========================================
     表示更新
  ======================================== */

  const update = () => {
    if (localStorage.getItem("timerFinished")) {
      status.textContent = "タイマー終了";
      localStorage.removeItem("timerFinished");

      setButtonState("");

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      setTimeout(() => {
        status.textContent = "タイマー未設定";
      }, 3000);

      return;
    }

    const end = Number(localStorage.getItem("offTimer"));

    if (!end) {
      status.textContent = "タイマー未設定";
      setButtonState("");
      return;
    }

    const diff = end - Date.now();

    if (diff <= 0) {
      status.textContent = "タイマー終了";
      setButtonState("");

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      setTimeout(() => {
        status.textContent = "タイマー未設定";
      }, 3000);

      return;
    }

    setButtonState("start");

    const totalSeconds = Math.ceil(diff / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    status.textContent =
      `残り ${m}:${String(s).padStart(2, "0")}`;
  };

  /* ========================================
     既存タイマー確認
  ======================================== */

  update();

  if (Number(localStorage.getItem("offTimer")) > Date.now()) {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(update, 1000);
  }

  /* ========================================
     開始
  ======================================== */

  start.onclick = () => {
    const total =
      Number(hour.value) * 60 +
      Number(min.value);

    if (!total) {
      showToast("時間を設定してください");
      vibrate();
      return;
    }

    const end = Date.now() + total * 60000;

    localStorage.setItem("offTimer", String(end));

    startOffTimer();

    setButtonState("start");

    update();

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(update, 1000);

    console.log("[TimerSetting] 開始:", end);
  };

  /* ========================================
     停止
  ======================================== */

  cancel.onclick = () => {
    clearOffTimer();

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    setButtonState("stop");

    status.textContent = "タイマー停止";

    setTimeout(() => {
      status.textContent = "タイマー未設定";

      // 停止表示を解除
      setButtonState("");
    }, 3000);
  };
}

/* ========================================
   Player画面からタイマー設定を開く
======================================== */

export function openTimerSetting() {

  const overlay =
    document.getElementById(
      "settingsOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.add("active");
  const item =
    [
      ...document.querySelectorAll(
        ".setting-item"
      )
    ].find(
      i =>
        i.querySelector(
          ".setting-btn"
        )
        ?.textContent
        .includes(
          "オフタイマー"
        )
    );
  item?.classList.add(
    "active"
  );
}