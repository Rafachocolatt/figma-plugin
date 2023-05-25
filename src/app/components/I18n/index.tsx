import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { Trans } from 'react-i18next';
import { Dispatch } from '@/app/store';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../DropdownMenu';
import { IconChevronDown } from '@/icons';
import { languages } from '@/i18n';
import { languageSelector } from '@/selectors';
import { track } from '@/utils/analytics';

export const LanguageSelector = () => {
  const dispatch = useDispatch<Dispatch>();

  const currentLang = useSelector(languageSelector);

  const handleValueChange = React.useCallback(
    (value: string) => {
      track('setLanguage', { value });
      dispatch.settings.setLanguage(value);
    },
    [dispatch.settings],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          color: '$onInteraction',
          '&:hover, &:focus-visible': { backgroundColor: '$bgSubtle' },
        }}
        data-testid="choose-language"
      >
        <Trans>Lang</Trans>
        {' '}
        -
        {' '}
        {currentLang}
        <IconChevronDown />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top">
        <DropdownMenuRadioGroup value={currentLang} onValueChange={handleValueChange}>
          {languages.map((lang) => (

            <DropdownMenuRadioItem
              key={lang.code}
              value={lang.code}
              data-testid="apply-to-selection"
            >
              {lang.title}
            </DropdownMenuRadioItem>
          ))}

        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
