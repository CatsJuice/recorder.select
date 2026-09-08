import './runtime';
import { createRoot } from 'react-dom/client';
import Home from '../app/comparison-page';
import { I18nProvider } from '../lib/i18n';
createRoot(document.getElementById('root')!).render(<I18nProvider><Home overview={null} /></I18nProvider>);
