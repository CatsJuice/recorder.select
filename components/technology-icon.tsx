import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSwift } from '@fortawesome/free-brands-svg-icons';

import { electronPath, tauriPath } from '../lib/technology-icon-paths';

export function TechnologyIcon({ technology }: { technology: string }) {
  const normalized = technology.trim().toLowerCase();
  if (normalized === 'native') return <FontAwesomeIcon className="technology-icon swift" icon={faSwift} aria-hidden="true" />;
  const path = normalized === 'electron' ? electronPath : normalized === 'tauri' ? tauriPath : null;
  if (!path) return null;
  return <svg className={`technology-icon ${normalized}`} viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>;
}
