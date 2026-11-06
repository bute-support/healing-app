export function renderPreviewList({
    container,
    button,
    getList,
    renderItem,
    limit=5,
    emptyText="データはありません",
    onItemClick
}) {
    let expanded = false;

    function draw() {
      const list = getList();
      if(list.length===0){
        container.innerHTML=`
          <p class="empty-message">
            ${emptyText}
          </p>
        `;
        if(button){
          button.style.display="none";
        }
        return;
      }
        const target = expanded ? list : list.slice(0, limit);
        container.innerHTML = target.map(renderItem).join("");

        if(button){
          button.style.display=list.length<=limit
            ? "none"
            : "block";

          if(list.length>limit){
            button.textContent=expanded
              ? "閉じる"
              : `もっと見る（全${list.length}件）`;
          }
        }
        if(onItemClick){
            onItemClick(container);
        }
        lucide.createIcons();
    }

    draw();
    if(button){
        button?.addEventListener("click", () => {
            expanded = !expanded;
            draw();
        });
    }
    return draw;
}