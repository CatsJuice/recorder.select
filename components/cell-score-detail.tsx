'use client';

import { useMemo } from 'react';
import { useI18n } from '../lib/i18n';
import { createFieldScoreEvaluator } from '../lib/recorder-scoring';
import { fieldDefinitions, fieldGroups, recorders } from '../lib/recorders';
import { performanceFields, type PerformanceProfiles } from '../lib/performance';

const format = (value: number) => String(Number(value.toFixed(6)));

export function CellScoreDetail({ fieldKey, productId, weight, profiles, status }: {
  fieldKey: string; productId: string; weight: number; profiles: PerformanceProfiles;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}) {
  const { t, fieldLabel, groupLabel } = useI18n();
  const field = fieldDefinitions.find(field => field.key === fieldKey);
  const product = recorders.find(product => product.id === productId);
  const detail = useMemo(() => field && product ? createFieldScoreEvaluator(recorders, field, profiles)(product) : undefined, [field, product, profiles]);
  if (!field || !detail) return null;
  const path = [fieldLabel(field)];
  let group = fieldGroups.find(group => group.key === field.group);
  while (group) {
    path.unshift(groupLabel(group));
    group = fieldGroups.find(candidate => candidate.key === group?.parentKey);
  }
  if (performanceFields[fieldKey] && status !== 'loaded') return <section className="cell-score-breakdown"><p>{t(status === 'error' ? 'performanceLoadFailed' : 'performanceLoading')}</p></section>;
  const rank = detail.ranking;
  return <section className="cell-score-breakdown" aria-label={t('scoreContribution')}>
    <p className="cell-score-path">{path.join(' › ')}</p>
    {detail.reason === 'notScored' ? <p>{t('notScored')}</p> : <>
      <div className="cell-score-total"><span>{t('scoreContribution')}</span><strong>{format(detail.base * weight)}</strong></div>
      <p>{t('scoreFormula')}</p>
      <code>{format(detail.base)} × {format(weight)} = {format(detail.base * weight)}</code>
      {rank && <>
        <p>{t('scoreRanking', { rank: rank.rank, participants: rank.participants, direction: t(rank.lowerIsBetter ? 'scoreLower' : 'scoreHigher') })}</p>
        <p>{t('scoreRankPosition', { position: rank.ascendingRank, distinct: rank.distinct })}</p>
      </>}
      <p>{t(detail.reason)}</p>
      {detail.formula && <code>{t('scoreBase')} = {detail.formula}</code>}
      {rank && <p className="cell-score-note">{t('scoreRankScope')}</p>}
    </>}
  </section>;
}
