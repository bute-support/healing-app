/* ==================================================
   audioPlayer.js

   音声再生を一括管理

   - 通常音声
   - ミックス音声
   - 音量
   - ミュート
   - フェードアウト
   - Media Session
================================================== */

export class AudioPlayer {
  constructor() {

    /* Audio */
    this.audioElements = [];

    /* 再生状態 */
    this.isPlaying = false;
    this.isMuted = false;
    this.lastVolume = 0.4;

    /* フェード */
    this.isFadingOut = false;
    this.fadeTimerId = null;

    /* 現在のアイテム */
    this.currentItem = null;
    this.savedSounds = [];

    /* Media Session */
    this.mediaSessionReady = false;
    this.onMediaPlay = null;

    /* UI状態変更 */
    this.onStateChange = null;
  }

  /* ==================================================
     Audio Session
  ================================================== */

  setupAudioSession() {
    try {
      if (
        "audioSession" in navigator &&
        navigator.audioSession
      ) {
        navigator.audioSession.type =
          "playback";
      }
    } catch (error) {
      console.warn(
        "AudioSession設定を利用できません:",
        error
      );
    }
  }

  /* ==================================================
     Audio要素作成
  ================================================== */

  createAudioElement(src, volume) {
    const audio = new Audio();

    audio.src = src;
    audio.loop = true;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.volume = 
      Math.max(
        0,
        Math.min(
          Number(volume) || 0,
          1
        )
      );

    audio.addEventListener("error", () => {
        console.error(
          "Audio読み込みエラー:",
          src,
          audio.error
        );
      }
    );
    return audio;
  }

  /* ==================================================
     実効音量
  ================================================== */

  getEffectiveVolume(sourceVolume = 1) {
    if (this.isMuted) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        this.lastVolume *
          sourceVolume,
        1
      )
    );
  }

  /* ==================================================
     Audio準備
  ================================================== */

  prepare(item, savedSounds = []) {
    this.cancelFade();
    this.cleanup();
    this.currentItem = item;
    this.savedSounds = savedSounds;

    if (item.type === "mix") {
      this.prepareMix(
        item,
        savedSounds
      );
    } else {
      this.prepareNormal(
        item
      );
    }

    return (
      this.audioElements.length >
      0
    );
  }

  /* ==================================================
     通常音声
  ================================================== */

  prepareNormal(item) {
    if (!item.audio) {
      console.warn(
        "audioファイルがありません"
      );
      return;
    }

    const itemVolume =
      Number.isFinite(
        Number(item.volume)
      )
        ? Number(item.volume)
        : 1;

    const audio =
      this.createAudioElement(
        `assets/${item.audio}`,
        this.getEffectiveVolume(
          itemVolume
        )
      );

    this.audioElements = [
      {
        audio,
        sourceVolume:
          itemVolume
      }
    ];
  }

  /* ==================================================
     ミックス音声
  ================================================== */

  prepareMix(item, savedSounds) {
    if (
      !Array.isArray(
        item.sounds
      )
    ) {
      console.warn(
        "mix.sounds がありません"
      );
      return;
    }

    for (const id of item.sounds) {
      const sound =
        savedSounds.find(
          s => s.id === id
        );

      if (!sound) {
        continue;
      }
      if (!sound.audio) {
        continue;
      }

      const sourceVolume =
        Number.isFinite(
          Number(sound.volume)
        )
          ? Number(sound.volume)
          : 1;

      const audio =
        this.createAudioElement(
          `assets/${sound.audio}`,
          this.getEffectiveVolume(
            sourceVolume
          )
        );

      this.audioElements.push({
        audio,
        sourceVolume
      });
    }
  }

  /* ==================================================
     再生
  ================================================== */

  async play() {
    this.cancelFade();

    if (
      this.audioElements.length ===
      0
    ) {
      console.warn(
        "再生できる音声がありません"
      );
      return false;
    }

    try {
      await Promise.all(
        this.audioElements.map(
          ({ audio }) =>
            audio.play()
        )
      );
    } catch (error) {
      console.error(
        "Audio play error:",
        error
      );
      return false;
    }

    /* ==================================================
       再生状態
    ================================================== */

    this.isPlaying = true;

    /* ==================================================
       Media Session
    ================================================== */

    this.updateMediaSessionState();

    /* ==================================================
       UI
    ================================================== */

    this.onStateChange?.(true);
    return true;
  }

  /* ==================================================
     一時停止
  ================================================== */

  pause() {
    this.cancelFade();
    this.audioElements.forEach(
      ({ audio }) => {
        try {
          audio.pause();
        } catch (error) {}
      }
    );

    this.isPlaying = false;
    this.updateMediaSessionState();
    this.onStateChange?.(false);
  }

  /* ==================================================
     停止
  ================================================== */

  stop() {
    this.cancelFade();
    this.audioElements.forEach(
      ({ audio }) => {
        try {
          audio.pause();
        } catch (error) {}
      }
    );

    this.cleanup();
    this.isPlaying = false;
    this.updateMediaSessionState();
    this.onStateChange?.(false);
  }

  /* ==================================================
     Audio破棄
  ================================================== */

  cleanup() {
    this.audioElements.forEach(
      ({ audio }) => {
        try {
          audio.pause();
        } catch (error) {}

        try {
          audio.currentTime = 0;
        } catch (error) {}

        try {
          audio.removeAttribute("src");
          audio.load();
        } catch (error) {}
      }
    );

    this.audioElements = [];
  }

  /* ==================================================
     音量
  ================================================== */

  setVolume(volume) {
    const value = Number(volume);

    this.lastVolume =
      Math.max(
        0,
        Math.min(
          Number.isFinite(value)
            ? value
            : 0,
          1
        )
      );

    this.isMuted = false;
    this.applyVolume();
  }

  /* ==================================================
     ミュート
  ================================================== */

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.applyVolume();

    return this.isMuted;
  }

  /* ==================================================
     音量反映
  ================================================== */

  applyVolume() {
    if (this.isFadingOut) {
      return;
    }

    this.audioElements.forEach(
      ({
        audio,
        sourceVolume
      }) => {
        audio.volume =
          this.getEffectiveVolume(
            sourceVolume
          );
      }
    );
  }

  /* ==================================================
     フェードアウト
  ================================================== */

  fadeOutAndStop(duration = 3000) {
    if (this.isFadingOut) {
      return;
    }

    if (!this.isPlaying) {
      this.stop();
      return;
    }

    if (this.audioElements.length === 0) {
      this.stop();
      return;
    }

    this.isFadingOut = true;

    const startVolumes =
      this.audioElements.map(
        ({ audio }) =>
          audio.volume
      );

    const interval = 50;
    let elapsed = 0;

    this.fadeTimerId =
      setInterval(
        () => {
          elapsed +=
            interval;

          const progress =
            Math.min(
              elapsed /
                duration,
              1
            );

          this.audioElements.forEach(
            (
              { audio },
              index
            ) => {

              audio.volume =
                startVolumes[index] *
                (1 - progress);
            }
          );

          if (progress >= 1) {
            this.cancelFade();
            this.audioElements.forEach(
              ({ audio }) => {
                try {
                  audio.volume = 0;
                  audio.pause();
                } catch (error) {}
              }
            );

            this.cleanup();
            this.isPlaying = false;
            this.updateMediaSessionState();
            this.onStateChange?.(false);
          }
        },
        interval
      );
  }

  /* ==================================================
     フェードキャンセル
  ================================================== */

  cancelFade() {
    if (
      this.fadeTimerId !==
      null
    ) {
      clearInterval(
        this.fadeTimerId
      );

      this.fadeTimerId = null;
    }
    this.isFadingOut = false;
  }

  /* ==================================================
     Media Session
  ================================================== */

  setupMediaSession({
    title = "今日の癒し",
    artist = "Būte",
    album = "今日の癒し",
    artwork = []
  } = {}) {
    if (
      !(
        "mediaSession" in
        navigator
      )
    ) {
      console.log(
        "Media Session API 非対応"
      );
      return;
    }

    try {

      /* Metadata */
      navigator.mediaSession.metadata =
        new MediaMetadata({
          title,
          artist,
          album,
          artwork
        });

      /* Play */
      try {
        navigator.mediaSession.setActionHandler(
          "play",
          async () => {
            console.log(
              "Media Session → play"
            );

            /* 既にAudioが存在する場合 */
            if (
              this.audioElements.length >
              0
            ) {
              await this.play();
              return;
            }

            /* Audioが無い場合player.js側で prepare → play */
            if (
              typeof this.onMediaPlay ===
              "function"
            ) {
              await this.onMediaPlay();
            }
          }
        );
      } catch (error) {
        console.warn(
          "MediaSession play 非対応:",
          error
        );
      }

      /* Pause */
      try {
        navigator.mediaSession.setActionHandler(
          "pause",
          () => {
            console.log(
              "Media Session → pause"
            );
            this.pause();
          }
        );
      } catch (error) {
        console.warn(
          "MediaSession pause 非対応:",
          error
        );
      }

      /* Stop */
      try {
        navigator.mediaSession.setActionHandler(
          "stop",
          () => {
            console.log(
              "Media Session → stop"
            );
            this.stop();
          }
        );
      } catch (error) {
        console.warn(
          "MediaSession stop 非対応:",
          error
        );
      }

      this.mediaSessionReady = true;
      this.updateMediaSessionState();
    } catch (error) {
      console.error(
        "MediaSession設定エラー:",
        error
      );
    }
  }

  /* ==================================================
     Media Session Metadata更新
  ================================================== */

  updateMediaSessionMetadata({
    title = "今日の癒し",
    artist = "Būte",
    album = "今日の癒し",
    artwork = []
  } = {}) {
    if (
      !(
        "mediaSession" in
        navigator
      )
    ) {
      return;
    }

    try {
      navigator.mediaSession.metadata =
        new MediaMetadata({
          title,
          artist,
          album,
          artwork
        });
    } catch (error) {
      console.error(
        "MediaSession metadata更新エラー:",
        error
      );
    }
  }

  /* ==================================================
     Media Session 状態
  ================================================== */

  updateMediaSessionState() {
    if (
      !(
        "mediaSession" in
        navigator
      )
    ) {
      return;
    }

    try {

      navigator.mediaSession.playbackState =
        this.isPlaying
          ? "playing"
          : "paused";

    } catch (error) {
      console.warn(
        "playbackState更新失敗:",
        error
      );
    }
  }
}