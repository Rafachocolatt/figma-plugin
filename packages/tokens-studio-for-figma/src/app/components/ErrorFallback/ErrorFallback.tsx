import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heading } from '@tokens-studio/ui';
import { styled } from '@/stitches.config';
import Stack from '../Stack';
import Text from '../Text';

const StyledLink = styled('a', {
  color: '$accentDefault',
  textDecoration: 'underline',
});

export function ErrorFallback({ error }: { error: Error }) {
  const { t } = useTranslation(['errors']);

  return (
    <Stack direction="column" align="center" gap={4} justify="center" css={{ padding: '$4', height: '100%', textAlign: 'center' }}>
      <Heading>{t('wentWrong')}</Heading>
      <Stack direction="column" gap={3}>
        <Text size="xsmall" muted>{error.message}</Text>
        <Text size="xsmall" muted>{t('restart')}</Text>
        <Text size="xsmall" muted>
          {t('reset')}
          {' '}
          <StyledLink href="https://docs.tokens.studio/reset-tokens" target="_blank" rel="noreferrer">{t('readHow')}</StyledLink>
        </Text>

      </Stack>
    </Stack>
  );
}
