export function vibrate(time=20){
  if(navigator.vibrate){
    navigator.vibrate(time);
  }
}