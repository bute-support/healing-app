import { todaySounds } from "../data.js";

const KEY = "dailyPicks";

// 端末のローカル日付（日本なら 0:00 で切り替わる）
function localDateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Fisher–Yates（偏りのないシャッフル）
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getTodaysPicks(count = 3) {
  const today = localDateKey();

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {
    saved = null;
  }

  if (saved?.date === today && Array.isArray(saved.ids)) {
    const picks = saved.ids
      .map(id => todaySounds.find(s => s.id === id))
      .filter(Boolean);
    if (picks.length === count) return picks;
  }

  const picks = shuffle(todaySounds).slice(0, count);
  localStorage.setItem(
    KEY,
    JSON.stringify({ date: today, ids: picks.map(s => s.id) })
  );
  return picks;
}