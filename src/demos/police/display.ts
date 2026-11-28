export const SHOW_CONFIDENCE_PERCENT = true;

export function formatSignal(label: string, percent: number, showPercent = SHOW_CONFIDENCE_PERCENT) {
  return showPercent ? `${label} ${percent}%` : label;
}

export function signalBand(percent: number) {
  if (percent >= 60) return "Candidate";
  if (percent >= 40) return "Uncertain";
  return null;
}
