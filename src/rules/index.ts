const requireRuleset = require.context('.', false, /\.ts$/)
const rulesets = {}

requireRuleset.keys().forEach(fileName => {
  console.log(fileName)
  if (fileName === './index.ts') return
  const ruleset = requireRuleset(fileName).default || requireRuleset(fileName)
  rulesets[ruleset.id] = ruleset
})

console.log(rulesets)

export default rulesets
