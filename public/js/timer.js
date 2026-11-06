// timer.js

let timerId = null;
let timeoutCallback = null;


/* ========================================
   タイマー開始・再登録
======================================== */

export function startOffTimer(callback) {

  /*
   * callbackが渡された場合は、
   * 現在のページの停止処理として登録
   */
  if (callback) {
    timeoutCallback = callback;
  }


  /*
   * 既存のタイマーを解除
   *
   * ※offTimerそのものは削除しない
   */
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }


  const end =
    Number(
      localStorage.getItem("offTimer")
    );


  /*
   * タイマー未設定
   */
  if (!end) {

    console.log(
      "[Timer] 未設定"
    );

    return;
  }


  const remain =
    end - Date.now();


  console.log(
    "[Timer] offTimer =",
    end
  );

  console.log(
    "[Timer] 残り =",
    Math.ceil(remain / 1000),
    "秒"
  );


  /*
   * すでに終了している
   */
  if (remain <= 0) {

    finishTimer();

    return;
  }


  /*
   * 残り時間でタイマーを再登録
   */
  timerId =
    setTimeout(
      finishTimer,
      remain
    );
}


/* ========================================
   タイマー停止
   ※ユーザーが「停止」を押したときのみ
======================================== */

export function clearOffTimer() {

  console.log(
    "[Timer] clearOffTimer()"
  );


  if (timerId) {

    clearTimeout(
      timerId
    );

    timerId = null;
  }


  timeoutCallback = null;


  /*
   * タイマー情報を完全削除
   */
  localStorage.removeItem(
    "offTimer"
  );

  localStorage.removeItem(
    "timerFinished"
  );
}


/* ========================================
   タイマー終了
======================================== */

function finishTimer() {

  console.log(
    "[Timer] finishTimer()"
  );


  timerId = null;


  /*
   * 終了時刻を削除
   */
  localStorage.removeItem(
    "offTimer"
  );


  /*
   * 設定画面へ終了を通知
   */
  localStorage.setItem(
    "timerFinished",
    "true"
  );


  /*
   * ======================================
   * Playerへタイマー終了を通知
   * ======================================
   *
   * これが今回追加する重要部分です。
   *
   * Player側でこのイベントを受け取って
   * stopAudio() を実行します。
   */
  window.dispatchEvent(
    new Event("offTimerFinished")
  );


  /*
   * 既存callbackが登録されている場合も
   * これまで通り実行する
   *
   * ※互換性維持のため残しています
   */
  if (timeoutCallback) {

    try {

      timeoutCallback();

    } catch (e) {

      console.error(
        "[Timer] callback error:",
        e
      );

    }
  }


  timeoutCallback = null;
}