export class GameSolver {
  constructor(numbers, originalIndices = null) {
    this.numbers = numbers
    this.originalIndices = originalIndices || numbers.map((_, i) => i)
    this.solutions = []
  }

  solve(target) {
    this.solutions = []
    const items = this.numbers.map((n, i) => ({
      value: n,
      expr: n.toString(),
      originalIndex: this.originalIndices[i]
    }))
    this._findSolutions(items, target)
    return this.solutions[0] || null
  }

  _findSolutions(items, target) {
    if (this.solutions.length > 0) return

    if (items.length === 1) {
      if (Math.abs(items[0].value - target) < 1e-9) {
        this.solutions.push({
          expression: items[0].expr,
          usedOriginalIndices: items[0].originalIndices || [items[0].originalIndex]
        })
      }
      return
    }

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]
        const b = items[j]
        const rest = items.filter((_, idx) => idx !== i && idx !== j)

        const aIndices = a.originalIndices || [a.originalIndex]
        const bIndices = b.originalIndices || [b.originalIndex]
        const combinedIndices = [...aIndices, ...bIndices]

        const operations = [
          { value: a.value + b.value, expr: `(${a.expr} + ${b.expr})`, needCheck: false },
          { value: a.value - b.value, expr: `(${a.expr} - ${b.expr})`, needCheck: true, checkValue: a.value - b.value },
          { value: b.value - a.value, expr: `(${b.expr} - ${a.expr})`, needCheck: true, checkValue: b.value - a.value },
          { value: a.value * b.value, expr: `(${a.expr} × ${b.expr})`, needCheck: false }
        ]

        if (b.value !== 0 && a.value % b.value === 0) {
          operations.push({
            value: a.value / b.value,
            expr: `(${a.expr} ÷ ${b.expr})`,
            needCheck: true,
            checkValue: a.value / b.value
          })
        }
        if (a.value !== 0 && b.value % a.value === 0) {
          operations.push({
            value: b.value / a.value,
            expr: `(${b.expr} ÷ ${a.expr})`,
            needCheck: true,
            checkValue: b.value / a.value
          })
        }

        for (const op of operations) {
          if (op.needCheck && (op.checkValue <= 0 || !Number.isInteger(op.checkValue))) {
            continue
          }
          if (op.value <= 0) continue

          const newItem = {
            value: op.value,
            expr: op.expr,
            originalIndices: combinedIndices
          }

          this._findSolutions([...rest, newItem], target)

          if (this.solutions.length > 0) return
        }
      }
    }
  }
}

export function findDateCombination(dates, target) {
  const validDates = dates.filter(d => d.current)
  
  if (validDates.length < 2) return null

  for (let len = 2; len <= validDates.length; len++) {
    const dateCombos = getCombinations(validDates, len)
    for (const dateCombo of dateCombos) {
      const numbers = dateCombo.map(d => d.fullDate.date)
      const originalIndices = dateCombo.map((_, i) => i)
      
      const solver = new GameSolver(numbers, originalIndices)
      const solution = solver.solve(target)
      
      if (solution) {
        const usedDates = solution.usedOriginalIndices.map(idx => dateCombo[idx])
        return {
          expression: solution.expression.replace(/^\(|\)$/g, ''),
          usedDates: usedDates,
          target
        }
      }
    }
  }

  return null
}

function getCombinations(arr, len) {
  if (len === 1) return arr.map(x => [x])
  const result = []
  for (let i = 0; i <= arr.length - len; i++) {
    const head = arr[i]
    const tailCombos = getCombinations(arr.slice(i + 1), len - 1)
    for (const combo of tailCombos) {
      result.push([head, ...combo])
    }
  }
  return result
}
