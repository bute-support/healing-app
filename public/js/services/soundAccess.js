import { isPremium } from "./premiumService.js";
import { goPremium } from "./premiumLimit.js";
import { getTodaysPicks } from "./dailyContent.js";
import { findSound, isDailySound, isMix } from "./soundCatalog.js";
import { showToast } from "../ui/toast.js";
import { showLoading } from "../ui/loading.js";

// 他のファイルから従来どおり import できるように再エクスポート
export { findSound, isDailySound, isMix };

export function isTodayPick(id) {
  return getTodaysPicks(3).some(s => String(s.id) === String(id));
}

// ミックスを構成する音声（今日の音は含めない）
function mixMembers(mix) {
  return (mix.sounds || [])
    .map(x => findSound(typeof x === "object" ? x.id : x))
    .filter(s => s && !isDailySound(s));
}

/**
 * 再生できるかどうかの判定（ここが唯一のルール）
 *
 * "ok"          再生できる
 * "locked"      プレミアム会員だが、今日は開放されていない今日の音
 * "needPremium" 無料プランで今日の音を開こうとした
 * "missing"     データが存在しない
 */
export function getAccess(item) {
  if (!item) return "missing";

  if (isMix(item)) {
    return mixMembers(item).length > 0 ? "ok" : "missing";
  }

  const s = findSound(item.id);
  if (!s) return "missing";

  // 通常の音声は誰でも再生できる
  if (!isDailySound(s)) return "ok";

  // 今日の音：プレミアム会員で、かつ今日の3音に入っているときだけ
  if (!isPremium()) return "needPremium";
  return isTodayPick(s.id) ? "ok" : "locked";
}

// お気に入り・保存・履歴の一覧に出してよいか
// 今日の音は、どのプランでも一覧に出さない
export function isVisible(item) {
  if (!item) return false;
  if (isMix(item)) return mixMembers(item).length > 0;
  return !isDailySound(item) && !!findSound(item.id);
}

export function filterVisible(list) {
  return list.filter(isVisible);
}

export function goToPlayer(item, { loading = false } = {}) {
  localStorage.setItem("playItem", JSON.stringify(item));

  if (loading) {
    showLoading();
    setTimeout(() => { location.href = "player.html"; }, 300);
  } else {
    location.href = "player.html";
  }
}

// 一覧・ホームのタイルから player 画面を開く（共通入口）
export function openPlayerFromList(item, opts) {
  const access = getAccess(item);

  if (access === "missing") {
    showToast("この音声は利用できません");
    return;
  }
  if (access === "needPremium") {
    goPremium("today");
    return;
  }
  if (access === "locked") {
    showToast("この音声は今日は開放されていません");
    return;
  }

  // 通常の音声は、常に元データから渡す（説明文・動画などを揃えるため）
  goToPlayer(isMix(item) ? item : findSound(item.id), opts);
}