//localStorage共通処理
//保存
export function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

//読み込み
export function load(key, defaultValue = []){
  try{
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : defaultValue;
  }catch(e){
    console.error(e);
    return defaultValue;
  }
}

//削除
export function remove(key){
  localStorage.removeItem(key);
}

//全消し
export function clear(){
  localStorage.clear();
}