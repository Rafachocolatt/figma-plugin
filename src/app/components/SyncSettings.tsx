/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { track } from '@/utils/analytics';
import Button from './Button';
import Heading from './Heading';
import ConfirmLocalStorageModal from './modals/ConfirmLocalStorageModal';
import StorageItem from './StorageItem';
import ProviderSelector from './StorageProviderSelector';
import EditStorageItemModal from './modals/EditStorageItemModal';
import CreateStorageItemModal from './modals/CreateStorageItemModal';
import useStorage from '../store/useStorage';
import { Dispatch } from '../store';
import { apiProvidersSelector, localApiStateSelector, storageTypeSelector } from '@/selectors';
import Stack from './Stack';
import Box from './Box';
import Text from './Text';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItemIndicator,
  DropdownMenuSeparator,
} from './DropdownMenu';
import { StorageProviderType } from '@/constants/StorageProviderType';
import useRemoteTokens from '../store/remoteTokens';
import { StorageTypeCredentials } from '@/types/StorageType';
import { useFlags } from './LaunchDarkly';
import { Flex } from './Flex';
import IconToggleableDisclosure from './IconToggleableDisclosure';

const providers = [
  {
    text: 'URL',
    type: StorageProviderType.URL,
  },
  {
    text: 'JSONBIN',
    type: StorageProviderType.JSONBIN,
  },
  {
    text: 'GitHub',
    type: StorageProviderType.GITHUB,
  },
  {
    text: 'GitLab',
    type: StorageProviderType.GITLAB,
  },
  {
    text: 'Azure DevOps',
    type: StorageProviderType.ADO,
  },
];

const SyncSettings = () => {
  const localApiState = useSelector(localApiStateSelector);
  const storageType = useSelector(storageTypeSelector);
  const apiProviders = useSelector(apiProvidersSelector);
  const dispatch = useDispatch<Dispatch>();

  const { setStorageType } = useStorage();
  const { fetchBranches } = useRemoteTokens();
  const { bitBucketSync } = useFlags();

  const [confirmModalVisible, showConfirmModal] = React.useState(false);
  const [editStorageItemModalVisible, setShowEditStorageModalVisible] = React.useState(Boolean(localApiState.new));
  const [createStorageItemModalVisible, setShowCreateStorageModalVisible] = React.useState(false);
  const [storageProvider, setStorageProvider] = React.useState(localApiState.provider);

  const setLocalBranches = React.useCallback(
    async (provider: StorageTypeCredentials) => {
      const branches = await fetchBranches(provider);
      if (branches) {
        dispatch.branchState.setBranches(branches);
      }
    },
    [dispatch.branchState, fetchBranches],
  );

  const handleEditClick = React.useCallback(
    (provider) => () => {
      track('Edit Credentials');
      dispatch.uiState.setLocalApiState(provider);
      setShowEditStorageModalVisible(true);
      setLocalBranches(provider);
    },
    [dispatch.uiState, setLocalBranches],
  );

  const handleSetLocalStorage = React.useCallback(() => {
    if (storageType?.provider !== StorageProviderType.LOCAL) {
      showConfirmModal(true);
    }
  }, [storageType?.provider]);

  const handleShowAddCredentials = React.useCallback((provider: StorageProviderType) => {
    track('Add Credentials', { provider });
    setShowCreateStorageModalVisible(true);
  }, []);

  const handleProviderClick = React.useCallback(
    (provider: StorageProviderType) => () => {
      setStorageProvider(provider);
      handleShowAddCredentials(provider);
    },
    [handleShowAddCredentials],
  );

  const handleSubmitLocalStorage = React.useCallback(() => {
    dispatch.uiState.setLocalApiState({ provider: StorageProviderType.LOCAL });
    setStorageProvider(StorageProviderType.LOCAL);
    setStorageType({
      provider: { provider: StorageProviderType.LOCAL },
      shouldSetInDocument: true,
    });
    showConfirmModal(false);
  }, [dispatch.uiState, setStorageType]);

  const handleHideStorageModal = React.useCallback(() => {
    setShowEditStorageModalVisible(false);
  }, []);

  const handleHideAddCredentials = React.useCallback(() => {
    setShowCreateStorageModalVisible(false);
  }, []);

  return (
    <Box css={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      {confirmModalVisible && (
        <ConfirmLocalStorageModal
          isOpen={confirmModalVisible}
          onToggle={showConfirmModal}
          onSuccess={handleSubmitLocalStorage}
        />
      )}
      {editStorageItemModalVisible && (
        <EditStorageItemModal
          isOpen={editStorageItemModalVisible}
          onClose={handleHideStorageModal}
          initialValue={localApiState}
          onSuccess={handleHideStorageModal}
        />
      )}
      {createStorageItemModalVisible && (
        <CreateStorageItemModal
          isOpen={createStorageItemModalVisible}
          onClose={handleHideAddCredentials}
          onSuccess={handleHideAddCredentials}
          storageProvider={storageProvider}
        />
      )}
      <Box css={{ padding: '0 $4' }}>
        <Stack gap={4} direction="column" align="start">
          <Stack gap={3} direction="column">
            <Heading size="small">Sync providers</Heading>
          </Stack>
          {apiProviders.length > 0 && (
            <Stack direction="column" gap={2} width="full" align="start">
              {/* <StorageItem
                key="localStorage"
                onEdit={handleSetLocalStorage}
              /> */}
              {apiProviders.map((item) => (
                <StorageItem
                  key={item?.internalId || `${item.provider}-${item.id}-${item.secret}`}
                  onEdit={handleEditClick(item)}
                  item={item}
                />
              ))}
            </Stack>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Flex>
                <Text size="small">Add new</Text>
              </Flex>
              <IconToggleableDisclosure />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              css={{ minWidth: '180px' }}
            >
              <DropdownMenuRadioGroup>
                {
                  providers.map((provider) => (
                    <DropdownMenuRadioItem
                      key={provider.type}
                      value={provider.type}
                      onSelect={handleProviderClick(provider.type)}
                    >
                      <DropdownMenuItemIndicator />
                      <ProviderSelector
                        text={provider.text}
                      />
                    </DropdownMenuRadioItem>
                  ))
                }
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Stack>
      </Box>
    </Box>
  );
};

export default SyncSettings;
