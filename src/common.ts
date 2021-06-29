import { Team, Categories, CategoryWithInfo } from './store/categories'

export function leftFillNum (num: number, width: number): string {
  return num
    .toString()
    .padStart(width, '0')
}

export function roundToMultiple (num: number, multiple: number): number {
  var resto = num % multiple
  if (resto <= multiple / 2) {
    return num - resto
  } else {
    return num + multiple - resto
  }
}

export function roundTo (n: number, digits: number): number {
  digits = digits || 0

  var multiplicator = Math.pow(10, digits)
  n = n * multiplicator
  var test = (Math.round(n) / multiplicator)
  if (isNaN(test)) return NaN
  return test
}

export function nextID (ids: string[], prefix: string = '', suffix: string = '', startAt: number = 1) {
  let nextID = `${prefix}${leftFillNum(startAt || 1, 3)}${suffix}`
  const countRegex = new RegExp(`(^${prefix}|${suffix}$)`, 'g')
  const participantIDs = ids.map(id => Number(id.replace(countRegex, ''))).sort((a, b) => a - b)

  if (participantIDs.length > 0) {
    let lastID = participantIDs[participantIDs.length - 1]

    if (!lastID) throw new Error(`Invalid ID ${lastID} in array of IDs`)

    nextID = `${prefix}${leftFillNum(lastID + 1, 3)}${suffix}`
  }

  return nextID
}

export function memberNames (team?: Team): string {
  return team?.members?.map(psn => psn.name).join(', ') ?? ''
}


export function nameCleaner (str: string): string {
  return str.replace(/[#%&{}\\<>*?/$!'":@|\s]/gi, "_")
}

export function getInfoFromCategories (categories: Categories): CategoryWithInfo[] {
  return Object.entries(categories)
  .map(([id, category]) => ({
    id,
    group: category.config.group || 'Ungrouped',
    name: category.config.name,
    ruleset: category.config.ruleset
  }))
}

export function factorFormat (value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return ''
  else if (value === 1) return `±0 %`
  else if (value > 1) return `+${roundTo((value - 1) * 100, 0)} %`
  else return `-${roundTo((1 - value) * 100, 0)} %`
}
