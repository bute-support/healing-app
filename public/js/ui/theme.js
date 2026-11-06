
function applyTheme(mode) {
    const isDark = mode === "dark";

    document.documentElement.classList.toggle("dark", isDark);
    document.body?.classList.toggle("dark", isDark);
}

export function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    applyTheme(savedTheme === "dark" ? "dark" : "light");
}

export function setTheme(mode) {
    const theme = mode === "dark" ? "dark" : "light";

    localStorage.setItem("theme", theme);
    applyTheme(theme);

    window.dispatchEvent(
        new CustomEvent("themeChanged", {
            detail: { theme }
        })
    );
}

// ページを開いたとき、戻ってきたときにテーマを再適用
function refreshTheme() {
    initTheme();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshTheme, {
        once: true
    });
} else {
    refreshTheme();
}

window.addEventListener("pageshow", refreshTheme);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        refreshTheme();
    }
});