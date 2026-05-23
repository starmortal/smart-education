import { ElTooltip } from 'element-plus';
import { TOOLTIP_SHOW_DELAY } from '@/constants/tooltip';

/** 全局设置 Element Plus Tooltip 默认延迟与浅色样式 */
export function setupTooltipDefaults() {
  if (!ElTooltip?.props) return;

  if (ElTooltip.props.showAfter) {
    ElTooltip.props.showAfter.default = TOOLTIP_SHOW_DELAY;
  }
  if (ElTooltip.props.effect) {
    ElTooltip.props.effect.default = 'light';
  }
}
