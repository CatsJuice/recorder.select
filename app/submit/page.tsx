'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from '../../components/theme-toggle';
import { LanguageSwitcher } from '../../components/language-switcher';
import { useI18n } from '../../lib/i18n';
import { fieldDefinitions } from '../../lib/recorders';

type FormState = Record<string, string | boolean | string[] | null>;
const editableFieldDefinitions = fieldDefinitions.filter((field) => field.type !== 'computed');
const initialState: FormState = Object.fromEntries(editableFieldDefinitions.map((field) => [field.key, field.type === 'boolean' || field.type === 'multiselect' ? null : '']));

export default function SubmitPage() {
  const { t, fieldLabel, optionLabel } = useI18n();
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

  return <main className="submit-page">
    <nav className="nav shell"><Link className="brand" href="/"><img className="brand-mark" src="/recorder-select.svg" alt="" />Recorder Select</Link><div className="nav-page-actions"><Link className="back-link" href="/"><FontAwesomeIcon icon={faArrowLeft} /> {t('backToComparison')}</Link><LanguageSwitcher /><ThemeToggle /></div></nav>
    <div className="submit-shell shell">
      <header className="submit-header"><p className="eyebrow">{t('contribute')}</p><h1>{t('addRecorderTitle')}</h1><p>{t('submitIntro')}</p></header>
      <div className="form-layout">
        <form className="recorder-form" onSubmit={(event)=>event.preventDefault()}>
          <div className="section-label"><span>01</span><div><strong>{t('productDetails')}</strong><small>{t('pricesUsd')}</small></div></div>
          {editableFieldDefinitions.map((field) => <div className="field-row" key={field.key}>
            <label htmlFor={field.key}>{fieldLabel(field)}{field.required&&<em>{t('required')}</em>}<small>{field.description}</small></label>
            {field.type === 'boolean' ? <div className="input-wrap"><select id={field.key} value={form[field.key] === null ? '' : String(form[field.key])} onChange={(event)=>setForm((current)=>({...current,[field.key]:event.target.value === '' ? null : event.target.value === 'true'}))}><option value="">{t('unknown')}</option><option value="true">{t('yes')}</option><option value="false">{t('no')}</option></select></div>
              : field.type === 'multiselect' ? <div className="multi-select" id={field.key} role="group" aria-label={fieldLabel(field)}>{field.options?.map((option)=>{const values=Array.isArray(form[field.key]) ? form[field.key] as string[] : [];const selected=values.includes(option.value);return <button type="button" key={option.value} aria-pressed={selected} className={selected?'selected':''} onClick={()=>setForm((current)=>{const raw=current[field.key];const currentValues=Array.isArray(raw)?raw:[];return {...current,[field.key]:selected?currentValues.filter((value)=>value!==option.value):[...currentValues,option.value]};})}>{optionLabel(option)}</button>})}</div>
              : field.type === 'select' ? <div className="input-wrap"><select id={field.key} value={String(form[field.key])} onChange={(event)=>setForm((current)=>({...current,[field.key]:event.target.value}))}><option value="">{t('unknown')}</option>{field.options?.map((option)=><option key={option.value} value={option.value}>{optionLabel(option)}</option>)}</select></div>
              : field.type === 'select-text' ? <div className="input-wrap"><input id={field.key} list={`${field.key}-options`} placeholder={field.placeholder} value={String(form[field.key] ?? '')} onChange={(event)=>setForm((current)=>({...current,[field.key]:event.target.value}))}/><datalist id={`${field.key}-options`}>{field.options?.map((option)=><option key={option.value} value={option.label}/>)}</datalist></div>
              : <div className={`input-wrap ${field.type==='price'?'price-input':''}`}>{field.type==='price'&&<span>$</span>}<input id={field.key} required={field.required} type={field.type==='price'||field.type==='number'?'number':field.type} min={field.type==='price'||field.type==='number'?'0':undefined} step={field.type==='price'?'0.01':field.type==='number'?'0.1':undefined} placeholder={field.placeholder} value={String(form[field.key])} onChange={(event)=>setForm((current)=>({...current,[field.key]:event.target.value}))}/></div>}
          </div>)}
        </form>

        <aside className="output-panel">
          <div className="output-title"><div><span>02</span><strong>{t('generatedOutput')}</strong></div><div className="format-tabs"><button className={format==='json'?'active':''} onClick={()=>setFormat('json')}>JSON</button><button className={format==='prompt'?'active':''} onClick={()=>setFormat('prompt')}>Prompt</button></div></div>
          <pre>{output}</pre>
          <button className="copy-button" onClick={copy}>{copied?<span className="copy-state">{t('copied')} <FontAwesomeIcon icon={faCheck} /></span>:t('copy')}<FontAwesomeIcon icon={faCopy} /></button>
          <p className="privacy-note"><FontAwesomeIcon icon={faCircle} /> {t('privacy')}</p>
        </aside>
      </div>
    </div>
  </main>;
}
