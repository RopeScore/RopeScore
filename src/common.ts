export function leftFillNum(num: number, width: number): string {
  return num
    .toString()
    .padStart(width, '0')
}

export function roundToMultiple(num: number, multiple: number): number {
  var resto = num % multiple
  if (resto <= multiple / 2) {
    return num - resto
  } else {
    return num + multiple - resto
  }
}

export function roundTo(n: number, digits: number): number {
  digits = digits || 0

  var multiplicator = Math.pow(10, digits)
  n = n * multiplicator
  var test = (Math.round(n) / multiplicator)
  if (isNaN(test)) return
  return test
}
