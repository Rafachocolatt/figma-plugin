import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { DotsVerticalIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button, IconButton, DropdownMenu } from '@tokens-studio/ui';
import isSameCredentials from '@/utils/isSameCredentials';
import useRemoteTokens from '../store/remoteTokens';
import { storageTypeSelector } from '@/selectors';
import { StyledStorageItem } from './StyledStorageItem';
import { StorageProviderType, type StorageTypeCredentials } from '@/types/StorageType';
import { isGitProvider } from '@/utils/is';
import Box from './Box';
import useConfirm from '../hooks/useConfirm';
import { getProviderIcon } from '@/utils/getProviderIcon';
import Stack from './Stack';
import Badge from './Badge';
import useStorage from '../store/useStorage';
import { Dispatch } from '../store';

type Props = {
  item: StorageTypeCredentials;
  onEdit: () => void;
};

const StorageItem = ({ item, onEdit }: Props) => {
  const [hasErrored, setHasErrored] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const storageType = useSelector(storageTypeSelector);
  const { provider, id, name } = item;
  const branch = isGitProvider(item) ? item.branch : null;
  const { restoreStoredProvider, deleteProvider } = useRemoteTokens();
  const { confirm } = useConfirm();
  const { setStorageType } = useStorage();
  const dispatch = useDispatch<Dispatch>();

  const { t } = useTranslation(['storage']);

  const askUserIfDelete = React.useCallback(async () => {
    const shouldDelete = await confirm({
      text: t('confirmDelete') as string,
    });
    return shouldDelete;
  }, [confirm]);

  const isActive = React.useCallback(() => isSameCredentials(item, storageType), [item, storageType]);

  const handleDelete = React.useCallback(async () => {
    if (await askUserIfDelete()) {
      deleteProvider(item);
      dispatch.uiState.setLocalApiState({ provider: StorageProviderType.LOCAL });
      setStorageType({
        provider: { provider: StorageProviderType.LOCAL },
        shouldSetInDocument: true,
      });
    }
  }, [deleteProvider, item, askUserIfDelete, setStorageType, dispatch.uiState]);

  const handleRestore = React.useCallback(async () => {
    const response = await restoreStoredProvider(item);
    if (response.status === 'success') {
      setHasErrored(false);
    } else {
      setHasErrored(true);
      setErrorMessage(response?.errorMessage);
    }
  }, [item, restoreStoredProvider]);

  return (
    <StyledStorageItem
      data-testid={`storageitem-${provider}-${id}`}
      key={`${provider}-${id}`}
      active={isActive()}
    >
      <Stack
        direction="column"
        gap={1}
        css={{
          flexGrow: '1', overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          gap={3}
          css={{
            flexGrow: '1', overflow: 'hidden', maxWidth: 'stretch',
          }}
        >
          <Box css={{ color: '$fgDefault' }}>
            { getProviderIcon(provider) }
          </Box>
          <Stack direction="column" gap={0} css={{ overflow: 'hidden' }}>
            <Box css={{
              textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '$small', fontWeight: '$sansBold',
            }}
            >
              {name}
            </Box>
            <Box css={{
              whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', opacity: '0.75', fontSize: '$xsmall', maxWidth: '100%',
            }}
            >
              {id}
              {' '}
              {branch && ` (${branch})`}
            </Box>
          </Stack>
        </Stack>
        {hasErrored && isActive() && (
          <Box
            css={{
              display: 'flex', flexDirection: 'row', color: '$dangerFg', gap: '$3', marginTop: '$3',
            }}
            data-testid="error-message"
          >
            <ExclamationTriangleIcon />
            {errorMessage}
          </Box>
        )}
      </Stack>
      <Box css={{ marginRight: '$1' }}>
        {isActive() ? <Badge text={t('active')} /> : (
          <Button data-testid="button-storage-item-apply" variant="secondary" size="small" onClick={handleRestore}>
            {t('apply')}
          </Button>
        )}
      </Box>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild data-testid="storage-item-tools-dropdown">
          <IconButton icon={<DotsVerticalIcon />} variant="invisible" size="small" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content>
            <DropdownMenu.Item textValue={t('edit')} onSelect={onEdit}>{t('edit')}</DropdownMenu.Item>
            <DropdownMenu.Item textValue={t('delete')} onSelect={handleDelete}>{t('delete')}</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
    </StyledStorageItem>
  );
};

export default StorageItem;
