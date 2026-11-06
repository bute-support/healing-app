import { sounds, todaySounds } from "../data.js";
import { initTheme } from "../ui/theme.js";
import { loadSettings } from "./settings.js";
import { isPremium } from "../services/premiumService.js";
import { addHistory } from "../storage/historyService.js";
import { FREE_LIMIT, goPremium } from "../services/premiumLimit.js";
import { toggleFavoriteAndRefresh, updateFavoriteIcon } from "../storage/favorites.js";
import { getSavedSounds, saveSound } from "../storage/savedSounds.js";
import { showSaveLimitModal } from "../ui/limitModal.js";
import { showToast } from "../ui/toast.js";
import { vibrate } from "../ui/vibrate.js";
import { startOffTimer } from "../timer.js";
import { registerSwipeBack } from "../ui/swipeBack.js";
import { openSavedSetting } from "../settings/savedSetting.js";
import { loadLoopAudio } from "../services/audioLoopService.js";

console.log("[Player] player.js loaded");

/* ==================================================
   状態管理
================================================== */

let singleTrack = null;
let mixTracks = [];
let current = null;

let artworkPromise = null;
let artworkSentForCurrent = false;
let startingPlayback = false;

const els = {};

// 音量調整用のWeb Audio API
let audioContext = null;
// 消音状態
let isMuted = false;
let volumeBeforeMute = 0.15;

const allSounds = [
    ...sounds,
    ...todaySounds
];

/* ==================================================
   共通ユーティリティ
================================================== */

function toAssetUrl(relativePath) {
    if (!relativePath) return null;

    return new URL(
        `assets/${relativePath}`,
        window.location.href
    ).href;
}

function getTitle(item = current) {
    return (
        item?.title ||
        item?.label ||
        item?.name ||
        "名称なし"
    );
}

function isMix(item = current) {
    return Boolean(
        item?.type === "mix" ||
        Array.isArray(item?.sounds)
    );
}

function getSliderVolume() {
    if (!els.volume) return 0.15;

    const value = Number(els.volume.value);

    if (!Number.isFinite(value)) return 0.15;

    return Math.max(0, Math.min(1, value));
}

/* ==================================================
   ミックス内の音源を解決
   ID形式・オブジェクト形式の両方に対応
================================================== */

function resolveSound(sound) {
    if (!sound) return null;

    if (typeof sound === "object") {
        if (sound.audio) {
            return sound;
        }

        const found = allSounds.find(
            item =>
                String(item.id) === String(sound.id)
        );

        if (!found) return sound;

        return {
            ...found,
            ...sound,
            audio: sound.audio || found.audio,
            image: sound.image || found.image,
            title:
                sound.title ||
                sound.name ||
                found.title ||
                found.name
        };
    }

    return (
        allSounds.find(
            item =>
                String(item.id) === String(sound)
        ) || null
    );
}

function getMixMembers() {
    if (!isMix()) return [];

    const members = Array.isArray(current.sounds)
        ? current.sounds
        : [];

    return members
        .map(resolveSound)
        .filter(item => item?.audio);
}

/* ==================================================
   再生中のAudio要素を取得
================================================== */

function getAudioPlayers() {
    return isMix()
        ? mixTracks
        : (singleTrack ? [singleTrack] : []);
}

function isAudioPlaying() {
    return getAudioPlayers().some(track => track?.isPlaying);
}

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error(
                "この環境では音量調整に対応していません"
            );
        }

        audioContext = new AudioContextClass();
    }

    return audioContext;
}

function applyVolume() {
    const sliderVolume = getSliderVolume();
    const targetVolume = isMuted ? 0 : sliderVolume * sliderVolume;

    for (const track of getAudioPlayers()) {
        if (!track?.gainNode) continue;

        try {
            const context = getAudioContext();
            track.gainNode.gain.cancelScheduledValues(context.currentTime);
            track.gainNode.gain.setTargetAtTime(
                targetVolume,
                context.currentTime,
                0.04
            );
        } catch (error) {
            console.error("[Player] 音量調整エラー:", error);
        }
    }

    updateMuteIcon(isMuted || sliderVolume === 0);
}

function updateMuteIcon(muted) {
  const icon = document.getElementById("volumeIconLeft");
  if (!icon) return;

  // 消音時は消音マーク、それ以外は音波1本
  const iconName = muted ? "volume-x" : "volume-1";

  icon.setAttribute("data-lucide", iconName);

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

function toggleMute() {
    if (isMuted) {
        isMuted = false;

        if (els.volume) {
            els.volume.value = String(volumeBeforeMute || 0.15);
        }
    } else {
        const currentVolume = getSliderVolume();

        if (currentVolume > 0) {
            volumeBeforeMute = currentVolume;
        }

        isMuted = true;
    }

    applyVolume();

    if (els.volume) {
        els.volume.setAttribute(
            "aria-valuetext",
            isMuted ? "消音" : `音量 ${getSliderVolume()}`
        );
    }
}

/* ==================================================
   Now Playing（ロック画面用画像）
================================================== */

function getArtworkImage() {
    if (!current) return null;

    if (current.image) {
        return current.image;
    }

    const members = isMix()
        ? current.sounds
        : [];

    for (const sound of members) {
        const item = resolveSound(sound);

        if (item?.image) {
            return item.image;
        }
    }

    return null;
}

async function fetchArtworkDataUrl(relativePath) {
    try {
        const url = toAssetUrl(relativePath);

        if (!url) return null;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `artwork fetch failed: ${response.status}`
            );
        }

        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = reject;

            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(
            "[Player] artwork fetch error:",
            error
        );

        return null;
    }
}

function loadArtworkForCurrent() {
    artworkSentForCurrent = false;

    const path = getArtworkImage();

    if (!path) {
        artworkPromise = Promise.resolve(null);
        return;
    }

    artworkPromise = fetchArtworkDataUrl(path);
}

function getNativeNowPlaying() {
    return window.Capacitor?.Plugins?.NowPlaying ?? null;
}

async function updateNativeNowPlaying(playing) {
    const nowPlaying = getNativeNowPlaying();

    if (!nowPlaying || !current) {
        return;
    }

    let artwork = null;

    if (!artworkSentForCurrent) {
        try {
            artwork = await artworkPromise;
        } catch (error) {
            console.warn(
                "[Player] artwork unavailable:",
                error
            );
        }

        if (artwork) {
            artworkSentForCurrent = true;
        }
    }

    try {
        await nowPlaying.update({
            title: getTitle(),
            subtitle: current.subtitle || "",
            playing,
            artwork: artwork || undefined
        });

        console.log(
            "[Player] Native Now Playing updated:",
            getTitle(),
            "playing:",
            playing,
            "sentArtwork:",
            Boolean(artwork)
        );
    } catch (error) {
        console.error(
            "[Player] Native Now Playing update error:",
            error
        );
    }
}

/* ==================================================
   iOS Audio Session
================================================== */

try {
    if (navigator.audioSession) {
        navigator.audioSession.type = "playback";
    }
} catch (error) {
    console.warn(
        "[Player] audioSession:",
        error
    );
}

/* ==================================================
   オフタイマー終了時
================================================== */

document.addEventListener(
    "offTimerFinished",
    () => {
        console.log(
            "[Player] タイマー終了 → 音声停止"
        );

        stopAudio();
    }
);

/* ==================================================
   初期化
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        console.log(
            "[Player] DOMContentLoaded"
        );
        initTheme();

        try {
            initPlayer();
        } catch (error) {
            console.error(
                "[Player] initPlayer error:",
                error
            );
        }

        try {
            await loadSettings();

            console.log(
                "[Player] settings loaded"
            );
        } catch (error) {
            console.error(
                "[Player] settings load error:",
                error
            );
        }
    }
);

/* ==================================================
   画面復帰時のタイマー確認・Now Playing更新
================================================== */

document.addEventListener(
    "visibilitychange",
    () => {
        if (document.visibilityState !== "visible") {
            return;
        }

        const end = Number(
            localStorage.getItem("offTimer")
        );

        if (end && Date.now() >= end) {
            console.log(
                "[Player] timer expired while background"
            );

            stopAudio();

            localStorage.removeItem("offTimer");
            localStorage.setItem(
                "timerFinished",
                "true"
            );

            return;
        }

        if (end) {
            startOffTimer(stopAudio);

            console.log(
                "[Player] timer reconnected after visibility change"
            );
        }

        if (isAudioPlaying()) {
            updateNativeNowPlaying(true);

            console.log(
                "[Player] Now Playing refreshed on foreground"
            );
        }
    }
);

/* ==================================================
   Player初期化
================================================== */

function initPlayer() {
    console.log("[Player] init start");

    els.photo = document.getElementById("photo");
    els.mixPhoto = document.getElementById("mixPhoto");

    els.detailTag = document.getElementById("detailTag");
    els.detailCategory = document.getElementById("detailCategory");
    els.detailTitle = document.getElementById("detailTitle");
    els.subtitle = document.getElementById("subtitle");
    els.description = document.getElementById("description");

    els.playBtn = document.getElementById("playBtn");
    els.volume = document.getElementById("volume");
    els.muteBtn = document.getElementById("muteBtn");

    els.backPlayer = document.getElementById("backPlayer");
    els.settingsBtn = document.getElementById("settingsBtn");

    els.favBtn = document.getElementById("favBtn");
    els.saveMixBtn = document.getElementById("saveMixBtn");

    let stored = null;

    try {
        stored = JSON.parse(
            localStorage.getItem("playItem") || "null"
        );
    } catch (error) {
        console.error(
            "[Player] playItem parse error:",
            error
        );
    }

    if (!stored) {
        console.error("[Player] playItem not found");
        return;
    }

    current = isMix(stored)
        ? stored
        : (
            allSounds.find(
                sound =>
                    String(sound.id) === String(stored.id)
            ) || stored
        );

    console.log("[Player] current:", current);

    renderPlayer();
    updateActionButtons();

    loadArtworkForCurrent();

    setupNativeNowPlayingListeners();
    setupWebMediaSessionSuppression();

    if (localStorage.getItem("offTimer")) {
        startOffTimer(stopAudio);

        console.log(
            "[Player] existing timer connected"
        );
    }

    bindEvents();

    window.lucide?.createIcons?.();

    console.log("[Player] init complete");
}

/* ==================================================
   Player表示
================================================== */

function renderPlayer() {
    if (!current) return;

    if (els.detailTitle) {
        els.detailTitle.textContent = getTitle();
    }

    if (els.subtitle) {
        els.subtitle.textContent =
            current.subtitle || "";
    }

    if (els.description) {
      const text = current.description || "";

      els.description.replaceChildren();
      els.description.classList.remove("is-overflowing");

      const first = document.createElement("span");
      first.className = "detail-description-text";
      first.textContent = text;

      els.description.appendChild(first);

      requestAnimationFrame(() => {
        if (first.scrollWidth > els.description.clientWidth + 1) {
            const track = document.createElement("div");
            track.className = "detail-description-track";

            const second = first.cloneNode(true);

            track.append(first, second);
            els.description.replaceChildren(track);
            els.description.classList.add("is-overflowing");

            // 文章の長さに応じて流れる時間を調整
            const distance = track.scrollWidth / 2;
            const duration = Math.max(12, distance / 25);

            track.style.setProperty(
                "--marquee-duration",
                `${duration}s`
            );
          }
        });
    }

    if (els.detailTag) {
        if (isMix() || !current.soundType) {
            els.detailTag.classList.add("hidden");
            els.detailTag.textContent = "";
        } else {
            els.detailTag.classList.remove("hidden");
            els.detailTag.textContent =
                current.soundType;
        }
    }

    if (els.detailCategory) {
        els.detailCategory.textContent = "";
    }

    if (isMix()) {
        renderMixImage();
    } else {
        if (els.photo) {
            els.photo.src = toAssetUrl(current.image) || "";
            els.photo.classList.remove("hidden");
        }

        if (els.mixPhoto) {
            els.mixPhoto.classList.add("hidden");
        }
    }

    if (els.playBtn) {
        els.playBtn.textContent = "再生";
    }

    if (els.volume) {
        els.volume.value = "0.15";
    }
    isMuted = false;
    volumeBeforeMute = 0.15;
    updateMuteIcon(false);
}

/* ==================================================
   ミックス画像
================================================== */

function renderMixImage() {
    if (!els.mixPhoto || !current) return;

    const container = els.mixPhoto;

    // 通常音源の画像を隠し、ミックス画像を表示
    els.photo?.classList.add("hidden");
    container.classList.remove("hidden");

    // 前回のレイアウトクラスを解除
    container.classList.remove(
        "mix-1",
        "mix-2",
        "mix-3",
        "mix-4",
        "mix-many",
        "mix-5"
    );

    container.replaceChildren();

    // ID形式・オブジェクト形式のどちらにも対応
    const members = getMixMembers();

    // 画像がある音源だけを表示対象にする
    const imageItems = members.filter(item => item.image);

    if (imageItems.length === 0) {
        console.warn(
            "[Player] ミックス内に表示できる画像がありません",
            current.sounds
        );
        return;
    }

    // CSSに用意されているレイアウトクラスを適用
    const count = imageItems.length;

    if (count <= 4) {
        container.classList.add(`mix-${count}`);
    } else {
        container.classList.add("mix-many");
    }

    imageItems.forEach(item => {
        const img = document.createElement("img");

        img.src = toAssetUrl(item.image) || "";
        img.alt = item.title || item.name || "ミックス音源";
        img.className = "mix-image-item";

        img.onerror = () => {
            console.error(
                "[Player] ミックス画像の読み込み失敗:",
                img.src
            );
        };

        container.appendChild(img);
    });

    console.log(
        "[Player] ミックス画像レイアウト:",
        count,
        "枚",
        container.className
    );
}

/* ==================================================
   今日の音判定
================================================== */

function isTodaySound(item = current) {
    if (!item?.id) return false;

    return todaySounds.some(
        sound =>
            String(sound.id) === String(item.id)
    );
}

/* ==================================================
   お気に入り・保存ボタン表示
================================================== */

function updateActionButtons() {
    if (!current) return;

    const today = isTodaySound();
    const mix = isMix();

    const showActions = !today && !mix;

    if (els.favBtn) {
        els.favBtn.style.display =
            showActions ? "" : "none";
    }

    if (els.saveMixBtn) {
        els.saveMixBtn.style.display =
            showActions ? "" : "none";
    }

    if (showActions) {
        updateFavoriteButton();
    }
}

function updateFavoriteButton() {
    if (!current) return;

    updateFavoriteIcon("favBtn", current.id);
}

/* ==================================================
   Web Media Session
   メタデータはNative Now Playing側で管理
================================================== */

function setupWebMediaSessionSuppression() {
    if (!("mediaSession" in navigator)) return;

    try {
        navigator.mediaSession.setActionHandler(
            "play",
            async () => {
                await startAudio();
            }
        );

        navigator.mediaSession.setActionHandler(
            "pause",
            () => {
                pauseAudio();
            }
        );

        console.log(
            "[Player] Web MediaSession handlers registered"
        );
    } catch (error) {
        console.warn(
            "[Player] Web MediaSession setup error:",
            error
        );
    }
}

/* ==================================================
   Native Now Playingのリモコン操作
================================================== */

function setupNativeNowPlayingListeners() {
    if (window.__nowPlayingListenersRegistered) {
        return;
    }

    window.__nowPlayingListenersRegistered = true;

    window.addEventListener(
        "NowPlayingRemotePlay",
        async () => {
            console.log("[Player] Native Remote PLAY");

            try {
                await startAudio();
            } catch (error) {
                console.error(
                    "[Player] Native PLAY error:",
                    error
                );
            }
        }
    );

    window.addEventListener(
        "NowPlayingRemotePause",
        () => {
            console.log("[Player] Native Remote PAUSE");

            pauseAudio();
        }
    );

    window.addEventListener(
        "NowPlayingRemoteToggle",
        async () => {
            console.log("[Player] Native Remote TOGGLE");

            try {
                if (isAudioPlaying()) {
                    pauseAudio();
                } else {
                    await startAudio();
                }
            } catch (error) {
                console.error(
                    "[Player] Native TOGGLE error:",
                    error
                );
            }
        }
    );

    console.log(
        "[Player] Native Now Playing listeners registered"
    );
}

/* ==================================================
   イベント設定
================================================== */


function bindEvents() {
    els.muteBtn?.addEventListener("click", toggleMute);
    // 戻るボタン：再生を停止して前の画面へ戻る
    els.backPlayer?.addEventListener("click", () => {
      stopAudio();
      location.replace("index.html");
    });

    // スライドで戻る
    registerSwipeBack(
        "player",
        () => {
            stopAudio();
            location.replace("index.html");
        },
        () => true,
        10
    );

    els.photo?.addEventListener(
        "click",
        () => {
            if (isPremium()) {
                location.href = "components/movie.html";
            } else {
                goPremium("movie");
            }
        }
    );

    els.playBtn?.addEventListener(
        "click",
        async () => {
            if (!current) return;

            if (isMix()) {
                if (getMixMembers().length === 0) {
                    console.warn(
                        "[Player] mix has no playable audio"
                    );

                    showToast(
                        "再生できる音源がありません"
                    );

                    return;
                }
            } else if (!current.audio) {
                console.warn(
                    "[Player] audio not found"
                );

                showToast(
                    "音源が見つかりません"
                );

                return;
            }

            if (isAudioPlaying()) {
                stopAudio();
                return;
            }

            await startAudio();
        }
    );

    els.volume?.addEventListener("input", () => {
      const volume = getSliderVolume();

      if (volume > 0) {
        isMuted = false;
        volumeBeforeMute = volume;
      } else {
        isMuted = true;
      }

      applyVolume();
    });

    els.favBtn?.addEventListener(
        "click",
        () => {
            if (!current) return;

            if (
                isTodaySound() ||
                isMix()
            ) {
                return;
            }

            try {
                toggleFavoriteAndRefresh(
                    "favBtn",
                    current
                );

                window.dispatchEvent(
                    new Event("listsChanged")
                );

                vibrate();

                console.log(
                    "[Player] favorite changed"
                );
            } catch (error) {
                console.error(
                    "[Player] favorite error:",
                    error
                );
            }
        }
    );

    els.saveMixBtn?.addEventListener(
        "click",
        () => {
            if (!current) return;

            if (
                isTodaySound() ||
                isMix()
            ) {
                return;
            }

            saveCurrentSound();
        }
    );
}

/* ==================================================
   音源保存
================================================== */

function saveCurrentSound() {
    try {
        const saved = getSavedSounds();

        const alreadySaved = saved.some(
            item =>
                String(item.id) === String(current.id)
        );

        if (alreadySaved) {
            showToast("すでに保存されています");
            return;
        }

        if (
            !isPremium() &&
            saved.length >= FREE_LIMIT.savedSounds
        ) {
            
            showSaveLimitModal({
              title: "保存数の上限です。",
              current: saved.length,
              max: FREE_LIMIT.savedSounds,
              description:
                "保存できる音声数の上限に達しました。プレミアムでは無制限に保存できます。",
              reason: "saveLimit",
              manageLabel: "保存一覧を見る",
                manageCallback: () => {
                  openSavedSetting();
                }
            });

            return;
        }

        saveSound(current);

        vibrate();

        showToast("保存しました");

        window.dispatchEvent(
            new Event("listsChanged")
        );

        console.log(
            "[Player] sound saved:",
            current.id
        );
    } catch (error) {
        console.error(
            "[Player] save error:",
            error
        );
    }
}

/* ==================================================
   Audio要素作成
================================================== */

function disposeTrack(track, reset = true) {
    if (!track) return;

    if (track.source) {
        try {
            track.source.stop();
        } catch (_) {
            // すでに停止している場合は無視
        }
        try {
            track.source.disconnect();
        } catch (_) {}
        track.source = null;
    }

    track.isPlaying = false;
    if (reset) track.offset = 0;

    try {
        track.gainNode?.disconnect();
    } catch (_) {}
}

async function createBufferTrack(relativePath) {
    const url = toAssetUrl(relativePath);
    if (!url) throw new Error("音源URLがありません");

    const context = getAudioContext();
    const { buffer, loopStart, loopEnd } =
        await loadLoopAudio(context, url);

    const gainNode = context.createGain();
    gainNode.gain.value = isMuted
        ? 0
        : getSliderVolume() * getSliderVolume();
    gainNode.connect(context.destination);

    return {
        url,
        buffer,
        loopStart,
        loopEnd,
        gainNode,
        source: null,
        startedAt: 0,
        offset: 0,
        isPlaying: false
    };
}

function startTrack(track, when) {
    const context = getAudioContext();

    if (track.source) {
        disposeTrack(track, false);
    }

    const source = context.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    source.loopStart = track.loopStart;
    source.loopEnd = track.loopEnd;
    source.connect(track.gainNode);

    const duration = track.buffer.duration;
    const offset = duration > 0
        ? Math.max(0, track.offset) % duration
        : 0;

    track.source = source;
    track.startedAt = when;
    track.offset = offset;
    track.isPlaying = true;

    source.onended = () => {
        if (track.source === source) {
            track.source = null;
            track.isPlaying = false;
        }
    };

    source.start(when, offset);
}

function pauseTrack(track) {
    if (!track?.isPlaying) return;

    const context = getAudioContext();
    const elapsed = Math.max(0, context.currentTime - track.startedAt);
    const duration = track.buffer.duration;

    if (duration > 0) {
        track.offset = (track.offset + elapsed) % duration;
    }

    disposeTrack(track, false);
}

function stopTrack(track) {
    disposeTrack(track, true);
}

async function prepareSingleTrack() {
    if (!current?.audio) {
        throw new Error("通常音源がありません");
    }

    const url = toAssetUrl(current.audio);
    if (!url) throw new Error("音源URLを作成できません");

    for (const track of mixTracks) disposeTrack(track);
    mixTracks = [];

    if (singleTrack && singleTrack.url !== url) {
        disposeTrack(singleTrack);
        singleTrack = null;
    }

    if (!singleTrack) {
        singleTrack = await createBufferTrack(current.audio);
    }

    return [singleTrack];
}

async function prepareMixTracks() {
    const members = getMixMembers();

    if (members.length === 0) {
        throw new Error("ミックス内に再生できる音源がありません");
    }

    const urls = members.map(item => toAssetUrl(item.audio));

    if (urls.some(url => !url)) {
        throw new Error("ミックス内に音源URLがない音源があります");
    }

    disposeTrack(singleTrack);
    singleTrack = null;

    const existingUrls = mixTracks.map(track => track.url);
    const unchanged =
        urls.length === existingUrls.length &&
        urls.every((url, index) => url === existingUrls[index]);

    if (!unchanged) {
        for (const track of mixTracks) disposeTrack(track);
        mixTracks = [];

        const results = await Promise.allSettled(
            members.map(item => createBufferTrack(item.audio))
        );

        const failedCount = results.filter(
            result => result.status === "rejected"
        ).length;

        mixTracks = results
            .filter(result => result.status === "fulfilled")
            .map(result => result.value);

        if (failedCount > 0) {
            showToast(`${failedCount}個の音源を読み込めませんでした`);
        }
    }

    if (mixTracks.length === 0) {
        throw new Error("ミックス内の音源を読み込めませんでした");
    }

    return mixTracks;
}

/* ==================================================
   再生開始
   通常音源は1つ、ミックス音源は全音源を同時再生
================================================== */

async function startAudio() {
    if (!current || startingPlayback) return;

    startingPlayback = true;

    try {
        const tracks = isMix()
            ? await prepareMixTracks()
            : await prepareSingleTrack();

        const context = getAudioContext();

        if (context.state === "suspended") {
            await context.resume();
        }

        applyVolume();

        // 全トラックの開始時刻を揃えて、ミックスを同時に再生する
        const startAt = context.currentTime + 0.03;
        let successCount = 0;

        for (const track of tracks) {
            try {
                startTrack(track, startAt);
                successCount++;
            } catch (error) {
                console.error("[Player] 音源の再生開始失敗:", track.url, error);
            }
        }

        if (successCount === 0) {
            stopAudio();
            showToast("音源を再生できませんでした");
            return;
        }

        addHistory(current);

        if (els.playBtn) {
            els.playBtn.textContent = "停止";
        }

        if (localStorage.getItem("offTimer")) {
            startOffTimer(stopAudio);
        }

        console.log("[Player] バッファ再生開始:", {
            type: isMix() ? "mix" : "single",
            tracks: successCount,
            volume: getSliderVolume()
        });
    } catch (error) {
        console.error("[Player] audio play error name:", error?.name);
        console.error("[Player] audio play error message:", error?.message ?? String(error));
        console.error("[Player] audio play error stack:", error?.stack);
        stopAudio();
        showToast("音源を再生できませんでした");
    } finally {
        startingPlayback = false;
    }
}

/* ==================================================
   一時停止
   再生位置は保持する
================================================== */

function pauseAudio() {
    const tracks = getAudioPlayers();

    for (const track of tracks) {
        pauseTrack(track);
    }

    updateNativeNowPlaying(false);

    if (els.playBtn) {
        els.playBtn.textContent = "再生";
    }

    console.log("[Player] audio paused");
}

/* ==================================================
   完全停止
   ミックス内の全音源を停止して先頭に戻す
================================================== */

function stopAudio() {
    console.trace("[Player] stopAudio called from");

    const tracks = getAudioPlayers();

    for (const track of tracks) {
        try {
            stopTrack(track);
        } catch (error) {
            console.warn("[Player] audio reset error:", error);
        }
    }

    updateNativeNowPlaying(false);

    if (els.playBtn) {
        els.playBtn.textContent = "再生";
    }

    console.log("[Player] audio stopped:", tracks.length, "tracks");
}
