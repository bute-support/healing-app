//localStorage全部保存
export function exportBackup(){
  return JSON.stringify(localStorage);
}

//復元
export function importBackup(text){
  const data=JSON.parse(text);

    Object.keys(data).forEach(key=>{
      localStorage.setItem(
        key,
        data[key]
      );
    });
}