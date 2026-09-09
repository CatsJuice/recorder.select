'use client';

import { Menu } from '@base-ui/react/menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faChevronDown, faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../lib/i18n';

export function OtherToolsMenu() {
  const { t } = useI18n();

  return <Menu.Root>
    <Menu.Trigger className="language-trigger other-tools-trigger">
      <span>{t('otherTools')}</span>
      <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner className="other-tools-positioner" sideOffset={8} align="end">
        <Menu.Popup className="other-tools-menu">
          <Menu.Item className="other-tools-item" render={<a href="https://dictation.select/" target="_blank" rel="noopener noreferrer" />}>
            <FontAwesomeIcon icon={faMicrophone} aria-hidden="true" />
            <span>{t('aiDictation')}</span>
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
          </Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>;
}
