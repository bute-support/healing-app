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

  if ( !hour || !min || !start || !status ) {
    return;
  }

  /* ========================================
     時間選択肢
  ======================================== */

  if (!hour.dataset.ready) {
    for (let i = 0; i < 24; i++) {
      hour.innerHTML += `
        <option value="${i}">
          ${i}
        </option>
      `;
    }

    for (let i = 0; i < 60; i++) {
      min.innerHTML += `
        <option value="${i}">
          ${i}
        </option>
      `;
    }
    hour.dataset.ready = "true";
  }

  /* ========================================
     表示更新
  ======================================== */

  const update = () => {
    /* タイマー終了通知 */
    if (
      localStorage.getItem(
        "timerFinished"
      )
    ) {
      status.textContent = "タイマー終了";
      localStorage.removeItem("timerFinished");

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      setTimeout(() => {
        status.textContent = "タイマー未設定";
      }, 3000);
      return;
    }

    const end =
      Number(
        localStorage.getItem(
          "offTimer"
        )
      );

    /* タイマーなし */
    if (!end) {
      status.textContent = "タイマー未設定";
      return;
    }

    const diff = end - Date.now();

    /* 終了 */
    if (diff <= 0) {
      status.textContent = "タイマー終了";

      if (timerInterval) {
        clearInterval(
          timerInterval
        );
        timerInterval = null;
      }

      setTimeout(() => {
        status.textContent = "タイマー未設定";
      }, 3000);
      return;
    }

    const totalSeconds =
      Math.ceil(
        diff / 1000
      );

    const m =
      Math.floor(
        totalSeconds / 60
      );

    const s = totalSeconds % 60;
    status.textContent =
      `残り ${m}:${String(s).padStart(2, "0")}`;
  };

  /* ========================================
     既存タイマー確認
  ======================================== */

  update();

  /* すでにタイマーが存在する場合、設定画面でもカウントダウンする */
  if (
    localStorage.getItem(
      "offTimer"
    )
  ) {
    if (timerInterval) {
      clearInterval(
        timerInterval
      );
    }

    timerInterval =
      setInterval(
        update,
        1000
      );
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

    const end =
      Date.now() +
      total * 60000;

    /* 終了時刻を保存 */
    localStorage.setItem(
      "offTimer",
      String(end)
    );

    /*
     * タイマーを開始
     *
     * callbackはplayer側が登録しているため、
     * ここでは渡さない
     */
    startOffTimer();

    /* 表示更新 */
    update();

    /* 既存監視を解除 */
    if (timerInterval) {
      clearInterval(
        timerInterval
      );
    }

    /* カウントダウン開始 */
    timerInterval =
      setInterval(
        update,
        1000
      );

    console.log(
      "[TimerSetting] 開始:",
      end
    );
  };

  /* ========================================
     停止
  ======================================== */

  cancel.onclick = () => {

    /* ここだけがタイマーを完全削除する */
    clearOffTimer();

    if (timerInterval) {
      clearInterval(
        timerInterval
      );
      timerInterval = null;
    }

    status.textContent = "タイマー停止";

    setTimeout(() => {
      status.textContent = "タイマー未設定";
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