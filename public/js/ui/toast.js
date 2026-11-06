export function showToast(message){
  const toast=document.getElementById("toast");
  const text=document.getElementById("toastText");

  if(!toast || !text) return;

  toast.classList.remove("marquee-toast", "thank-you");
  text.textContent=message;
  toast.classList.add("show");

  setTimeout(()=>{
    toast.classList.remove("show");
  },2000);
}