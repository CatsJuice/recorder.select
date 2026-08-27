'use client';

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { localeNames, locales, useI18n, type Locale } from '../lib/i18n';

export function LanguageSwitcher() {
  const {locale,setLocale,t}=useI18n();
  const [open,setOpen]=useState(false);
  const rootRef=useRef<HTMLDivElement>(null);
  const triggerRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(!open)return;
    const closeOnOutside=(event:MouseEvent)=>{if(!rootRef.current?.contains(event.target as Node))setOpen(false)};
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);triggerRef.current?.focus()}};
    document.addEventListener('mousedown',closeOnOutside);
    document.addEventListener('keydown',closeOnEscape);
    return()=>{document.removeEventListener('mousedown',closeOnOutside);document.removeEventListener('keydown',closeOnEscape)};
  },[open]);

  const choose=(next:Locale)=>{setLocale(next);setOpen(false);triggerRef.current?.focus()};

  return <div className={`language-switcher ${open?'is-open':''}`} ref={rootRef}>
    <button ref={triggerRef} type="button" className="language-trigger" aria-label={t('language')} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen((current)=>!current)}><span>{localeNames[locale]}</span><FontAwesomeIcon icon={faChevronDown} aria-hidden="true" /></button>
    {open&&<div className="language-menu" role="listbox" aria-label={t('language')}>
      {locales.map((item)=><button type="button" role="option" aria-selected={item===locale} className={item===locale?'selected':''} key={item} onClick={()=>choose(item)}>{localeNames[item]}</button>)}
    </div>}
  </div>;
}
