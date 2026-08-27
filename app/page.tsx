'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateLeft, faCheck, faChevronRight, faMinus } from '@fortawesome/free-solid-svg-icons';
import { faApple, faLinux, faWindows } from '@fortawesome/free-brands-svg-icons';
import { SortRule, TableToolbar } from '../components/table-toolbar';
import { ThemeToggle } from '../components/theme-toggle';
import { LocalChatWidget } from '../components/local-chat-widget';
import { LanguageSwitcher } from '../components/language-switcher';
import { useI18n } from '../lib/i18n';
import { displayDomain, fieldDefinitions, fieldGroups, recorders, type FieldDefinition, type FieldGroup, type Recorder } from '../lib/recorders';

const price = (value:number|null|undefined) => value == null ? 'Unknown' : value === 0 ? 'Free' : `$${value}`;
const platformIcons = { win: faWindows, mac: faApple, linux: faLinux } as const;
const filterableFields = fieldDefinitions.filter((field) => field.type === 'boolean' || field.type === 'select' || field.type === 'multiselect');
const defaultFilters = Object.fromEntries(filterableFields.map((field) => [field.key, 'any']));
const updateMetadataKeys = ['lastUpdatedAt', 'lastUpdatedVersion'] as const;
const sortableFields = fieldDefinitions.filter((field) => field.key !== 'website');
const nonWeightedFieldKeys = new Set(['name', 'website', 'score', ...updateMetadataKeys]);
const weightedFields = fieldDefinitions.filter((field) => !nonWeightedFieldKeys.has(field.key));
const defaultFieldWeights = Object.fromEntries(weightedFields.map((field) => [field.key, 5]));
const fieldWeightsStorageKey = 'recorder-select:field-weights:v1';
const generalComparisonFields = fieldDefinitions.filter((field) => field.group === 'general' && !nonWeightedFieldKeys.has(field.key));
const topLevelGroups = fieldGroups.filter((group) => !group.parentKey && group.key !== 'general');
const childGroupsOf = (group: FieldGroup) => fieldGroups.filter((candidate) => candidate.parentKey === group.key);
const directFieldsOf = (group: FieldGroup) => fieldDefinitions.filter((field) => field.group === group.key);
const descendantFieldsOf = (group: FieldGroup): FieldDefinition[] => [
  ...directFieldsOf(group),
  ...childGroupsOf(group).flatMap(descendantFieldsOf),
];
const tieredBase = (value: number, values: number[], lowerIsBetter: boolean) => {
  const sorted = [...new Set(values)].sort((left, right) => left - right);
  const index = sorted.indexOf(value);
  if (index < 0) return 0;
  if (sorted.length === 1) return 1;
  const tier = Math.round((index / (sorted.length - 1)) * 9);
  return lowerIsBetter ? 1 - tier / 10 : .1 + tier / 10;
};
const scoreBaseForField = (field: FieldDefinition, recorder: Recorder) => {
  const value = recorder[field.key];
  if (value === null || value === undefined || value === '') return 0;
  if (field.key === 'technologyApproach') return 0;
  if (field.type === 'price' && typeof value === 'number') {
    const knownPrices = recorders.map((item) => item[field.key]).filter((item): item is number => typeof item === 'number');
    return value === 0 ? 1 : tieredBase(value, knownPrices, true);
  }
  if (field.key === 'appSizeMB' && typeof value === 'number') {
    const knownSizes = recorders.map((item) => item.appSizeMB).filter((item): item is number => typeof item === 'number');
    return tieredBase(value, knownSizes, true);
  }
  if (field.key === 'platforms' && Array.isArray(value)) return Math.min(value.length, 3) / 3;
  if (field.key === 'requiresRegistration' && typeof value === 'boolean') return value ? .5 : 1;
  if (field.type === 'boolean') return value === true ? 1 : 0;
  if (field.type === 'multiselect' && Array.isArray(value)) return field.options?.length ? Math.min(value.length / field.options.length, 1) : 0;
  if (field.type === 'select') {
    const optionIndex = field.options?.findIndex((option) => option.value === value) ?? -1;
    const option = optionIndex >= 0 ? field.options?.[optionIndex] : undefined;
    if (!option || !field.options?.length) return 0;
    const rank = option.rank ?? optionIndex + 1;
    const maxRank = Math.max(...field.options.map((item, index) => item.rank ?? index + 1));
    return maxRank > 0 ? rank / maxRank : 0;
  }
  if (field.type === 'number' && typeof value === 'number') {
    const knownValues = recorders.map((item) => item[field.key]).filter((item): item is number => typeof item === 'number');
    return tieredBase(value, knownValues, !field.higherIsBetter);
  }
  return 0;
};
type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

const updateWithTransition = (kind: 'selection' | 'compare', update: () => void) => {
  const transitionDocument = document as TransitionDocument;
  if (!transitionDocument.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  document.documentElement.dataset.uiTransition = kind;
  const transition = transitionDocument.startViewTransition(() => flushSync(update));
  transition.finished.finally(() => delete document.documentElement.dataset.uiTransition);
};

export default function Home() {
  const { t, fieldLabel, groupLabel } = useI18n();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() => ({...defaultFilters}));
  const [sortRules, setSortRules] = useState<SortRule[]>([{ id: 'score-default', key: 'score', direction: 'desc' }]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [hideIdentical, setHideIdentical] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(fieldGroups.map((group) => [group.key, group.defaultExpanded ?? true])));
  const [fieldWeights, setFieldWeights] = useState<Record<string, number>>(defaultFieldWeights);
  const [fieldWeightsHydrated, setFieldWeightsHydrated] = useState(false);
  const [chatHeight, setChatHeight] = useState(58);
  const [chatExpanded, setChatExpanded] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(fieldWeightsStorageKey) ?? '{}') as Record<string, unknown>;
      setFieldWeights(Object.fromEntries(weightedFields.map((field) => {
        const value = stored[field.key];
        const isValid = typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10 && Number.isInteger(value * 2);
        return [field.key, isValid ? value : 5];
      })));
    } catch {
      setFieldWeights({...defaultFieldWeights});
    } finally {
      setFieldWeightsHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!fieldWeightsHydrated) return;
    try {
      window.localStorage.setItem(fieldWeightsStorageKey, JSON.stringify(fieldWeights));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, [fieldWeights, fieldWeightsHydrated]);
  const recorderScores = useMemo(() => Object.fromEntries(recorders.map((recorder) => [recorder.id, weightedFields.reduce((total, field) => total + scoreBaseForField(field, recorder) * (fieldWeights[field.key] ?? 5), 0)])), [fieldWeights]);
  const orderedRecorders = useMemo(() => [...recorders].sort((a,b) => {
      for (const rule of sortRules) {
        const left = rule.key === 'score' ? recorderScores[a.id] : a[rule.key];
        const right = rule.key === 'score' ? recorderScores[b.id] : b[rule.key];
        if (left == null && right == null) continue;
        if (left == null) return 1;
        if (right == null) return -1;
        const field = fieldDefinitions.find((candidate) => candidate.key === rule.key);
        const optionRank = (value: unknown) => field?.options?.find((option) => option.value === value)?.rank ?? 0;
        const comparison = field?.type === 'select'
          ? optionRank(left) - optionRank(right)
          : field?.type === 'multiselect'
            ? (left as unknown[]).length - (right as unknown[]).length
          : typeof left === 'string'
            ? left.localeCompare(String(right))
            : Number(left) - Number(right);
        if (comparison !== 0) return rule.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    }), [sortRules, recorderScores]);
  const visible = useMemo(() => orderedRecorders
    .filter((app) => !compareMode || selected.includes(app.id))
    .filter((app) => app.name.toLowerCase().includes(query.toLowerCase()))
    .filter((app) => filterableFields.every((field) => {
      const filter = filters[field.key] ?? 'any';
      const value = app[field.key];
      if (filter === 'any') return true;
      if (filter === 'unknown') return value === null || value === undefined;
      if (field.type === 'boolean') return typeof value === 'boolean' && value === (filter === 'yes');
      if (field.type === 'multiselect') return Array.isArray(value) && value.includes(filter);
      return field.type === 'select' && value === filter;
    })), [orderedRecorders, query, filters, compareMode, selected]);
  const visibleIds = useMemo(() => new Set(visible.map((app) => app.id)), [visible]);
  const identicalFieldKeys = useMemo(() => {
    const keys = new Set<FieldDefinition['key']>();
    if (!compareMode || visible.length < 2) return keys;
    fieldDefinitions.forEach((field) => {
      const normalize = (value: unknown) => value === null || value === undefined ? null : Array.isArray(value) ? [...value].sort().join('|') : value;
      const firstValue = normalize(visible[0][field.key]);
      if (visible.every((app) => Object.is(normalize(app[field.key]), firstValue))) keys.add(field.key);
    });
    return keys;
  }, [compareMode, visible]);
  useEffect(() => {
    if (!compareMode) setHideIdentical(false);
  }, [compareMode]);

  const toggleCompare = (id:string) => updateWithTransition('selection', () => setSelected((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    if (next.length === 0) setCompareMode(false);
    return next;
  }));
  const clearSelection = () => {
    updateWithTransition('selection', () => {
      setSelected([]);
      setCompareMode(false);
    });
  };
  const updateComparisonFromChat = (productIds: string[]) => {
    const validIds = [...new Set(productIds.filter((id) => recorders.some((recorder) => recorder.id === id)))];
    if (validIds.length === 0) return;
    updateWithTransition('compare', () => {
      setQuery('');
      setFilters({...defaultFilters});
      setSelected(validIds);
      setHideIdentical(false);
      setCompareMode(true);
    });
  };
  const updateSortFromChat = (rules: Array<{ key: string; direction: 'asc' | 'desc' }>) => {
    const validRules = rules.flatMap((rule, index) => fieldDefinitions.some((field) => field.key === rule.key)
      ? [{ id: `chat-sort-${Date.now()}-${index}`, key: rule.key as FieldDefinition['key'], direction: rule.direction }]
      : []);
    setSortRules(validRules);
  };
  const updateFiltersFromChat = (nextFilters: Array<{ key: string; value: string }>) => {
    const requested = new Map(nextFilters.filter((filter) => {
      const field = fieldDefinitions.find((candidate) => candidate.key === filter.key);
      return field?.type === 'boolean'
        ? ['yes', 'no', 'unknown'].includes(filter.value)
        : (field?.type === 'select' || field?.type === 'multiselect') && field.options?.some((option) => option.value === filter.value);
    }).map((filter) => [filter.key, filter.value]));
    setFilters(Object.fromEntries(filterableFields.map((field) => [field.key, requested.get(field.key) ?? 'any'])));
  };
  const displayedSelection = selected.length > 4 ? selected.slice(0, 3) : selected;
  const overflowSelectionCount = selected.length > 4 ? selected.length - 3 : 0;
  const productCellClass = (id: string, best = false) => ['product-column', !visibleIds.has(id) && 'column-hidden', best && visibleIds.has(id) && 'best-value'].filter(Boolean).join(' ');
  const isFieldHidden = (key: FieldDefinition['key']) => compareMode && hideIdentical && identicalFieldKeys.has(key);
  const isUpdateMetadataHidden = compareMode && hideIdentical && updateMetadataKeys.every((key) => identicalFieldKeys.has(key));
  const isGroupHidden = (fields: FieldDefinition[]) => compareMode && hideIdentical && visible.length > 1 && fields.every((field) => identicalFieldKeys.has(field.key));
  const toggleGroup = (group: FieldGroup) => setExpandedGroups((current) => ({ ...current, [group.key]: !current[group.key] }));
  const renderWeightedFieldLabel = (field: FieldDefinition) => {
    const weight = fieldWeights[field.key] ?? 5;
    return <th className="field-label-cell"><div className="field-label-line"><span>{fieldLabel(field)}</span><small>× {weight}</small></div><div className="field-weight-panel"><header><span>{t('weight')}</span><strong>{weight}</strong></header><div className="weight-anchor-labels" aria-hidden="true">{Array.from({length:11},(_,value)=><span key={value} style={{gridColumnStart:value + 1}}>{value}</span>)}</div><input type="range" min="0" max="10" step="0.5" value={weight} style={{'--weight-progress':`${weight * 10}%`} as CSSProperties} aria-label={`${fieldLabel(field)} ${t('weight')}`} onPointerUp={(event)=>event.currentTarget.blur()} onPointerCancel={(event)=>event.currentTarget.blur()} onChange={(event)=>setFieldWeights((current)=>({...current,[field.key]:Number(event.target.value)}))}/></div></th>;
  };
  const renderGroupPreview = (group: FieldGroup, app: Recorder) => {
    const preview = group.getCollapsedPreview?.(app);
    if (!preview) return null;
    if (preview.type === 'boolean') return preview.value === null || preview.value === undefined
      ? <span className="unknown-value">{t('unknown')}</span>
      : <span className={preview.value?'yes':'no'}><FontAwesomeIcon icon={preview.value?faCheck:faMinus} /></span>;
    return <span className="field-group-summary">{preview.label}</span>;
  };
  const renderFieldValue = (field: FieldDefinition, app: Recorder) => {
    const value = app[field.key];
    if (field.type === 'boolean') {
      if (value === null || value === undefined) return <span className="unknown-value">{t('unknown')}</span>;
      const supported = value === true;
      return <span className={supported?'yes':'no'}><FontAwesomeIcon icon={supported?faCheck:faMinus} /></span>;
    }
    if (field.type === 'multiselect') {
      if (!Array.isArray(value)) return <span className="unknown-value">{t('unknown')}</span>;
      const values = value as string[];
      if (values.length === 0) return '—';
      if (field.key === 'platforms') {
        const labels = values.map((item) => field.options?.find((option) => option.value === item)?.label ?? item);
        return <span className="platform-list" aria-label={labels.join(', ')}>{values.map((item) => {
          const label = field.options?.find((option) => option.value === item)?.label ?? item;
          const icon = platformIcons[item as keyof typeof platformIcons];
          return icon ? <span key={item} title={label} aria-hidden="true"><FontAwesomeIcon icon={icon} /></span> : null;
        })}</span>;
      }
      return values.join(', ');
    }
    if (field.type === 'price') return <>{price(value as number|null|undefined)}{value != null && Number(value) > 0 && field.unit && <small>{field.unit}</small>}</>;
    if (field.type === 'select') return value == null ? <span className="unknown-value">{t('unknown')}</span> : field.options?.find((option) => option.value === value)?.label ?? String(value);
    if (field.type === 'select-text') return value == null || value === '' ? <span className="unknown-value">{t('unknown')}</span> : field.options?.find((option) => option.value === String(value).toLowerCase())?.label ?? String(value);
    if (field.type === 'number') return value == null ? <span className="unknown-value">{t('unknown')}</span> : <>{String(value)}{field.unit&&<small>{field.unit}</small>}</>;
    return value == null || value === '' ? <span className="unknown-value">{t('unknown')}</span> : String(value);
  };
  const isBestValue = (field: FieldDefinition, app: Recorder) => {
    if (!compareMode || visible.length < 2) return false;
    const value = app[field.key];
    if (value === null || value === undefined) return false;
    if (field.type === 'boolean') return Boolean(value) === (field.booleanBest ?? true);
    if (field.type === 'multiselect') {
      const counts = visible.map((item) => (item[field.key] as unknown[]).length);
      return (value as unknown[]).length === Math.max(...counts);
    }
    if (field.type === 'select') {
      const rank = field.options?.find((option) => option.value === value)?.rank;
      const ranks = visible.map((item) => field.options?.find((option) => option.value === item[field.key])?.rank).filter((item): item is number => item !== undefined);
      return rank !== undefined && ranks.length > 0 && rank === Math.max(...ranks);
    }
    if (field.type === 'price' || field.type === 'number') {
      const values = visible.map((item) => item[field.key]).filter((item): item is number => typeof item === 'number');
      if (values.length === 0) return false;
      const best = field.type === 'price' || !field.higherIsBetter ? Math.min(...values) : Math.max(...values);
      return Number(value) === best;
    }
    return false;
  };
  const renderFieldRow = (field: FieldDefinition, level = 0, treeVisible = true) => {
    const fieldHidden = isFieldHidden(field.key);
    const rowVisible = treeVisible && !fieldHidden;
    return <tr key={field.key} aria-hidden={!rowVisible} className={`${level > 0 ? 'field-child-row' : ''} comparison-field-row field-level-${level} ${treeVisible?'is-expanded':'is-collapsed is-tree-collapsed'} ${fieldHidden?'is-field-hidden':''}`}>{renderWeightedFieldLabel(field)}{orderedRecorders.map((app)=><td key={app.id} data-recorder-id={app.id} aria-hidden={!visibleIds.has(app.id)} className={productCellClass(app.id,isBestValue(field,app))}>{renderFieldValue(field,app)}</td>)}</tr>;
  };
  const renderGroupRows = (group: FieldGroup, level = 0, ancestorExpanded = true) => {
    const expanded = expandedGroups[group.key];
    const directFields = directFieldsOf(group);
    const childGroups = childGroupsOf(group);
    const allFields = descendantFieldsOf(group);
    const hidden = isGroupHidden(allFields);
    const childrenVisible = ancestorExpanded && expanded && !hidden;
    return <Fragment key={group.key}>
      <tr aria-hidden={!ancestorExpanded||hidden} className={`field-group-row comparison-field-row group-level-${level} ${expanded?'is-expanded':'is-collapsed'} ${!ancestorExpanded?'is-tree-collapsed':''} ${hidden?'is-field-hidden':''}`}>
        <th><button type="button" tabIndex={ancestorExpanded&&!hidden?0:-1} className="field-group-toggle" aria-expanded={expanded} onClick={()=>toggleGroup(group)}><FontAwesomeIcon className={expanded?'expanded':''} icon={faChevronRight} aria-hidden="true" /><span>{groupLabel(group)}</span><small>{allFields.length}</small></button></th>
        {orderedRecorders.map((app)=>{const shown=visibleIds.has(app.id);const preview=group.getCollapsedPreview?.(app);const previewBest=preview?.type==='boolean'&&preview.value===true&&compareMode&&visible.length>1;return <td key={app.id} data-recorder-id={app.id} aria-hidden={!shown} className={productCellClass(app.id,previewBest)}><button type="button" tabIndex={shown&&ancestorExpanded&&!hidden?0:-1} className="field-group-cell-toggle" aria-expanded={expanded} aria-label={`${expanded?'Collapse':'Expand'} ${group.label} for ${app.name}`} onClick={()=>toggleGroup(group)}>{!expanded&&renderGroupPreview(group,app)}</button></td>})}
      </tr>
      {childGroups.map((child) => renderGroupRows(child, level + 1, childrenVisible))}
      {directFields.map((field)=>renderFieldRow(field, level + 1, childrenVisible))}
    </Fragment>;
  };

  return <main>
    <nav className="nav shell"><Link className="brand" href="/"><img className="brand-mark" src="/recorder-select.svg" alt="" />Recorder Select</Link><div className="nav-links"><LanguageSwitcher /><ThemeToggle /><Link className="submit-link" href="/submit">{t('addRecorder')} <span aria-hidden="true">↗</span></Link></div></nav>
    <section className="workspace shell" id="compare">
      <TableToolbar query={query} onQueryChange={setQuery} filterFields={filterableFields} filters={filters} onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))} sortableFields={sortableFields} sortRules={sortRules} onSortRulesChange={setSortRules} />
      <div className="table-wrap comparison-surface"><table className="comparison-table"><thead><tr><th className="feature-head"><span>{t('recorders',{count:visible.length})}</span><small>{compareMode ? t('selectedRecorders') : t('selectToCompare')}</small><button type="button" className="reset-weights" onClick={()=>setFieldWeights({...defaultFieldWeights})}><FontAwesomeIcon icon={faArrowRotateLeft} aria-hidden="true" />{t('resetWeights')}</button></th>{orderedRecorders.map((app)=>{const shown=visibleIds.has(app.id);const isSelected=selected.includes(app.id);return <th key={app.id} data-recorder-id={app.id} className={productCellClass(app.id)} aria-hidden={!shown}><div className={`select-app ${isSelected?'selected':''}`}><button type="button" tabIndex={shown?0:-1} className="select-app-hit" onClick={()=>toggleCompare(app.id)} aria-label={t('compareProduct',{name:app.name})} /><span className="check">{isSelected&&<FontAwesomeIcon icon={faCheck} />}</span><span className="app-icon" style={{background:app.icon ? 'transparent' : app.accent}}>{app.icon ? <img src={app.icon} alt="" /> : app.name[0]}</span><strong className="app-name">{app.name}</strong><a className="app-domain-link" href={app.website} target="_blank" rel="noreferrer" aria-label={t('visitWebsite',{name:app.name})}>{displayDomain(app.website)}</a><span className="app-score"><strong>{recorderScores[app.id].toFixed(1)}</strong> {t('score')}</span></div></th>})}</tr></thead><tbody>
        {generalComparisonFields.map((field) => renderFieldRow(field))}
        {topLevelGroups.map((group) => renderGroupRows(group))}
        <tr aria-hidden={isUpdateMetadataHidden} className={`comparison-field-row ${isUpdateMetadataHidden?'is-field-hidden':''}`}><th>{t('lastUpdated')}</th>{orderedRecorders.map((app)=>{const shown=visibleIds.has(app.id);const updatedAt=app.lastUpdatedAt;const version=app.lastUpdatedVersion;return <td key={app.id} data-recorder-id={app.id} aria-hidden={!shown} className={productCellClass(app.id)}><div className="last-updated-cell">{updatedAt?<time dateTime={updatedAt}>{updatedAt}</time>:<span className="unknown-value">{t('unknown')}</span>}<small>{version?t('version',{version}):t('versionUnknown')}</small></div></td>})}</tr>
      </tbody></table>{visible.length===0&&<div className="empty">{t('noMatches')}</div>}</div>
    </section>
    <div className={`compare-dock-shell t-resize ${chatExpanded?'chat-expanded':''} ${selected.length===0?'is-empty':''}`}>{selected.length>0&&<div className="compare-dock" style={{bottom:chatHeight+8}}><div className="compare-dock-summary"><div className="compare-avatars">{displayedSelection.map((id)=>{const app=recorders.find((item)=>item.id===id)!;return <span key={id} style={{background:app.icon ? 'transparent' : app.accent,viewTransitionName:`compare-avatar-${id}`}}>{app.icon ? <img src={app.icon} alt="" /> : app.name[0]}</span>})}{overflowSelectionCount>0&&<span className="avatar-overflow" style={{viewTransitionName:'compare-avatar-overflow'}}>+{overflowSelectionCount}</span>}</div>{compareMode?<label className="hide-identical-control"><input type="checkbox" checked={hideIdentical} onChange={(event)=>setHideIdentical(event.target.checked)} /><span>{t('hideIdentical')}</span></label>:<p><strong>{t('selected',{count:selected.length})}</strong><small>{t('ready')}</small></p>}</div><div className="compare-dock-actions"><button className="clear-selection" onClick={clearSelection}>{t('clear')}</button><button className={`compare-action ${compareMode?'exit':''}`} aria-pressed={compareMode} onClick={()=>setCompareMode((current)=>!current)}>{compareMode?t('exitComparison'):t('compareSelected')}</button></div></div>}</div>
    <LocalChatWidget onHeightChange={setChatHeight} onExpandedChange={setChatExpanded} onUpdateComparison={updateComparisonFromChat} onUpdateSort={updateSortFromChat} onUpdateFilters={updateFiltersFromChat} />
  </main>;
}
