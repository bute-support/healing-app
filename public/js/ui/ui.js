/* ==================================================
   再生ボタンUI
================================================== */

export function updatePlayButton(
  button,
  isPlaying
) {
  if (!button) {
    return;
  }

  /* ==================================================
     既存のアイコンを取得
  ================================================== */

  let icon =
    button.querySelector(
      "#playIcon"
    );

  /* ==================================================
     アイコンが無い場合だけ作る
  ================================================== */

  if (!icon) {
    icon = document.createElement("i");
    icon.id = "playIcon";
    button.appendChild(icon);
  }

  /* ==================================================
     再生 / 一時停止
  ================================================== */

  icon.setAttribute(
    "data-lucide",
    isPlaying
      ? "pause"
      : "play"
  );

  /* ==================================================
     アクセシビリティ
  ================================================== */

  button.setAttribute(
    "aria-label",
    isPlaying
      ? "一時停止"
      : "再生"
  );

  button.setAttribute(
    "aria-pressed",
    String(isPlaying)
  );

  /* ==================================================
     Lucide再描画
  ================================================== */

  if (
    typeof lucide !== "undefined" &&
    typeof lucide.createIcons === "function"
  ) {
    lucide.createIcons();
  }
}