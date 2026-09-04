import type { FieldDefinition, Recorder } from './recorders';

/** Rank each numeric field once. Weight changes then need only a dot product per product. */
export function createScoreContributions(products: Recorder[], fields: FieldDefinition[]) {
  const scorers = fields.map(field => {
    const sorted = [...new Set(products.map(product => product[field.key]).filter((value): value is number => typeof value === 'number'))].sort((a, b) => a - b);
    const ranks = new Map(sorted.map((value, index) => [value, index]));
    const tiered = (value: number, lowerIsBetter: boolean) => {
      const index = ranks.get(value);
      if (index === undefined) return 0;
      if (sorted.length === 1) return 1;
      const tier = Math.round(index / (sorted.length - 1) * 9);
      return lowerIsBetter ? 1 - tier / 10 : .1 + tier / 10;
    };
    const optionRanks = new Map(field.options?.map((option, index) => [option.value, option.rank ?? index + 1]));
    const maxRank = [...optionRanks.values()].reduce((max, rank) => Math.max(max, rank), 0);
    return (product: Recorder) => {
      const value = product[field.key];
      if (value == null || value === '' || field.key === 'technologyApproach') return 0;
      if (field.type === 'price' && typeof value === 'number') return value === 0 ? 1 : tiered(value, true);
      if (field.key === 'appSizeMB' && typeof value === 'number') return tiered(value, true);
      if (field.key === 'platforms' && Array.isArray(value)) return Math.min(value.length, 3) / 3;
      if (field.key === 'requiresRegistration' && typeof value === 'boolean') return value ? .5 : 1;
      if (field.type === 'boolean') return value === true ? 1 : 0;
      if (field.type === 'multiselect' && Array.isArray(value)) return field.options?.length ? Math.min(value.length / field.options.length, 1) : 0;
      if (field.type === 'select') return maxRank > 0 ? (optionRanks.get(String(value)) ?? 0) / maxRank : 0;
      if (field.type === 'number' && typeof value === 'number') return tiered(value, !field.higherIsBetter);
      return 0;
    };
  });
  return Object.fromEntries(products.map(product => [product.id, scorers.map(score => score(product))]));
}

/** Sum the configurable weighted contributions. */
export function calculateRecorderScore(contributions: number[], fields: FieldDefinition[], weights: Record<string, number>) {
  return fields.reduce((total, field, index) => total + contributions[index] * (weights[field.key] ?? 5), 0);
}
