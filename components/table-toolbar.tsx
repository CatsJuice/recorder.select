'use client';

import type { CSSProperties, ReactNode, RefObject } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDownWideShort, faBars, faCheck, faChevronDown, faChevronRight, faCompress, faExpand, faFilter, faMagnifyingGlass, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { fieldGroups, type FieldDefinition } from '../lib/recorders';
import { useI18n } from '../lib/i18n';

const fieldGroupDepth = (groupKey: FieldDefinition['group']) => {
  let depth = 0;
  let group = fieldGroups.find((item) => item.key === groupKey);
  while (group?.parentKey) {
    depth += 1;
    group = fieldGroups.find((item) => item.key === group?.parentKey);
  }
  return depth;
};

const defaultSortDirection = (field: FieldDefinition): SortDirection =>
  field.type === 'boolean' && field.booleanBest === false ? 'asc'
    : field.type === 'boolean' || field.type === 'select' || field.type === 'multiselect' || field.higherIsBetter ? 'desc' : 'asc';

export type SortDirection = 'asc' | 'desc';
export type SortRule = {
  id: string;
  key: FieldDefinition['key'];
  direction: SortDirection;
};

type TableToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filterFields: FieldDefinition[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  sortableFields: FieldDefinition[];
  sortRules: SortRule[];
  onSortRulesChange: (rules: SortRule[]) => void;
  fullWidth: boolean;
  onFullWidthChange: (fullWidth: boolean) => void;
};

type SortableRuleItemProps = {
  rule: SortRule;
  index: number;
  sortableFields: FieldDefinition[];
  sortRules: SortRule[];
  reducedMotion: boolean;
  mobile: boolean;
  onUpdate: (id: string, patch: Partial<SortRule>) => void;
  onRemove: (id: string) => void;
};

type FieldMenuPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

function GroupedFieldSelect({ rule, index, sortableFields, sortRules, onUpdate, mobile }: Pick<SortableRuleItemProps, 'rule' | 'index' | 'sortableFields' | 'sortRules' | 'onUpdate' | 'mobile'>) {
  const { fieldLabel, groupLabel } = useI18n();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<FieldMenuPosition | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(fieldGroups.map((group) => [group.key, group.key === 'general'])));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedField = sortableFields.find((field) => field.key === rule.key);
  const groupedFields = fieldGroups.map((group) => ({
    ...group,
    depth: fieldGroupDepth(group.key),
    fields: sortableFields.filter((field) => field.group === group.key),
  })).filter((group) => group.fields.length > 0);
  const groupIsVisible = (groupKey: string) => {
    let group = fieldGroups.find((candidate) => candidate.key === groupKey);
    while (group?.parentKey) {
      if (!expandedGroups[group.parentKey]) return false;
      group = fieldGroups.find((candidate) => candidate.key === group?.parentKey);
    }
    return true;
  };

  useEffect(() => {
    const selectedGroupKey = sortableFields.find((field) => field.key === rule.key)?.group;
    if (!selectedGroupKey) return;
    setExpandedGroups((current) => {
      const next = {...current,[selectedGroupKey]:true};
      let group = fieldGroups.find((candidate) => candidate.key === selectedGroupKey);
      while (group?.parentKey) {
        next[group.parentKey] = true;
        group = fieldGroups.find((candidate) => candidate.key === group?.parentKey);
      }
      return next;
    });
  }, [rule.key, sortableFields]);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = Math.min(320, sortableFields.length * 34 + groupedFields.length * 26 + 12);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const opensAbove = spaceBelow < Math.min(220, estimatedHeight) && rect.top > spaceBelow;
    setPosition({
      left: rect.left,
      top: opensAbove ? Math.max(12, rect.top - estimatedHeight - 6) : rect.bottom + 6,
      width: rect.width,
      maxHeight: Math.max(150, opensAbove ? rect.top - 18 : spaceBelow),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('button[aria-selected="true"]')?.focus();
    });
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnViewportChange = () => setOpen(false);
    const closeOnExternalScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnExternalScroll, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnExternalScroll, true);
    };
  }, [open]);

  if (mobile) return <select
    aria-label={`Sort priority ${index + 1} field`}
    value={rule.key}
    onChange={(event) => {
      const field = sortableFields.find((item) => item.key === event.target.value);
      if (field) onUpdate(rule.id, {key: field.key, direction: defaultSortDirection(field)});
    }}
  >
    {groupedFields.map((group) => <optgroup key={group.key} label={groupLabel(group)}>
      {group.fields.map((field) => <option key={field.key} value={field.key} disabled={sortRules.some((item) => item.id !== rule.id && item.key === field.key)}>{fieldLabel(field)}</option>)}
    </optgroup>)}
  </select>;

  return <div className="sort-field-select" ref={rootRef}>
    <button
      type="button"
      ref={triggerRef}
      className="sort-field-trigger"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={`Sort priority ${index + 1} field`}
      onClick={() => open ? setOpen(false) : openMenu()}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowDown' || open) return;
        event.preventDefault();
        openMenu();
      }}
    >
      <span>{selectedField ? fieldLabel(selectedField) : rule.key}</span>
      <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
    </button>
    {open && position && createPortal(<div
      ref={menuRef}
      className="sort-field-menu"
      role="listbox"
      aria-label={`Choose sort priority ${index + 1} field`}
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
      onKeyDown={(event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const options = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        if (options.length === 0) return;
        const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex = event.key === 'Home' ? 0
          : event.key === 'End' ? options.length - 1
          : event.key === 'ArrowDown' ? (currentIndex + 1) % options.length
          : (currentIndex - 1 + options.length) % options.length;
        options[nextIndex]?.focus();
      }}
    >
      {groupedFields.filter((group) => groupIsVisible(group.key)).map((group) => { const expanded = expandedGroups[group.key] ?? false; return <div className={`sort-field-group ${expanded ? 'is-expanded' : 'is-collapsed'}`} role="group" aria-label={groupLabel(group)} key={group.key}>
        <button type="button" className="sort-field-group-label" aria-expanded={expanded} style={{ paddingLeft: 14 + group.depth * 16 }} onClick={() => setExpandedGroups((current) => ({...current,[group.key]:!expanded}))}><FontAwesomeIcon icon={faChevronRight} aria-hidden="true" /><span>{groupLabel(group)}</span><small>{group.fields.length}</small></button>
        <div className="sort-field-group-options"><div>
        {group.fields.map((field) => {
          const selected = field.key === rule.key;
          const disabled = sortRules.some((item) => item.id !== rule.id && item.key === field.key);
          return <button
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled}
            className={selected ? 'selected' : ''}
            style={{ paddingLeft: 14 + group.depth * 16 }}
            key={field.key}
            onClick={() => {
              onUpdate(rule.id, { key: field.key, direction: defaultSortDirection(field) });
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <span>{fieldLabel(field)}</span>
            {selected && <FontAwesomeIcon icon={faCheck} aria-hidden="true" />}
          </button>;
        })}
        </div></div>
      </div>; })}
    </div>, document.body)}
  </div>;
}

function SortableRuleItem({ rule, index, sortableFields, sortRules, reducedMotion, mobile, onUpdate, onRemove }: SortableRuleItemProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
    transition: reducedMotion ? null : { duration: 250, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
  });
  const verticalTransform = transform ? { ...transform, x: 0 } : null;
  const style: CSSProperties = {
    transform: CSS.Transform.toString(verticalTransform),
    transition: reducedMotion ? undefined : transition,
    zIndex: isDragging ? 2 : undefined,
    opacity: isDragging ? 0.72 : 1,
  };

  return <div ref={setNodeRef} style={style} className={`sort-rule ${isDragging ? 'is-dragging' : ''}`}>
    <button type="button" className="drag-handle" {...attributes} {...listeners} aria-label={`${t('sort')} ${index + 1}`} title={t('sort')}><FontAwesomeIcon icon={faBars} /></button>
    <GroupedFieldSelect mobile={mobile} rule={rule} index={index} sortableFields={sortableFields} sortRules={sortRules} onUpdate={onUpdate} />
    <button type="button" className="sort-direction-toggle" aria-label={`Switch ${rule.key} sort to ${rule.direction === 'asc' ? 'descending' : 'ascending'}`} title={rule.direction === 'asc' ? 'Ascending' : 'Descending'} onClick={() => onUpdate(rule.id, {direction:rule.direction === 'asc' ? 'desc' : 'asc'})}>{rule.direction === 'asc' ? 'ASC' : 'DESC'}</button>
    <button type="button" className="remove-rule" onClick={() => onRemove(rule.id)} aria-label={`Remove ${rule.key} sort`}><FontAwesomeIcon icon={faXmark} /></button>
  </div>;
}

function ToolPanel({ mobile, open, onClose, triggerRef, title, kind, actions, children }: {
  mobile: boolean;
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  title: string;
  kind: 'filter' | 'sort';
  actions: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  if (!mobile) return open ? <div className={`tool-menu ${kind}-menu`} role="dialog" aria-label={title}>
    <div className="tool-menu-header"><strong>{title}</strong>{actions}</div>
    {children}
  </div> : null;

  return <Drawer.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} swipeDirection="down">
    <Drawer.Portal>
      <Drawer.Backdrop className="mobile-sheet-backdrop" />
      <Drawer.Viewport className="mobile-sheet-viewport">
        <Drawer.Popup className={`toolbar mobile-tool-sheet ${kind}-sheet`} finalFocus={triggerRef}>
          <div className="mobile-sheet-grabber" aria-hidden="true"><span /></div>
          <header className="mobile-sheet-header" data-base-ui-swipe-ignore>
            <Drawer.Title>{title}</Drawer.Title>
            <div className="mobile-sheet-actions">{actions}<Drawer.Close className="mobile-sheet-close" aria-label={t('close')}><FontAwesomeIcon icon={faXmark} /></Drawer.Close></div>
          </header>
          <Drawer.Content className="mobile-sheet-content" data-base-ui-swipe-ignore>{children}</Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  </Drawer.Root>;
}

export function TableToolbar({
  query,
  onQueryChange,
  filterFields,
  filters,
  onFilterChange,
  sortableFields,
  sortRules,
  onSortRulesChange,
  fullWidth,
  onFullWidthChange,
}: TableToolbarProps) {
  const { t, fieldLabel, groupLabel, optionLabel } = useI18n();
  const [mobile, setMobile] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expandedFilterGroups, setExpandedFilterGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(fieldGroups.map((group) => [group.key, group.key === 'general'])));
  const toolsRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = Object.values(filters).filter((value) => value !== 'any').length;
  const groupedFilterFields = fieldGroups.map((group) => ({
    ...group,
    depth: fieldGroupDepth(group.key),
    fields: filterFields.filter((field) => field.group === group.key),
  })).filter((group) => group.fields.length > 0);
  const filterGroupIsVisible = (groupKey: string) => {
    let group = fieldGroups.find((candidate) => candidate.key === groupKey);
    while (group?.parentKey) {
      if (!expandedFilterGroups[group.parentKey]) return false;
      group = fieldGroups.find((candidate) => candidate.key === group?.parentKey);
    }
    return true;
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (mobile) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if ((event.target as Element).closest?.('.sort-field-menu')) return;
      if (!toolsRef.current?.contains(event.target as Node)) setOpenPanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobile]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  const updateSortRule = (id: string, patch: Partial<SortRule>) => {
    onSortRulesChange(sortRules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
  };
  const handleSortEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sortRules.findIndex((rule) => rule.id === active.id);
    const newIndex = sortRules.findIndex((rule) => rule.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onSortRulesChange(arrayMove(sortRules, oldIndex, newIndex));
  };
  const addSortRule = () => {
    const nextField = sortableFields.find((field) => !sortRules.some((rule) => rule.key === field.key));
    if (!nextField) return;
    onSortRulesChange([...sortRules, { id: `${nextField.key}-${Date.now()}`, key: nextField.key, direction: defaultSortDirection(nextField) }]);
  };

  return (
    <div className="toolbar">
      <label className="search">
        <FontAwesomeIcon className="search-icon" icon={faMagnifyingGlass} aria-hidden="true" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t('search')} />
      </label>

      <div className="data-tools" ref={toolsRef}>
        <button
          type="button"
          className="icon-tool width-toggle"
          aria-label={t(fullWidth ? 'exitFullWidth' : 'fullWidth')}
          title={t(fullWidth ? 'exitFullWidth' : 'fullWidth')}
          aria-pressed={fullWidth}
          onClick={() => {
            setOpenPanel(null);
            onFullWidthChange(!fullWidth);
          }}
        >
          <FontAwesomeIcon className="tool-icon" icon={fullWidth ? faCompress : faExpand} aria-hidden="true" />
        </button>

        <div className="tool-anchor">
          <button ref={filterTriggerRef} type="button" className={`icon-tool ${activeFilterCount ? 'has-rules' : ''}`} aria-label={t('filters')} aria-expanded={openPanel === 'filter'} onClick={() => setOpenPanel((panel) => panel === 'filter' ? null : 'filter')}>
            <FontAwesomeIcon className="tool-icon filter-icon" icon={faFilter} aria-hidden="true" />
            {activeFilterCount > 0 && <span className="rule-count">{activeFilterCount}</span>}
          </button>
          <ToolPanel mobile={mobile} open={openPanel === 'filter'} onClose={() => setOpenPanel(null)} triggerRef={filterTriggerRef} title={t('filters')} kind="filter" actions={activeFilterCount > 0 && <button type="button" onClick={() => filterFields.forEach((field) => onFilterChange(field.key, 'any'))}>{t('clear')}</button>}>
            <div className="filter-list">
              {groupedFilterFields.filter((group) => filterGroupIsVisible(group.key)).map((group) => { const expanded = expandedFilterGroups[group.key] ?? false; const activeInGroup = group.fields.filter((field) => (filters[field.key] ?? 'any') !== 'any').length; return <section className={`filter-group ${expanded ? 'is-expanded' : 'is-collapsed'}`} key={group.key} style={{'--filter-group-inset':`${group.depth * 18}px`} as CSSProperties}>
                <button type="button" className="filter-group-title" aria-expanded={expanded} onClick={() => setExpandedFilterGroups((current) => ({...current,[group.key]:!expanded}))}><FontAwesomeIcon icon={faChevronRight} aria-hidden="true" /><span>{groupLabel(group)}</span>{activeInGroup > 0 && <small>{activeInGroup}</small>}</button>
                <div className="filter-group-fields" inert={!expanded}><div>
                {group.fields.map((field) => {
                  const choices = field.type === 'boolean'
                    ? [{value:'any',label:t('any')},{value:'yes',label:t('yes')},{value:'no',label:t('no')},{value:'unknown',label:t('unknown')}]
                    : [{value:'any',label:t('any')},...(field.options ?? []).map((option)=>({...option,label:optionLabel(option)})),{value:'unknown',label:t('unknown')}];
                  const activeChoiceIndex = Math.max(0, choices.findIndex((choice) => choice.value === (filters[field.key] ?? 'any')));
                  return <div className="filter-row" key={field.key}>
                    <span title={fieldLabel(field)}>{fieldLabel(field)}</span>
                    <div className={`segmented ${field.type === 'boolean' ? '' : 'option-segmented'}`} style={{'--segment-count':choices.length,'--segment-offset':`${activeChoiceIndex * 100}%`} as CSSProperties} aria-label={`${t('filters')}: ${fieldLabel(field)}`}>
                      {choices.map((choice) => <button type="button" key={choice.value} className={(filters[field.key] ?? 'any') === choice.value ? 'active' : ''} onClick={() => onFilterChange(field.key, choice.value)}>{choice.label}</button>)}
                    </div>
                  </div>;
                })}
                </div></div>
              </section>; })}
            </div>
          </ToolPanel>
        </div>

        <div className="tool-anchor">
          <button ref={sortTriggerRef} type="button" className={`icon-tool ${sortRules.length ? 'has-rules' : ''}`} aria-label={t('sort')} aria-expanded={openPanel === 'sort'} onClick={() => setOpenPanel((panel) => panel === 'sort' ? null : 'sort')}>
            <FontAwesomeIcon className="tool-icon" icon={faArrowDownWideShort} aria-hidden="true" />
            {sortRules.length > 0 && <span className="rule-count">{sortRules.length}</span>}
          </button>
          <ToolPanel mobile={mobile} open={openPanel === 'sort'} onClose={() => setOpenPanel(null)} triggerRef={sortTriggerRef} title={t('sort')} kind="sort" actions={sortRules.length > 0 && <button type="button" onClick={() => onSortRulesChange([])}>{t('clear')}</button>}>
            <div className="sort-list">
              {sortRules.length === 0 && <p className="rules-empty">{t('noSort')}</p>}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortEnd}>
                <SortableContext items={sortRules.map((rule) => rule.id)} strategy={verticalListSortingStrategy}>
                  {sortRules.map((rule, index) => <SortableRuleItem key={rule.id} rule={rule} index={index} sortableFields={sortableFields} sortRules={sortRules} reducedMotion={reducedMotion} mobile={mobile} onUpdate={updateSortRule} onRemove={(id) => onSortRulesChange(sortRules.filter((item) => item.id !== id))} />)}
                </SortableContext>
              </DndContext>
            </div>
            <button type="button" className="add-rule" disabled={sortRules.length === sortableFields.length} onClick={addSortRule}><FontAwesomeIcon icon={faPlus} />{t('addSort')}</button>
          </ToolPanel>
        </div>
      </div>
    </div>
  );
}
