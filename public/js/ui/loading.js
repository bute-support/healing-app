export function showLoading(){
  const loading=document.getElementById("loading");
  if(!loading) return;
  loading.classList.remove("hidden");
}

export function hideLoading(){
  document.getElementById("loading")?.classList.add("hidden");
}