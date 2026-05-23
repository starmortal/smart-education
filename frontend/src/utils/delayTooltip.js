import { TOOLTIP_SHOW_DELAY } from '@/constants/tooltip';

let tooltipNode = null;
let showTimer = null;
let hideTimer = null;
let currentTarget = null;

function ensureTooltipNode() {
  if (!tooltipNode) {
    tooltipNode = document.createElement('div');
    tooltipNode.className = 'app-native-delay-tooltip';
    tooltipNode.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipNode);
  }
  return tooltipNode;
}

function positionTooltip(target, node) {
  const rect = target.getBoundingClientRect();
  node.style.left = `${rect.left + rect.width / 2}px`;
  node.style.top = `${rect.top}px`;
}

function hideTooltip() {
  tooltipNode?.classList.remove('visible');
  currentTarget = null;
}

function bindDelayTooltip(el, text) {
  if (!text || el._delayTooltipBound) return;

  el._delayTooltipBound = true;
  el._delayTooltipText = text;

  const onEnter = () => {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      const node = ensureTooltipNode();
      node.textContent = el._delayTooltipText;
      positionTooltip(el, node);
      node.classList.add('visible');
      currentTarget = el;
    }, TOOLTIP_SHOW_DELAY);
  };

  const onLeave = () => {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      if (currentTarget === el) {
        hideTooltip();
      }
    }, 80);
  };

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mouseleave', onLeave);

  el._delayTooltipCleanup = () => {
    clearTimeout(showTimer);
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
    el._delayTooltipBound = false;
  };
}

/**
 * 将容器内原生 title 属性转为延迟显示的浅灰提示
 * @param {ParentNode} root
 */
export function initDelayTooltips(root = document.body) {
  if (!root?.querySelectorAll) return;

  root.querySelectorAll('[title]:not([data-delay-tooltip-skip])').forEach((el) => {
    const title = el.getAttribute('title');
    if (!title?.trim()) return;

    el.removeAttribute('title');
    el.setAttribute('data-delay-tooltip', 'true');
    bindDelayTooltip(el, title.trim());
  });
}
