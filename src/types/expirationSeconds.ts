export const ExpirationSecondsOptionValues = [0, 10, 30, 45, 60, 120, 300, 600];

export function createExpirationSecondsOptionNames(
  secondsLabel: string,
  minuteLabel: string,
  minutesLabel: string
): string[] {
  return [
    `0 ${secondsLabel}`,
    `10 ${secondsLabel}`,
    `30 ${secondsLabel}`,
    `45 ${secondsLabel}`,
    `1 ${minuteLabel}`,
    `2 ${minutesLabel}`,
    `5 ${minutesLabel}`,
    `10 ${minutesLabel}`,
  ];
}
