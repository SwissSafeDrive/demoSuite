export const SHOW_CONFIDENCE_PERCENT = true;

export function formatSignal(label: string, percent: number, showPercent = SHOW_CONFIDENCE_PERCENT) {
  return showPercent ? `${label} ${percent}%` : label;
}
