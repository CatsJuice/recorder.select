'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from '../../components/theme-toggle';
import { LanguageSwitcher } from '../../components/language-switcher';
import { useI18n } from '../../lib/i18n';
import { fieldDefinitions, fieldGroups, type FieldDefinition } from '../../lib/recorders';

type FormState = Record<string, string | boolean | string[] | null>;
const editableFieldDefinitions = fieldDefinitions.filter((field) => field.type !== 'computed');
const initialState: FormState = Object.fromEntries(editableFieldDefinitions.map((field) => [field.key, field.type === 'boolean' || field.type === 'multiselect' ? null : '']));
const topLevelGroups = fieldGroups.filter((group) => !group.parentKey);
const fieldsInGroup = (groupKey: string) => editableFieldDefinitions.filter((field) => field.group === groupKey);

export default function SubmitPage() {
  const { t, fieldLabel, groupLabel, optionLabel } = useI18n();
  const [form, setForm] = useState<FormState>(initialState);
  const [format, setFormat] = useState<'json' | 'prompt'>('json');
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => ({
    id: String(form.name || 'new-recorder').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    ...Object.fromEntries(editableFieldDefinitions.map((field) => {
      const value = form[field.key];
      if (field.type === 'boolean') return [field.key, typeof value === 'boolean' ? value : null];
      if (field.type === 'multiselect') return [field.key, value];
      if (field.type === 'price' || field.type === 'number') return [field.key, value === '' ? null : Number(value)];
      if (field.type === 'select') return [field.key, value === '' ? null : value];
      if (field.type === 'select-text') return [field.key, value === '' ? null : value];
      if ((field.type === 'text' || field.type === 'url' || field.type === 'date') && !field.required) return [field.key, value === '' ? null : value];
      return [field.key, value];
    })),
  }), [form]);

  const output = format === 'json'
    ? JSON.stringify(data, null, 2)
    : `Add the following screen recorder to Recorder Select. Verify the official data before publishing.\n\n${editableFieldDefinitions.map((field) => {
      const value = data[field.key];
      const displayValue = field.type === 'boolean' ? (value === null ? 'Unknown' : value ? 'Yes' : 'No') : Array.isArray(value) ? value.join(', ') || 'None' : value === '' || value === null ? 'Unknown' : value;
      return `${fieldLabel(field)}: ${displayValue}`;
    }).join('\n')}`;

  const copy = async () => { await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };

  const setValue = (key: string, value: FormState[string]) => setForm((current) => ({...current, [key]: value}));

  const renderChoiceTabs = (field: FieldDefinition, choices: { value: string; label: string }[]) => (
    <div className="choice-tabs" id={field.key} role="radiogroup" aria-labelledby={`${field.key}-label`}>
      {choices.map((choice) => {
        const selected = String(form[field.key] ?? '') === choice.value;
        return <button type="button" key={choice.value} role="radio" aria-checked={selected} className={selected ? 'selected' : ''} onClick={() => setValue(field.key, choice.value)}>{choice.label}</button>;
      })}
    </div>
  );

  const renderFieldControl = (field: FieldDefinition) => {
    const labelledBy = `${field.key}-label`;
    if (field.type === 'boolean') {
      const choices: { value: boolean | null; label: string }[] = [
        { value: null, label: t('unknown') },
        { value: true, label: t('yes') },
        { value: false, label: t('no') },
      ];
      return <div className="choice-tabs" id={field.key} role="radiogroup" aria-labelledby={labelledBy}>{choices.map((choice) => {
        const selected = form[field.key] === choice.value;
        return <button type="button" key={String(choice.value)} role="radio" aria-checked={selected} className={selected ? 'selected' : ''} onClick={() => setValue(field.key, choice.value)}>{choice.label}</button>;
      })}</div>;
    }
    if (field.type === 'multiselect') {
      return <div className="multi-select" id={field.key} role="group" aria-labelledby={labelledBy}>{field.options?.map((option) => {
        const values = Array.isArray(form[field.key]) ? form[field.key] as string[] : [];
        const selected = values.includes(option.value);
        return <button type="button" key={option.value} aria-pressed={selected} className={selected ? 'selected' : ''} onClick={() => setValue(field.key, selected ? values.filter((value) => value !== option.value) : [...values, option.value])}>{optionLabel(option)}</button>;
      })}</div>;
    }
    if (field.type === 'select') {
      const choices = [{ value: '', label: t('unknown') }, ...(field.options ?? []).map((option) => ({ value: option.value, label: optionLabel(option) }))];
      if (choices.length <= 4) return renderChoiceTabs(field, choices);
      return <div className="input-wrap"><select id={field.key} aria-labelledby={labelledBy} value={String(form[field.key])} onChange={(event) => setValue(field.key, event.target.value)}>{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></div>;
    }
    if (field.type === 'select-text') {
      const currentValue = String(form[field.key] ?? '');
      return <div className="select-text-control">
        <div className="choice-tabs compact" role="group" aria-labelledby={labelledBy}>{field.options?.map((option) => {
          const selected = currentValue.toLowerCase() === option.label.toLowerCase() || currentValue.toLowerCase() === option.value.toLowerCase();
          return <button type="button" key={option.value} aria-pressed={selected} className={selected ? 'selected' : ''} onClick={() => setValue(field.key, option.label)}>{optionLabel(option)}</button>;
        })}</div>
        <div className="input-wrap"><input id={field.key} aria-labelledby={labelledBy} placeholder={field.placeholder} value={currentValue} onChange={(event) => setValue(field.key, event.target.value)} /></div>
      </div>;
    }
    return <div className={`input-wrap ${field.type === 'price' ? 'price-input' : ''}`}>{field.type === 'price' && <span>$</span>}<input id={field.key} aria-labelledby={labelledBy} required={field.required} type={field.type === 'price' || field.type === 'number' ? 'number' : field.type} min={field.type === 'price' || field.type === 'number' ? '0' : undefined} step={field.type === 'price' ? '0.01' : field.type === 'number' ? '0.1' : undefined} placeholder={field.placeholder} value={String(form[field.key])} onChange={(event) => setValue(field.key, event.target.value)} /></div>;
  };

  const renderField = (field: FieldDefinition) => <div className="field-row" key={field.key}>
    <div className="field-label" id={`${field.key}-label`}>{fieldLabel(field)}{field.required && <em>{t('required')}</em>}{field.description && <small>{field.description}</small>}</div>
    {renderFieldControl(field)}
  </div>;

  return <main className="submit-page">
    <nav className="nav shell"><Link className="brand" href="/"><img className="brand-mark" src="/recorder-select.svg" alt="" />Recorder Select</Link><div className="nav-page-actions"><Link className="back-link" href="/"><FontAwesomeIcon icon={faArrowLeft} /> {t('backToComparison')}</Link><LanguageSwitcher /><ThemeToggle /></div></nav>
    <div className="submit-shell shell">
      <header className="submit-header"><p className="eyebrow">{t('contribute')}</p><h1>{t('addRecorderTitle')}</h1><p>{t('submitIntro')}</p></header>
      <div className="form-layout">
        <form className="recorder-form" onSubmit={(event)=>event.preventDefault()}>
          {topLevelGroups.map((group, groupIndex) => {
            const childGroups = fieldGroups.filter((candidate) => candidate.parentKey === group.key);
            return <section className="form-section" aria-labelledby={`group-${group.key}`} key={group.key}>
              <div className="section-label"><span>{String(groupIndex + 1).padStart(2, '0')}</span><div><strong id={`group-${group.key}`}>{group.key === 'general' ? t('productDetails') : groupLabel(group)}</strong>{group.key === 'pricing' && <small>{t('pricesUsd')}</small>}</div></div>
              {fieldsInGroup(group.key).map(renderField)}
              {childGroups.map((childGroup) => <section className="form-subgroup" aria-labelledby={`group-${childGroup.key}`} key={childGroup.key}>
                <div className="subgroup-label"><span aria-hidden="true" /><strong id={`group-${childGroup.key}`}>{groupLabel(childGroup)}</strong></div>
                {fieldsInGroup(childGroup.key).map(renderField)}
              </section>)}
            </section>;
          })}
        </form>

        <aside className="output-panel">
          <div className="output-title"><div><span>{String(topLevelGroups.length + 1).padStart(2, '0')}</span><strong>{t('generatedOutput')}</strong></div><div className="format-tabs"><button className={format==='json'?'active':''} onClick={()=>setFormat('json')}>JSON</button><button className={format==='prompt'?'active':''} onClick={()=>setFormat('prompt')}>Prompt</button></div></div>
          <pre>{output}</pre>
          <button className="copy-button" onClick={copy}>{copied?<span className="copy-state">{t('copied')} <FontAwesomeIcon icon={faCheck} /></span>:t('copy')}<FontAwesomeIcon icon={faCopy} /></button>
          <p className="privacy-note"><FontAwesomeIcon icon={faCircle} /> {t('privacy')}</p>
        </aside>
      </div>
    </div>
  </main>;
}
