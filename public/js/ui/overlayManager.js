const loaded = new Map();

export async function loadOverlay(containerId, htmlPath){

  const container = document.getElementById(containerId);
  if(!container) return null;

  if(!loaded.has(containerId)){

    const res = await fetch(htmlPath);
    if (!res.ok) {
      console.error(
        "[Overlay] HTMLロード失敗:",
        htmlPath,
        "status:",
        res.status,
        "URL:",
        res.url
      );
      return null;
    }
    container.innerHTML = await res.text();
    loaded.set(containerId,true);
  }
  return container;
}

export function showOverlay(id){
  document
    .getElementById(id)
    ?.classList.add("active");
}

export function hideOverlay(id){
  document
    .getElementById(id)
    ?.classList.remove("active");
}