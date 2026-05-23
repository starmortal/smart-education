/** 鼠标悬浮提示延迟（毫秒），1–1.5 秒 */
export const TOOLTIP_SHOW_DELAY = 1200;

/** 表格列溢出提示配置 */
export const TABLE_OVERFLOW_TOOLTIP = {
  showAfter: TOOLTIP_SHOW_DELAY,
  effect: 'light'
};

/** ECharts 图表悬浮提示统一样式 */
export const CHART_TOOLTIP_BASE = {
  showDelay: TOOLTIP_SHOW_DELAY,
  backgroundColor: '#f3f4f6',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  textStyle: {
    color: '#4b5563',
    fontSize: 13
  },
  extraCssText: 'box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);'
};
