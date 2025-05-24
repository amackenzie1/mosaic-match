import { MajorEventType } from '@/lib/utils/sentimentAnalysis'
import { getWeekStart } from './dateUtils'

const BASE_WEIGHTS = {
  A0: 0.6, // current week events
  A1: 0.25, // previous week events
  A2: 0.15, // no events scenario
} as const

// Ensure that the weights sum to 1
const TOTAL_WEIGHT = BASE_WEIGHTS.A0 + BASE_WEIGHTS.A1 + BASE_WEIGHTS.A2
if (TOTAL_WEIGHT !== 1) {
  throw new Error('Weights do not sum up to 1')
}

interface WeightedData {
  [weekStart: string]: number
}

export function calculateWeightedSentiment(
  chatSentiments: Record<string, Record<string, number>>,
  majorEvents: Record<string, MajorEventType[]>,
  span: number = 0.05 // allow passing a span parameter
): WeightedData {
  const weightedData: WeightedData = {}
  const globalSentiments = chatSentiments['global']

  // Pre-process major events into a map of week start timestamps to events
  const eventsByWeek = new Map<number, MajorEventType[]>()

  majorEvents['global'].forEach((event) => {
    if (!event.hash) return
    const eventTime = new Date(event.timestamp_range.start)
    const weekStart = new Date(getWeekStart(eventTime)).getTime()

    if (!eventsByWeek.has(weekStart)) {
      eventsByWeek.set(weekStart, [])
    }
    eventsByWeek.get(weekStart)!.push(event)
  })

  Object.entries(globalSentiments).forEach(([weekStart, weekSentiment]) => {
    const currentWeekStart = new Date(weekStart).getTime()
    const prevWeekStart = currentWeekStart - 7 * 24 * 60 * 60 * 1000

    // Gather events for current and previous weeks
    const A0_events = eventsByWeek.get(currentWeekStart) || []
    const A1_events = eventsByWeek.get(prevWeekStart) || []

    // Calculate A0 and A1 averages
    const A0_avg =
      A0_events.length > 0
        ? weightedAverageWithMajorScore(A0_events, weekSentiment)
        : 0

    const A1_avg =
      A1_events.length > 0
        ? weightedAverageWithMajorScore(A1_events, weekSentiment)
        : 0

    // Determine A2 scenario:
    // If both A0 and A1 are empty, we use A2 = weekSentiment
    const A2_avg =
      A0_events.length === 0 && A1_events.length === 0 ? weekSentiment : 0

    // Identify active sets
    const activeSets: Array<keyof typeof BASE_WEIGHTS> = []
    if (A0_avg !== 0) activeSets.push('A0')
    if (A1_avg !== 0) activeSets.push('A1')
    if (A2_avg !== 0) activeSets.push('A2')

    if (activeSets.length === 0) {
      activeSets.push('A2')
    }

    // Sum of base weights of active sets
    const sumActiveWeights = activeSets.reduce((sum, setKey) => {
      return sum + BASE_WEIGHTS[setKey]
    }, 0)

    // Re-normalize weights
    const normalizedWeights: Record<keyof typeof BASE_WEIGHTS, number> = {
      A0: 0,
      A1: 0,
      A2: 0,
    }

    activeSets.forEach((setKey) => {
      normalizedWeights[setKey] = BASE_WEIGHTS[setKey] / sumActiveWeights
    })

    // Calculate the weighted sentiment using normalized weights
    const weightedSentiment =
      normalizedWeights.A0 * A0_avg +
      normalizedWeights.A1 * A1_avg +
      normalizedWeights.A2 * A2_avg

    weightedData[weekStart] = weightedSentiment
  })

  // Convert weightedData into an array for smoothing
  const dataPoints = Object.entries(weightedData)
    .map(
      ([weekStr, value]) =>
        [new Date(weekStr).getTime(), value] as [number, number]
    )
    .sort((a, b) => a[0] - b[0]) // sort by time

  const smoothedData = loessSmoothing(dataPoints, { span })

  // Convert back to object
  const smoothedWeightedData: WeightedData = {}
  smoothedData.forEach(([x, y]) => {
    const dateStr = new Date(x).toISOString()
    smoothedWeightedData[dateStr] = y
  })

  return smoothedWeightedData
}

function weightedAverageWithMajorScore(
  events: MajorEventType[],
  weekSentiment: number
): number {
  let totalWeight = 0
  let weightedSum = 0

  for (const event of events) {
    const score = event.major_score || 0
    const evSentiment = event.sentiment || weekSentiment
    weightedSum += score * evSentiment
    totalWeight += score
  }

  return totalWeight === 0 ? 0 : weightedSum / totalWeight
}

interface LoessOptions {
  span?: number // fraction of data (0 < span <= 1) to use in each local regression
}

/**
 * A basic LOESS smoothing function.
 * data: array of [x, y] pairs sorted by x.
 * options: { span: number } fraction of points to consider at each x.
 */
function loessSmoothing(
  data: [number, number][],
  options: LoessOptions = {}
): [number, number][] {
  const span = Math.min(Math.max(options.span ?? 0.3, 0.01), 1) // ensure span is between 0.01 and 1
  const n = data.length
  const smoothed: [number, number][] = []
  if (n === 0) return smoothed
  if (n === 1) return [[data[0][0], data[0][1]]]

  const k = Math.max(2, Math.floor(span * n)) // at least 2 points

  for (let i = 0; i < n; i++) {
    const x0 = data[i][0]

    // Find the k closest points to x0
    const distances = data.map(([x]) => Math.abs(x - x0))
    // Create an array of indices to sort
    const indices = distances.map((_, idx) => idx)
    indices.sort((ia, ib) => distances[ia] - distances[ib])

    // Select the k nearest neighbors
    const neighbors = indices.slice(0, k)
    // max distance among these k neighbors
    const maxDist = distances[neighbors[neighbors.length - 1]]

    // Compute tri-cube weights
    let sumW = 0,
      sumWX = 0,
      sumWY = 0,
      sumWXX = 0,
      sumWXY = 0
    for (const idx of neighbors) {
      const [xj, yj] = data[idx]
      const dist = Math.abs(xj - x0)
      let w = 1
      if (maxDist > 0) {
        const ratio = dist / maxDist
        // Tri-cube weighting
        const wFactor = (1 - ratio ** 3) ** 3
        w = wFactor
      }
      const xv = xj - x0 // center x around x0
      // Accumulate sums for weighted regression
      sumW += w
      sumWX += w * xv
      sumWY += w * yj
      sumWXX += w * xv * xv
      sumWXY += w * xv * yj
    }

    // Solve weighted linear regression:
    // [sumW   sumWX ] [a] = [sumWY]
    // [sumWX  sumWXX] [b]   [sumWXY]
    const denom = sumW * sumWXX - sumWX * sumWX
    let a, b
    if (Math.abs(denom) < 1e-12) {
      // Degenerate case, revert to weighted average
      a = sumWY / sumW
      b = 0
    } else {
      a = (sumWY * sumWXX - sumWX * sumWXY) / denom
      b = (sumW * sumWXY - sumWX * sumWY) / denom
    }

    // Predicted value at x0 is a + b*0 = a
    const yHat = a
    smoothed.push([x0, yHat])
  }

  smoothed.sort((a, b) => a[0] - b[0])
  return smoothed
}
