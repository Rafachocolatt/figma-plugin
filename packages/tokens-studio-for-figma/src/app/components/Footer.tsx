import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { DownloadIcon, UploadIcon } from '@primer/octicons-react';
import { useTranslation } from 'react-i18next';
import { WarningTriangleSolid } from 'iconoir-react';
import { IconButton } from '@tokens-studio/ui';
import * as pjs from '../../../package.json';
import Box from './Box';
import Stack from './Stack';
import BranchSelector from './BranchSelector';
import useRemoteTokens from '../store/remoteTokens';
import {
  localApiStateSelector,
  editProhibitedSelector,
  storageTypeSelector,
  usedTokenSetSelector,
  projectURLSelector,
  activeThemeSelector,
  tokensSelector,
} from '@/selectors';
import DocsIcon from '@/icons/docs.svg';
import RefreshIcon from '@/icons/refresh.svg';
import FeedbackIcon from '@/icons/feedback.svg';
import Tooltip from './Tooltip';
import { StorageProviderType } from '@/constants/StorageProviderType';
import { isGitProvider } from '@/utils/is';
import IconLibrary from '@/icons/library.svg';
import ProBadge from './ProBadge';
import { transformProviderName } from '@/utils/transformProviderName';
import { DirtyStateBadgeWrapper } from './DirtyStateBadgeWrapper';
import { useChangedState } from '@/hooks/useChangedState';
import { docUrls } from '@/constants/docUrls';
import { TokenFormatBadge } from './TokenFormatBadge';
import ResolveDuplicateTokensModal from './modals/ResolveDuplicateTokensModal';

export default function Footer() {
  const [hasRemoteChange, setHasRemoteChange] = useState(false);
  const storageType = useSelector(storageTypeSelector);
  const editProhibited = useSelector(editProhibitedSelector);
  const localApiState = useSelector(localApiStateSelector);
  const usedTokenSet = useSelector(usedTokenSetSelector);
  const projectURL = useSelector(projectURLSelector);
  const { pullTokens, pushTokens, checkRemoteChange } = useRemoteTokens();
  const { t } = useTranslation(['footer', 'licence']);
  const activeTheme = useSelector(activeThemeSelector);
  const { hasChanges } = useChangedState();
  const tokens = useSelector(tokensSelector);
  const [showResolveDuplicateTokensModal, setShowResolveDuplicateTokensModal] = React.useState<boolean>(false);

  const hasDuplicates = useMemo(
    () => Object.keys(tokens).some((setName) => {
      const currentSetTokens = tokens[setName];
      const seenNames = new Set();

      return currentSetTokens.some((token) => {
        if (seenNames.has(token.name)) {
          return true;
        }
        seenNames.add(token.name);
        return false;
      });
    }),
    [tokens],
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      checkRemoteChange().then((response: boolean) => {
        setHasRemoteChange(response);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [checkRemoteChange]);

  const onPushButtonClicked = React.useCallback(() => pushTokens(), [pushTokens]);
  const onPullButtonClicked = React.useCallback(() => pullTokens({ usedTokenSet, activeTheme }), [pullTokens, usedTokenSet, activeTheme]);
  const handlePullTokens = useCallback(() => {
    pullTokens({ usedTokenSet, activeTheme });
  }, [pullTokens, usedTokenSet, activeTheme]);

  const handleResolveDuplicateTokensModalClose = React.useCallback(() => {
    setShowResolveDuplicateTokensModal(false);
  }, []);

  const handleResolveDuplicateOpen = React.useCallback(() => {
    setShowResolveDuplicateTokensModal(true);
  }, []);

  return (
    <Box
      css={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        padding: '$3',
        borderTop: '1px solid $borderMuted',
      }}
    >

      <Stack direction="row" align="center" gap={2}>
        {((isGitProvider(localApiState) && localApiState.branch) || storageType.provider === StorageProviderType.SUPERNOVA) && (
          <>
            <BranchSelector />
            <TokenFormatBadge />
            <DirtyStateBadgeWrapper badge={hasRemoteChange}>
              <IconButton
                data-testid="footer-pull-button"
                icon={<DownloadIcon />}
                onClick={onPullButtonClicked}
                variant="invisible"
                size="small"
                tooltipSide="top"
                tooltip={
                  t('pullFrom', {
                    provider: transformProviderName(storageType.provider),
                  }) as string
                }
              />
            </DirtyStateBadgeWrapper>
            <DirtyStateBadgeWrapper badge={hasChanges}>
              <IconButton
                data-testid="footer-push-button"
                icon={<UploadIcon />}
                onClick={onPushButtonClicked}
                variant="invisible"
                size="small"
                tooltipSide="top"
                disabled={editProhibited || !hasChanges}
                tooltip={
                  t('pushTo', {
                    provider: transformProviderName(storageType.provider),
                  }) as string
                }
              />
            </DirtyStateBadgeWrapper>
          </>
        )}
        {storageType.provider !== StorageProviderType.LOCAL
          && storageType.provider !== StorageProviderType.GITHUB
          && storageType.provider !== StorageProviderType.GITLAB
          && storageType.provider !== StorageProviderType.ADO
          && storageType.provider !== StorageProviderType.BITBUCKET
          && storageType.provider !== StorageProviderType.SUPERNOVA
          ? (
            <Stack align="center" direction="row" gap={2}>
              {storageType.provider === StorageProviderType.JSONBIN && (
                <Tooltip label={t('goTo', {
                  provider: transformProviderName(storageType.provider),
                }) as string}
                >
                  <IconButton icon={<IconLibrary />} href={projectURL} />
                </Tooltip>
              )}
              <IconButton
                tooltip={t('pullFrom', {
                  provider: transformProviderName(storageType.provider),
                }) as string}
                onClick={handlePullTokens}
                variant="invisible"
                size="small"
                icon={<RefreshIcon />}
              />
            </Stack>
          ) : null}
      </Stack>
      <Stack direction="row" gap={4} align="center">
        <Box css={{ color: '$fgMuted', fontSize: '$xsmall' }}>
          <a href="https://tokens.studio/changelog" target="_blank" rel="noreferrer">{`V ${pjs.version}`}</a>
        </Box>
        <Stack direction="row" gap={1}>
          {hasDuplicates && (
            <IconButton
              onClick={handleResolveDuplicateOpen}
              icon={<WarningTriangleSolid />}
              data-testid="resolve-duplicate-modal-open-button"
              variant="invisible"
              size="small"
              tooltip="Duplicate Warning"
            />
          )}
          <ProBadge />
          <IconButton
            as="a"
            href={docUrls.root}
            icon={<DocsIcon />}
            variant="invisible"
            size="small"
            tooltip={t('docs') as string}
            target="_blank"
          />
          <IconButton
            as="a"
            href="https://github.com/tokens-studio/figma-plugin"
            icon={<FeedbackIcon />}
            variant="invisible"
            size="small"
            tooltip={t('feedback') as string}
            target="_blank"
          />
        </Stack>
      </Stack>
      {showResolveDuplicateTokensModal && (
        <ResolveDuplicateTokensModal
          isOpen={showResolveDuplicateTokensModal}
          onClose={handleResolveDuplicateTokensModalClose}
        />
      )}
    </Box>
  );
}
