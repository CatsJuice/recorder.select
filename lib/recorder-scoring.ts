import type { FieldDefinition, Recorder } from './recorders';
import { performanceFields, performanceValue, type PerformanceProfiles } from './performance';

export type ScoreDetail = {
  base: number;
  reason: string;
  formula?: string;
  ranking?: { rank: number; participants: number; ascendingRank: number; distinct: number; lowerIsBetter: boolean };
};

/** One evaluator supplies both the total score and its cell-level explanation. */
export function createFieldScoreEvaluator(products: Recorder[], field: FieldDefinition, profiles: PerformanceProfiles = {}) {
  const performance = performanceFields[field.key];
  const isOutlier = (product: Recorder) => !!performance && !!profiles[product.id]?.[performance.scenario]?.outlierFields?.includes(field.key);
  const readValue = (product: Recorder) => performance ? isOutlier(product) ? undefined : performanceValue(profiles, product.id, field.key) : product[field.key];
  const values = products.map(readValue).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const ranks = new Map(sorted.map((value, index) => [value, index]));
  const optionRanks = new Map(field.options?.map((option, index) => [option.value, option.rank ?? index + 1]));
  const maxRank = [...optionRanks.values()].reduce((max, rank) => Math.max(max, rank), 0);
  const detail = (base: number, reason: string, formula?: string): ScoreDetail => ({ base, reason, formula });
  const tiered = (value: number, lowerIsBetter: boolean): ScoreDetail => {
    const index = ranks.get(value);
    if (index === undefined) return detail(0, 'scoreMissing');
    const tier = sorted.length === 1 ? 0 : Math.round(index / (sorted.length - 1) * 9);
    const base = sorted.length === 1 ? 1 : lowerIsBetter ? 1 - tier / 10 : .1 + tier / 10;
    const formula = sorted.length === 1 ? '1' : `${lowerIsBetter ? '1 −' : '0.1 +'} round((${index + 1} − 1) / (${sorted.length} − 1) × 9) / 10 = ${Number(base.toFixed(10))}`;
    return { base, reason: sorted.length === 1 ? 'scoreSingleValue' : 'scoreRankRule', formula,
      ranking: { rank: 1 + values.filter(other => lowerIsBetter ? other < value : other > value).length,
        participants: values.length, ascendingRank: index + 1, distinct: sorted.length, lowerIsBetter } };
  };
  return (product: Recorder): ScoreDetail => {
    const value = readValue(product);
    if (field.scoreable === false || ['name', 'website', 'score', 'lastUpdatedAt', 'lastUpdatedVersion', 'technologyApproach'].includes(field.key)) return detail(0, 'notScored');
    if (isOutlier(product)) return detail(0, 'scoreOutlier');
    if (value == null || value === '' || (typeof value === 'number' && !Number.isFinite(value))) return detail(0, 'scoreMissing');
    if (field.type === 'price' && typeof value === 'number') return value === 0 ? detail(1, 'scoreFree') : tiered(value, true);
    if (field.key === 'appSizeMB' && typeof value === 'number') return tiered(value, true);
    if (field.key === 'platforms' && Array.isArray(value)) return detail(Math.min(value.length, 3) / 3, 'scorePlatforms', `min(${value.length}, 3) / 3`);
    if (field.key === 'requiresRegistration' && typeof value === 'boolean') return detail(value ? .5 : 1, 'scoreRegistration');
    if (field.type === 'boolean') return detail(value === true ? 1 : 0, 'scoreBoolean');
    if (field.type === 'multiselect' && Array.isArray(value)) return field.options?.length ? detail(Math.min(value.length / field.options.length, 1), 'scoreOptions', `min(${value.length} / ${field.options.length}, 1)`) : detail(0, 'notScored');
    if (field.type === 'select') return maxRank > 0 ? detail((optionRanks.get(String(value)) ?? 0) / maxRank, 'scoreSelect', `${optionRanks.get(String(value)) ?? 0} / ${maxRank}`) : detail(0, 'notScored');
    if ((field.type === 'number' || performance) && typeof value === 'number') return tiered(value, !field.higherIsBetter);
    return detail(0, 'notScored');
  };
}

/** Rank each numeric field once. Weight changes need only a dot product per product. */
export function createScoreContributions(products: Recorder[], fields: FieldDefinition[], profiles: PerformanceProfiles = {}) {
  const scorers = fields.map(field => createFieldScoreEvaluator(products, field, profiles));
  return Object.fromEntries(products.map(product => [product.id, scorers.map(score => score(product).base)]));
}

export function calculateRecorderScore(contributions: number[], fields: FieldDefinition[], weights: Record<string, number>) {
  return fields.reduce((total, field, index) => total + contributions[index] * (weights[field.key] ?? 5), 0);
}
