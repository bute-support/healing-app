/* =========================================================
   共通スワイプ戻る機能
   ・画面左端から右へスワイプで戻る
   ・優先度の高い画面の戻る処理を優先
   ・イベントの二重登録を防止
   ・旧 initSwipeBack() にも対応
========================================================= */

const handlers = new Map();

let initialized = false;
let startX = 0;
let startY = 0;
let tracking = false;

// スワイプ開始位置・判定条件
const EDGE_WIDTH = 30;
const MIN_SWIPE_DISTANCE = 80;
const MAX_VERTICAL_DISTANCE = 80;

function initializeSwipeListener() {
    if (initialized) return;
    initialized = true;

    document.addEventListener(
        "touchstart",
        (event) => {
            tracking = false;

            // 1本指以外は対象外
            if (event.touches.length !== 1) return;

            const target = event.target;

            // 入力欄やスライダーではスワイプを開始しない
            if (
                target instanceof Element &&
                target.closest(
                    'input, textarea, select, ' +
                    '[contenteditable="true"], ' +
                    '.no-swipe-back, .volume-wrap'
                )
            ) {
                return;
            }

            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;

            // 画面の左端付近から始まった操作だけを判定
            tracking = startX <= EDGE_WIDTH;
        },
        { passive: true }
    );

    document.addEventListener(
        "touchend",
        (event) => {
            if (!tracking || event.changedTouches.length !== 1) {
                tracking = false;
                return;
            }

            tracking = false;

            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = Math.abs(endY - startY);

            // 右方向に十分移動し、縦方向の移動が小さい場合のみ戻る
            if (
                deltaX < MIN_SWIPE_DISTANCE ||
                deltaY > MAX_VERTICAL_DISTANCE
            ) {
                return;
            }

            // 現在有効な戻る処理を取得
            const activeHandlers = [...handlers.values()]
                .filter((handler) => {
                    try {
                        return handler.isActive();
                    } catch (error) {
                        console.error(
                            "[SwipeBack] 状態確認エラー:",
                            error
                        );
                        return false;
                    }
                })
                .sort((a, b) => b.priority - a.priority);

            // 最優先の1つだけ実行
            const handler = activeHandlers[0];

            if (handler) {
                try {
                    handler.onBack();
                } catch (error) {
                    console.error(
                        "[SwipeBack] 戻る処理エラー:",
                        error
                    );
                }
            }
        },
        { passive: true }
    );
}

/* =========================================================
   戻る処理の登録
========================================================= */

export function registerSwipeBack(
    key,
    onBack,
    isActive = () => true,
    priority = 0
) {
    if (typeof onBack !== "function") {
        console.error(
            "[SwipeBack] onBackには関数を指定してください:",
            key
        );
        return;
    }

    // 同じキーなら上書きし、登録が重複しないようにする
    handlers.set(key, {
        onBack,
        isActive,
        priority
    });

    initializeSwipeListener();
}

/* =========================================================
   戻る処理の登録解除
   オーバーレイを破棄する場合などに使用
========================================================= */

export function unregisterSwipeBack(key) {
    handlers.delete(key);
}

/* =========================================================
   旧 initSwipeBack() との互換性
   既存のミックス画面などをすぐに壊さないための処理
========================================================= */

let legacyCounter = 0;

export function initSwipeBack(onBack, isActive = () => true, priority = 0) {
    const key = `legacy-${++legacyCounter}`;

    registerSwipeBack(
        key,
        onBack,
        isActive,
        priority
    );

    return () => unregisterSwipeBack(key);
}