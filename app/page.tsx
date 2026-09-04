'use client';

import Link from 'next/link';
import { Drawer } from '@base-ui/react/drawer';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { SortRule, TableToolbar } from '../components/table-toolbar';
import { ThemeToggle } from '../components/theme-toggle';
import { LocalChatWidget } from '../components/local-chat-widget';
import { LanguageSwitcher } from '../components/language-switcher';
import { CanvasComparisonTable } from '../components/canvas-comparison-table';
import { useI18n } from '../lib/i18n';
import { calculateRecorderScore, createScoreContributions } from '../lib/recorder-scoring';
import { fieldDefinitions, fieldGroups, recorders, type FieldDefinition } from '../lib/recorders';
import { loadPerformanceProfiles, performanceFields, performanceValue, type PerformanceProfiles } from '../lib/performance';

const filterableFields = fieldDefinitions.filter((field) => field.type === 'boolean' || field.type === 'select' || field.type === 'multiselect');
const defaultFilters = Object.fromEntries(filterableFields.map((field) => [field.key, 'any']));
const updateMetadataKeys = ['lastUpdatedAt', 'lastUpdatedVersion'] as const;
const sortableFields = fieldDefinitions.filter((field) => field.key !== 'website');
const nonWeightedFieldKeys = new Set(['name', 'website', 'score', ...updateMetadataKeys]);
const weightedFields = fieldDefinitions.filter((field) => !nonWeightedFieldKeys.has(field.key) && field.scoreable !== false);
const defaultFieldWeights = Object.fromEntries(weightedFields.map((field) => [field.key, 5]));
const fieldWeightsStorageKey = 'recorder-select:field-weights:v1';
const tableFullWidthStorageKey = 'recorder-select:table-full-width:v1';
const scoreContributions = createScoreContributions(recorders, weightedFields);

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

const updateWithTransition = (kind: 'selection' | 'compare', update: () => void) => {
  // Canvas owns layout transitions; a View Transition bitmap would cover its live frames.
  if (kind === 'compare') { update(); return; }
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
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() => ({...defaultFilters}));
  const [sortRules, setSortRules] = useState<SortRule[]>([{ id: 'score-default', key: 'score', direction: 'desc' }]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [hideIdentical, setHideIdentical] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(fieldGroups.map((group) => [group.key, group.defaultExpanded ?? true])));
  const [performanceProfiles, setPerformanceProfiles] = useState<PerformanceProfiles>({});
  const [performanceStatus, setPerformanceStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [fieldWeights, setFieldWeights] = useState<Record<string, number>>(defaultFieldWeights);
  const [fieldWeightsHydrated, setFieldWeightsHydrated] = useState(false);
  const [tableFullWidth, setTableFullWidth] = useState(false);
  const [tableFullWidthHydrated, setTableFullWidthHydrated] = useState(false);
  const [tableInitialized, setTableInitialized] = useState(false);
  const [chatHeight, setChatHeight] = useState(58);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [subjectiveReviewsExpanded, setSubjectiveReviewsExpanded] = useState(false);
  useEffect(() => {
    if ((!expandedGroups.performance && !sortRules.some(rule => performanceFields[rule.key])) || performanceStatus !== 'idle') return;
    setPerformanceStatus('loading');
    loadPerformanceProfiles()
      .then((profiles) => {
        setPerformanceProfiles(profiles);
        setPerformanceStatus('loaded');
      })
      .catch(() => {
        setPerformanceStatus('error');
      });
  }, [expandedGroups.performance, performanceStatus, sortRules]);
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
  useEffect(() => {
    try {
      setTableFullWidth(window.localStorage.getItem(tableFullWidthStorageKey) === 'true');
    } catch {
      setTableFullWidth(false);
    } finally {
      setTableFullWidthHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!tableFullWidthHydrated) return;
    document.documentElement.dataset.tableFullWidth = String(tableFullWidth);
    try {
      window.localStorage.setItem(tableFullWidthStorageKey, String(tableFullWidth));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, [tableFullWidth, tableFullWidthHydrated]);
  useEffect(() => {
    if (!tableFullWidthHydrated || !fieldWeightsHydrated) return;
    // Commit and paint restored preferences with both CSS and Canvas transitions disabled.
    // Enabling motion on the following frame must not animate the hydration itself.
    let paintedFrame = 0;
    const restoredFrame = requestAnimationFrame(() => {
      paintedFrame = requestAnimationFrame(() => setTableInitialized(true));
    });
    return () => { cancelAnimationFrame(restoredFrame); cancelAnimationFrame(paintedFrame); };
  }, [tableFullWidthHydrated, fieldWeightsHydrated]);
  const recorderScores = useMemo(() => Object.fromEntries(recorders.map((recorder) => [recorder.id, calculateRecorderScore(scoreContributions[recorder.id], weightedFields, fieldWeights)])), [fieldWeights]);
  const orderedRecorders = useMemo(() => [...recorders].sort((a,b) => {
      for (const rule of sortRules) {
        const left = rule.key === 'score' ? recorderScores[a.id] : performanceValue(performanceProfiles, a.id, rule.key) ?? a[rule.key];
        const right = rule.key === 'score' ? recorderScores[b.id] : performanceValue(performanceProfiles, b.id, rule.key) ?? b[rule.key];
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
    }), [sortRules, recorderScores, performanceProfiles]);
  const comparisonSelection = compareMode ? selected : null;
  const visible = useMemo(() => orderedRecorders
    .filter((app) => !comparisonSelection || comparisonSelection.includes(app.id))
    .filter((app) => app.name.toLowerCase().includes(query.toLowerCase()))
    .filter((app) => filterableFields.every((field) => {
      const filter = filters[field.key] ?? 'any';
      const value = performanceValue(performanceProfiles, app.id, field.key) ?? app[field.key];
      if (filter === 'any') return true;
      if (filter === 'unknown') return value === null || value === undefined;
      if (field.type === 'boolean') return typeof value === 'boolean' && value === (filter === 'yes');
      if (field.type === 'multiselect') return Array.isArray(value) && value.includes(filter);
      return field.type === 'select' && value === filter;
    })), [orderedRecorders, query, filters, comparisonSelection, performanceProfiles]);
  const identicalFieldKeys = useMemo(() => {
    const keys = new Set<FieldDefinition['key']>();
    if (!compareMode || visible.length < 2) return keys;
    fieldDefinitions.forEach((field) => {
      if (performanceFields[field.key] && performanceStatus !== 'loaded') return;
      const normalize = (value: unknown) => value === null || value === undefined ? null : Array.isArray(value) ? [...value].sort().join('|') : value;
      const firstValue = normalize(performanceValue(performanceProfiles, visible[0].id, field.key) ?? visible[0][field.key]);
      if (visible.every((app) => Object.is(normalize(performanceValue(performanceProfiles, app.id, field.key) ?? app[field.key]), firstValue))) keys.add(field.key);
    });
    return keys;
  }, [compareMode, visible, performanceProfiles, performanceStatus]);
  useEffect(() => {
    if (!compareMode) setHideIdentical(false);
  }, [compareMode]);

  const toggleCompare = (id:string) => updateWithTransition(compareMode ? 'compare' : 'selection', () => setSelected((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    if (next.length === 0) setCompareMode(false);
    return next;
  }));
  const clearSelection = () => {
    updateWithTransition(compareMode ? 'compare' : 'selection', () => {
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
  const tableBottomSafeArea = Math.max(64, chatHeight + (selected.length > 0 ? 72 : 16));
  const toggleGroup = (id: string) => {
    if (id === 'subjectiveReviews') { setSubjectiveReviewsExpanded(current => !current); return; }
    if (id === 'performance' && !expandedGroups.performance && performanceStatus === 'error') setPerformanceStatus('idle');
    setExpandedGroups(current => ({ ...current, [id]: !current[id] }));
  };

  return <Drawer.Provider>
    <Drawer.IndentBackground className="page-sheet-background" />
    <Drawer.Indent render={<main />} className="comparison-page" data-table-initializing={!tableInitialized}>
    <div className={`page-header-slot ${tableFullWidth ? 'is-hidden' : ''}`} aria-hidden={tableFullWidth} inert={tableFullWidth}>
      <nav className="nav shell"><Link className="brand" href="/" aria-label="Recorder Select"><img className="brand-mark" src="/recorder-select.svg" alt="" /><span className="brand-name">Recorder Select</span></Link><div className="nav-links"><LanguageSwitcher /><ThemeToggle /><Link className="submit-link" href="/submit">{t('addRecorder')} <span aria-hidden="true">↗</span></Link></div></nav>
    </div>
    <section className={`workspace shell t-resize ${tableFullWidth ? 'workspace-full-width' : ''}`} id="compare">
      <TableToolbar query={query} onQueryChange={setQuery} filterFields={filterableFields} filters={filters} onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))} sortableFields={sortableFields} sortRules={sortRules} onSortRulesChange={setSortRules} fullWidth={tableFullWidth} onFullWidthChange={setTableFullWidth} />
      <CanvasComparisonTable animationsEnabled={tableInitialized} products={visible} scores={recorderScores} selected={selected} compareMode={compareMode} hideIdentical={hideIdentical} identicalFieldKeys={identicalFieldKeys} expandedGroups={expandedGroups} subjectiveReviewsExpanded={subjectiveReviewsExpanded} performanceProfiles={performanceProfiles} performanceStatus={performanceStatus} fieldWeights={fieldWeights} bottomSafeArea={tableBottomSafeArea} onToggleProduct={toggleCompare} onToggleGroup={toggleGroup} onWeightChange={(key, weight) => setFieldWeights(current => ({ ...current, [key]: weight }))} onResetWeights={() => setFieldWeights({ ...defaultFieldWeights })} />
    </section>
    <div className={`compare-dock-shell t-resize ${chatExpanded?'chat-expanded':''} ${selected.length===0?'is-empty':''}`}>{selected.length>0&&<div className="compare-dock" style={{bottom:chatHeight+8}}><div className="compare-dock-summary"><div className="compare-avatars">{displayedSelection.map((id)=>{const app=recorders.find((item)=>item.id===id)!;return <span key={id} style={{background:app.icon ? 'transparent' : app.accent,viewTransitionName:`compare-avatar-${id}`}}>{app.icon ? <img src={app.icon} alt="" /> : app.name[0]}</span>})}{overflowSelectionCount>0&&<span className="avatar-overflow" style={{viewTransitionName:'compare-avatar-overflow'}}>+{overflowSelectionCount}</span>}</div>{compareMode?<label className="hide-identical-control"><input type="checkbox" checked={hideIdentical} onChange={(event)=>setHideIdentical(event.target.checked)} /><span>{t('hideIdentical')}</span></label>:<p><strong>{t('selected',{count:selected.length})}</strong><small>{t('ready')}</small></p>}</div><div className="compare-dock-actions"><button className="clear-selection" onClick={clearSelection}>{t('clear')}</button><button className={`compare-action ${compareMode?'exit':''}`} aria-pressed={compareMode} onClick={()=>setCompareMode((current)=>!current)}>{compareMode?t('exitComparison'):t('compareSelected')}</button></div></div>}</div>
    <LocalChatWidget recorderScores={recorderScores} onHeightChange={setChatHeight} onExpandedChange={setChatExpanded} onUpdateComparison={updateComparisonFromChat} onUpdateSort={updateSortFromChat} onUpdateFilters={updateFiltersFromChat} />
  </Drawer.Indent>
  </Drawer.Provider>;
}
