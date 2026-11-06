// js/player/openPlayer.js （名前は仮）
import { isPremium } from "../services/premiumService.js";
import { showToast } from "../ui/toast.js";

export function openPlayerFromList(item) {
  const sound = findSoundById(item.id); // マスターデータから取得
  if (!sound) return;

  if (!canPlay(sound)) {
    showToast("この音声は今日は開放されていません");
    return;
  }
  openPlayer(sound); // 既存のplayer表示処理
}