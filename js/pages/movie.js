import { startOffTimer } from "../timer.js";
import { isPremium } from "../services/premiumService.js";
import { getAccess } from "../services/soundAccess.js";
import { updatePlayButton } from "../ui/ui.js";

console.log("[Movie] movie.js loaded");

const refreshIcons = () => window.lucide?.createIcons?.();

document.addEventListener("DOMContentLoaded", () => {
  refreshIcons();
});

const els = {
  stage: document.querySelector(".movie-stage"),
  video: document.getElementById("video"),

  payModal: document.getElementById("payModal"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  closePay: document.getElementById("closePay"),

  playBtn: document.getElementById("playBtn"),
  backBtn: document.getElementById("backMovie")
};

const audio = new Audio();

let isPlaying = false;
let hideControlsTimer = null;

// フェード中かどうか
let isFadingOut = false;
// フェード用タイマー
let fadeTimerId = null;
// 再生開始時の音量を保存
let originalVolume = 0.5;

let item = null;
try {
  item = JSON.parse(localStorage.getItem("playItem") || "null");
} catch (e) {
  item = null;
}

// 再生できない状態（今日の音が未開放・プラン変更など）なら player 経由で戻す
if (!item || getAccess(item) !== "ok") {
  location.replace("../player.html");
  throw new Error("[Movie] access denied");
}

// ========================================
// 完全停止
// ========================================
function stopAll() {
  if (fadeTimerId !== null) {
    clearInterval(fadeTimerId);
    fadeTimerId = null;
  }

  isFadingOut = false;
  els.video.pause();
  audio.pause();
  // 次回再生のため音量を元に戻す
  audio.volume = originalVolume;

  isPlaying = false;
  updatePlayButton(els.playBtn, false);
  els.stage.classList.remove("playing");
}

// ========================================
// 課金者用フェードアウト
// ========================================
function fadeOutAndStop() {
  if (isFadingOut) return;

  if (!isPlaying) {
    stopAll();
    return;
  }

  isFadingOut = true;

  const startVolume = audio.volume;
  const duration = 3000; // 3秒かけてフェードアウト
  const interval = 50;

  let elapsed = 0;
  fadeTimerId = setInterval(() => {
    elapsed += interval;
    const progress = Math.min(elapsed / duration, 1);
    audio.volume = startVolume * (1 - progress);

    if (progress >= 1) {
      clearInterval(fadeTimerId);
      fadeTimerId = null;

      audio.volume = 0;
      els.video.pause();
      audio.pause();
      audio.volume = originalVolume;

      isFadingOut = false;
      isPlaying = false;

      updatePlayButton(els.playBtn, false);
      els.stage.classList.remove("playing");
    }
  }, interval);
}

// ========================================
// タイマー終了時
// ========================================
function handleTimerEnd() {
  if (isPremium()) {
    fadeOutAndStop();
  } else {
    stopAll();
  }
}

// ========================================
// アセットURL
// ========================================
function assetUrl(relativePath) {
  return new URL(
    `../assets/${relativePath}`,
    window.location.href
  ).href;
}

// ========================================
// 動画・音声の準備
// ========================================
if (isPremium() && item.video) {

  els.payModal.classList.add("hidden");

  const videoUrl = assetUrl(item.video);

  els.video.addEventListener("error", () => {
    console.error(
      "動画読み込みエラー:",
      els.video.error
        ? { code: els.video.error.code, message: els.video.error.message }
        : "unknown",
      videoUrl
    );
  });

  els.video.src = videoUrl;
  els.video.loop = true;
  els.video.muted = true;
  els.video.volume = 0;

  els.video.setAttribute("playsinline", "");
  els.video.setAttribute("webkit-playsinline", "");

  els.video.controls = false;

  //音声
  if (item.audio) {
    audio.src = assetUrl(item.audio);
    audio.loop = true;

    originalVolume = Number(item.volume) > 0
      ? Math.min(Number(item.volume), 1)
      : 0.5;

    audio.volume = originalVolume;
  }

} else {

  const msg = els.payModal.querySelector("p");

  if (isPremium()) {
    // プレミアム会員だが、この音声には動画がない
    if (msg) msg.textContent = "この音声の動画は準備中です";
    els.upgradeBtn.classList.add("hidden");
  } else if (msg) {
    msg.textContent = "この動画はプレミアム限定です";
  }

  els.payModal.classList.remove("hidden");

  stopAll();

  els.video.pause();
  els.video.removeAttribute("src");
  els.video.load();
}

// ========================================
// 再生ボタン
// ========================================
els.playBtn.addEventListener("click", async (e) => {
  e.stopPropagation();

  // 再生
  if (!isPlaying) {
    // フェード中ならキャンセル
    if (isFadingOut) {
      if (fadeTimerId !== null) {
        clearInterval(fadeTimerId);
        fadeTimerId = null;
      }
      isFadingOut = false;
      audio.volume = originalVolume;
    }

    // タイマー終了時の処理を登録
    startOffTimer(handleTimerEnd);

    try {
      await els.video.play();

      if (audio.src) {
        try {
          await audio.play();
        } catch (audioError) {
          console.error("音声再生エラー:", audioError);
        }
      }
      // 再生開始時に音量を復元
      audio.volume = originalVolume;

      updatePlayButton(els.playBtn, true);
      isPlaying = true;
      els.stage.classList.add("playing");

    } catch (err) {
      console.error("再生エラー:", err.name, err.message);
    }
    return;
  }

  // 停止
  stopAll();
});

// ========================================
// 再生中の画面タップ
// ========================================
els.stage.addEventListener("click", (e) => {
  if (!isPlaying) return;

  if (
    e.target.closest(".movie-play-btn") ||
    e.target.closest(".movie-back-btn") ||
    e.target.closest(".movie-expand-btn")
  ) {
    return;
  }

  els.stage.classList.add("show-controls");
  clearTimeout(hideControlsTimer);

  hideControlsTimer = setTimeout(() => {
    els.stage.classList.remove("show-controls");
  }, 2500);
});

// ========================================
// 動画と音声の同期
// ========================================
els.video.addEventListener("pause", () => {
  // フェード中は音声を止めない
  if (isFadingOut) return;
  if (isPlaying) audio.pause();
});

els.video.addEventListener("play", () => {
  // フェード中は音量操作を邪魔しない
  if (isFadingOut) return;
  if (isPlaying) audio.play();
});

// 動画自体が終了した場合
els.video.addEventListener("ended", () => {
  if (!isFadingOut) stopAll();
});

// ========================================
// 購入画面へ（ここでプレミアム状態を書き換えてはいけない）
// ========================================
els.upgradeBtn.addEventListener("click", () => {
  sessionStorage.setItem("openPremiumReason", "movie");
  location.href = "../player.html";
});

els.closePay.addEventListener("click", () => {
  location.href = "../player.html";
});

// ========================================
// 戻る
// ========================================
els.backBtn.addEventListener("click", () => {
  stopAll();
  window.location.href = "../player.html";
});