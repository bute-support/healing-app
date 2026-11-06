import "../ui/theme.js";
import { categories, sounds, todaySounds } from "../data.js";
import { isPremium } from "../services/premiumService.js";
import { showBanner } from "../services/adService.js";
import { initPurchases } from "../services/purchaseService.js";

// トップ画面の読み込み後に広告表示を試みる
window.addEventListener("load", async () => {
  try {
    await initPurchases();
    console.log("[Index] RevenueCat initialized");
  } catch (error) {
    console.error("[Index] RevenueCat initialization failed:", error);
  }

  try {
    await showBanner();
  } catch (error) {
    console.error("広告表示の呼び出しに失敗:", error);
  }
});

// ==============================
// アイコン更新
// ==============================

const refreshIcons = () => {
    window.lucide?.createIcons?.();
};


// ==============================
// 今日の音
// ==============================

const DAILY_KEY = "dailyPicks";


function getDateKey() {

    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    const day =
        String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function shuffle(array) {

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}


function getTodaysPicks(count = 3) {

    const today = getDateKey();

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    DAILY_KEY
                ) || "null"
            );

        if (
            saved?.date === today &&
            Array.isArray(saved.ids)
        ) {

            const picks =
                saved.ids
                    .map(id =>
                        todaySounds.find(
                            sound =>
                                String(sound.id) ===
                                String(id)
                        )
                    )
                    .filter(Boolean);

            if (picks.length === count) {

                return picks;

            }
        }

    } catch (e) {

        console.warn(
            "[Index] daily read error:",
            e
        );

    }


    const picks =
        shuffle(todaySounds)
            .slice(0, count);


    try {

        localStorage.setItem(
            DAILY_KEY,
            JSON.stringify({
                date: today,
                ids: picks.map(
                    sound => sound.id
                )
            })
        );

    } catch (e) {

        console.warn(
            "[Index] daily save error:",
            e
        );

    }


    return picks;
}


// ==============================
// Playerへ移動
// ==============================

function openPlayer(item) {

    if (!item) return;

    console.log(
        "[Index] selected:",
        item
    );

    localStorage.setItem(
        "playItem",
        JSON.stringify(item)
    );

    location.href = "player.html";
}


// ==============================
// 通常音
// ==============================

function createSoundTile(item) {

    return `
        <button
            type="button"
            class="sound-tile"
            data-id="${item.id}"
            data-type="normal"
        >

            <span class="sound-tile-label">
                ${item.label || ""}
            </span>

            <span class="sound-tile-subtitle">
                ${item.subtitle || ""}
            </span>

        </button>
    `;
}


// ==============================
// 今日の音
// ==============================

function createTodayTile(item) {

    const locked = !isPremium();

    return `
        <button
            type="button"
            class="sound-tile today-sound-tile ${locked ? "locked" : ""}"
            data-id="${item.id}"
            data-type="today"
        >

            <span class="sound-tile-label">

                ${
                    locked
                        ? `
                            <span class="today-lock">
                                <i data-lucide="lock"></i>
                            </span>
                          `
                        : ""
                }

                ${item.label || ""}

            </span>

            <span class="sound-tile-subtitle">
                ${item.subtitle || ""}
            </span>

        </button>
    `;
}


// ==============================
// 描画
// ==============================

function renderSections() {

    const root =
        document.getElementById(
            "soundSections"
        );


    if (!root) {

        console.error(
            "[Index] soundSections not found"
        );

        return;
    }


    let html = "";


    // --------------------------
    // 通常カテゴリ
    // --------------------------

    categories.forEach(category => {

        const items =
            sounds.filter(
                sound =>
                    sound.category ===
                    category.id
            );


        if (items.length === 0) return;


        html += `

            <section class="browse-section">

                <h2 class="browse-section-title">

                    <i data-lucide="${category.icon}"></i>

                    ${category.label}

                </h2>


                <div class="sound-grid">

                    ${items
                        .map(createSoundTile)
                        .join("")
                    }

                </div>

            </section>

        `;
    });


    // --------------------------
    // 今日の音
    // --------------------------

    const todayPicks =
        getTodaysPicks(3);


    if (todayPicks.length > 0) {

        html += `

            <section class="browse-section today-section">

                <h2 class="browse-section-title">

                    <i data-lucide="sparkles"></i>

                    今日の音

                </h2>

                <p class="today-description">
                    プレミアム限定・毎日ランダムで3音が解放されます
                </p>

                <div class="sound-grid">

                    ${todayPicks
                        .map(createTodayTile)
                        .join("")
                    }

                </div>

            </section>

        `;
    }


    root.innerHTML = html;


    // --------------------------
    // 通常音クリック
    // --------------------------

    root.querySelectorAll(
        '.sound-tile[data-type="normal"]'
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const item =
                    sounds.find(
                        sound =>
                            String(sound.id) ===
                            String(button.dataset.id)
                    );

                openPlayer(item);

            }
        );

    });


    // --------------------------
    // 今日の音クリック
    // --------------------------

    root.querySelectorAll(
        '.sound-tile[data-type="today"]'
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const item =
                    todaySounds.find(
                        sound =>
                            String(sound.id) ===
                            String(button.dataset.id)
                    );


                if (!item) return;


                if (!isPremium()) {

                    console.log(
                        "[Index] today sound locked:",
                        item
                    );

                    return;
                }


                openPlayer(item);

            }
        );

    });


    // --------------------------
    // Lucideアイコン生成
    // --------------------------

    refreshIcons();


    console.log(
        "[Index] render complete"
    );
}


// ==============================
// 起動
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "[Index] DOMContentLoaded"
        );


        // ==========================
        // まずindexを表示
        // ==========================

        renderSections();


        // ==========================
        // 設定を後から読み込む
        // ==========================

        console.log(
            "[Index] settings import start"
        );


        try {

            const settingsModule =
                await import(
                    "../pages/settings.js"
                );


            console.log(
                "[Index] settings import success:",
                settingsModule
            );


            if (
                typeof settingsModule.loadSettings !==
                "function"
            ) {

                console.error(
                    "[Index] loadSettings is not a function"
                );

                return;
            }


            await settingsModule.loadSettings();


            console.log(
                "[Index] settings loaded"
            );


        } catch (error) {

            console.error(
                "[Index] SETTINGS ERROR:",
                error
            );

        }


        refreshIcons();

    }
);