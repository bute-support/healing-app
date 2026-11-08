import { renderPreviewList } from "../ui/listView.js";
import { openPlayerFromList } from "../services/soundAccess.js";

function attachPlayClick(container, selector, getList) {
  container.querySelectorAll(selector).forEach(el => {
    el.onclick = () => {
      const item = getList().find(
        i => String(i.id) === el.dataset.id
      );

      if (!item) return;

      openPlayerFromList(item, { loading: true });
    };
  });
}

// 共通「もっと見る」設定
export function getTitle(item) {
  return item.title || item.label || item.name || "名称なし";
}

// ユーザーが自由入力した文字列（ミックス名など）を
// そのままHTMLに差し込むとコードとして実行されてしまうため、
// 画面に表示する前に必ずこれを通す
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

export function createSimpleItem(className) {
  return item => `
    <div class="${className}" data-id="${item.id}">
      ${escapeHtml(getTitle(item))}
    </div>
  `;
}

// 共通「もっと見る」
export function createPreview(root, config, renderLists) {

  const container =
    root.querySelector(`#${config.containerId}`);

  if (!container) return;

  const button =
    root.querySelector(`#${config.buttonId}`);

  renderPreviewList({
    container,
    button,
    ...config,

    onItemClick(current) {
      if (config.selector) {
        attachPlayClick(
          container,
          config.selector,
          config.getList
        );
      }
      config.afterClick?.(
        current,
        renderLists
      );
    }
  });
}