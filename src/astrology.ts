export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type Sign = (typeof SIGNS)[number];

export interface ChartEntry {
  id: string;
  name: string;
  sun: Sign;
  moon: Sign;
  rising: Sign;
  venus: Sign;
  mercury: Sign;
}

const ELEMENTS: Record<Sign, string> = {
  Aries: 'fire', Taurus: 'earth', Gemini: 'air', Cancer: 'water',
  Leo: 'fire', Virgo: 'earth', Libra: 'air', Scorpio: 'water',
  Sagittarius: 'fire', Capricorn: 'earth', Aquarius: 'air', Pisces: 'water',
};

const MODALITIES: Record<Sign, string> = {
  Aries: 'cardinal', Taurus: 'fixed', Gemini: 'mutable', Cancer: 'cardinal',
  Leo: 'fixed', Virgo: 'mutable', Libra: 'cardinal', Scorpio: 'fixed',
  Sagittarius: 'mutable', Capricorn: 'cardinal', Aquarius: 'fixed', Pisces: 'mutable',
};

const SIGN_INDEX: Record<Sign, number> = Object.fromEntries(
  SIGNS.map((s, i) => [s, i])
) as Record<Sign, number>;

export const SIGN_SYMBOLS: Record<Sign, string> = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

function signDistance(a: Sign, b: Sign): number {
  const diff = Math.abs(SIGN_INDEX[a] - SIGN_INDEX[b]);
  return Math.min(diff, 12 - diff);
}

// Score a single placement pair (0-100)
function placementScore(a: Sign, b: Sign): number {
  if (a === b) return 95;

  const dist = signDistance(a, b);
  const sameElement = ELEMENTS[a] === ELEMENTS[b];
  const sameModality = MODALITIES[a] === MODALITIES[b];

  // Trine (same element, 4 apart) - very harmonious
  if (dist === 4 && sameElement) return 90;
  // Sextile (compatible elements, 2 apart)
  if (dist === 2) return 80;
  // Conjunction (same sign already handled)
  // Opposition (6 apart) - magnetic tension
  if (dist === 6) return 60;
  // Square (3 apart, same modality) - challenging
  if (dist === 3 && sameModality) return 40;
  // Semi-sextile (1 apart) - mild friction
  if (dist === 1) return 55;
  // Quincunx (5 apart) - awkward
  if (dist === 5) return 45;

  // Fallback based on element compatibility
  const elementCompat: Record<string, string[]> = {
    fire: ['air'], earth: ['water'], air: ['fire'], water: ['earth'],
  };
  if (elementCompat[ELEMENTS[a]]?.includes(ELEMENTS[b])) return 72;

  return 50;
}

// Weighted compatibility between two charts
export function compatibility(a: ChartEntry, b: ChartEntry): number {
  const weights = { sun: 0.30, moon: 0.30, rising: 0.15, venus: 0.15, mercury: 0.10 };

  const score =
    weights.sun * placementScore(a.sun, b.sun) +
    weights.moon * placementScore(a.moon, b.moon) +
    weights.rising * placementScore(a.rising, b.rising) +
    weights.venus * placementScore(a.venus, b.venus) +
    weights.mercury * placementScore(a.mercury, b.mercury);

  return Math.round(score);
}

// Breakdown by placement
export function compatibilityBreakdown(a: ChartEntry, b: ChartEntry) {
  return {
    sun: placementScore(a.sun, b.sun),
    moon: placementScore(a.moon, b.moon),
    rising: placementScore(a.rising, b.rising),
    venus: placementScore(a.venus, b.venus),
    mercury: placementScore(a.mercury, b.mercury),
  };
}

export interface PairResult {
  personA: string;
  personB: string;
  score: number;
  breakdown: ReturnType<typeof compatibilityBreakdown>;
}

export function computeAllPairs(charts: ChartEntry[]): PairResult[] {
  const results: PairResult[] = [];
  for (let i = 0; i < charts.length; i++) {
    for (let j = i + 1; j < charts.length; j++) {
      results.push({
        personA: charts[i].name,
        personB: charts[j].name,
        score: compatibility(charts[i], charts[j]),
        breakdown: compatibilityBreakdown(charts[i], charts[j]),
      });
    }
  }
  return results;
}

export function groupScore(pairs: PairResult[]): number {
  if (pairs.length === 0) return 0;
  return Math.round(pairs.reduce((sum, p) => sum + p.score, 0) / pairs.length);
}

export interface Superlatives {
  mostCompatible: PairResult | null;
  leastCompatible: PairResult | null;
  bestSunMatch: PairResult | null;
  bestMoonMatch: PairResult | null;
  bestVenusMatch: PairResult | null;
  groupHeart: string | null;     // person with highest avg compatibility
  wildCard: string | null;       // person with most variance
}

export function computeSuperlatives(charts: ChartEntry[], pairs: PairResult[]): Superlatives {
  if (pairs.length === 0) {
    return { mostCompatible: null, leastCompatible: null, bestSunMatch: null, bestMoonMatch: null, bestVenusMatch: null, groupHeart: null, wildCard: null };
  }

  const sorted = [...pairs].sort((a, b) => b.score - a.score);
  const bestSun = [...pairs].sort((a, b) => b.breakdown.sun - a.breakdown.sun);
  const bestMoon = [...pairs].sort((a, b) => b.breakdown.moon - a.breakdown.moon);
  const bestVenus = [...pairs].sort((a, b) => b.breakdown.venus - a.breakdown.venus);

  // Per-person average
  const avgMap = new Map<string, number[]>();
  for (const c of charts) avgMap.set(c.name, []);
  for (const p of pairs) {
    avgMap.get(p.personA)?.push(p.score);
    avgMap.get(p.personB)?.push(p.score);
  }

  let groupHeart: string | null = null;
  let wildCard: string | null = null;
  let bestAvg = -1;
  let bestVariance = -1;

  for (const [name, scores] of avgMap) {
    if (scores.length === 0) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg > bestAvg) { bestAvg = avg; groupHeart = name; }
    const variance = scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length;
    if (variance > bestVariance) { bestVariance = variance; wildCard = name; }
  }

  return {
    mostCompatible: sorted[0],
    leastCompatible: sorted[sorted.length - 1],
    bestSunMatch: bestSun[0],
    bestMoonMatch: bestMoon[0],
    bestVenusMatch: bestVenus[0],
    groupHeart,
    wildCard,
  };
}
