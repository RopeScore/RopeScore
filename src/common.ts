export function leftFillNum (num: number, width: number): string {
  return num
    .toString()
    .padStart(width, '0')
}
