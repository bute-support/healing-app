// dB(デシベル)を線形ゲイン値に変換する
// 0dB = そのまま、+はより大きく、-はより小さく聞こえる
export function dbToGain(db) {
  return Math.pow(10, db / 20);
}