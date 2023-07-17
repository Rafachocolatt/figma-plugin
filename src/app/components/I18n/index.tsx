import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
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

  let langs = [...languages];
  if (process.env.ENVIRONMENT === 'development') {
    langs = [...languages, { code: 'debug', title: 'DEBUG' }];
  }

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
          color: '$textMuted',
          '&:hover, &:focus-visible': { backgroundColor: '$bgSubtle' },
        }}
        data-testid="choose-language"
      >
        {langs.find((l) => l.code === currentLang)?.title}
        <IconChevronDown />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top">
        <DropdownMenuRadioGroup value={currentLang} onValueChange={handleValueChange}>
          {langs.map((lang) => (

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
