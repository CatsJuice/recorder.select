import './runtime';
import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import { I18nProvider } from '../lib/i18n';
createRoot(document.getElementById('root')!).render(<I18nProvider><Home /></I18nProvider>);
