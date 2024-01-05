/* eslint-disable import/prefer-default-export */
import omit from 'just-omit';
import { createModel } from '@rematch/core';
import extend from 'just-extend';
import { v4 as uuidv4 } from 'uuid';
import * as tokenStateReducers from './reducers/tokenState';
import * as tokenStateEffects from './effects/tokenState';
import parseTokenValues from '@/utils/parseTokenValues';
import { notifyToUI } from '@/plugin/notifiers';
import { replaceReferences } from '@/utils/findReferences';
import parseJson from '@/utils/parseJson';
import { TokenData } from '@/types/SecondScreen';
import updateTokensOnSources from '../updateSources';
import {
  AnyTokenList, ImportToken, SingleToken, TokenStore, TokenToRename,
} from '@/types/tokens';
import {
  DeleteTokenPayload,
  SetTokenDataPayload,
  SetTokensFromStylesPayload,
  UpdateDocumentPayload,
  UpdateTokenPayload,
  RenameTokenGroupPayload,
  DuplicateTokenGroupPayload,
  DuplicateTokenPayload,
  DeleteTokenGroupPayload,
  StyleToCreateToken,
} from '@/types/payloads';
import { updateTokenPayloadToSingleToken } from '@/utils/updateTokenPayloadToSingleToken';
import { RootModel } from '@/types/RootModel';
import { ThemeObjectsList, UsedTokenSetsMap } from '@/types';
import { TokenSetStatus } from '@/constants/TokenSetStatus';
import { isEqual } from '@/utils/isEqual';
import { StorageProviderType } from '@/constants/StorageProviderType';
import { updateTokenSetsInState } from '@/utils/tokenset/updateTokenSetsInState';
import { TokenTypes } from '@/constants/TokenTypes';
import tokenTypes from '@/config/tokenType.defs.json';
import { CompareStateType, findDifferentState } from '@/utils/findDifferentState';
import { RenameTokensAcrossSetsPayload } from '@/types/payloads/RenameTokensAcrossSets';
import { wrapTransaction } from '@/profiling/transaction';
import addIdPropertyToTokens from '@/utils/addIdPropertyToTokens';

export interface TokenState {
  tokens: Record<string, AnyTokenList>;
  stringTokens: string;
  themes: ThemeObjectsList;
  lastSyncedState: string; // @README for reference, at this time this is a JSON stringified representation of the tokens and themes ([tokens, themes])
  importedTokens: {
    newTokens: ImportToken[];
    updatedTokens: ImportToken[];
  };
  activeTheme: Record<string, string>;
  activeTokenSet: string;
  usedTokenSet: UsedTokenSetsMap;
  editProhibited: boolean;
  hasUnsavedChanges: boolean;
  collapsedTokenSets: string[];
  collapsedTokenTypeObj: Record<TokenTypes, boolean>;
  checkForChanges: boolean;
  collapsedTokens: string[];
  changedState: CompareStateType;
  remoteData: CompareStateType;
}

export const tokenState = createModel<RootModel>()({
  state: {
    tokens: {
      global: [],
    },
    stringTokens: '',
    themes: [],
    lastSyncedState: JSON.stringify([{ global: [] }, []], null, 2),
    importedTokens: {
      newTokens: [],
      updatedTokens: [],
    },
    activeTheme: {},
    activeTokenSet: 'global',
    usedTokenSet: {
      global: TokenSetStatus.ENABLED,
    },
    editProhibited: false,
    hasUnsavedChanges: false,
    collapsedTokenSets: [],
    collapsedTokenTypeObj: Object.keys(tokenTypes).reduce<Partial<Record<TokenTypes, boolean>>>((acc, tokenType) => {
      acc[tokenType as TokenTypes] = false;
      return acc;
    }, {}),
    checkForChanges: false,
    collapsedTokens: [],
    changedState: {},
    remoteData: {
      tokens: {},
      themes: [],
      metadata: null,
    },
  } as unknown as TokenState,
  reducers: {
    setStringTokens: (state, payload: string) => ({
      ...state,
      stringTokens: payload,
    }),
    setEditProhibited(state, payload: boolean) {
      return {
        ...state,
        editProhibited: payload,
      };
    },
    toggleTreatAsSource: (state, tokenSet: string) => ({
      ...state,
      usedTokenSet: {
        ...state.usedTokenSet,
        [tokenSet]: state.usedTokenSet[tokenSet] === TokenSetStatus.SOURCE
          ? TokenSetStatus.DISABLED
          : TokenSetStatus.SOURCE,
      },
    }),
    setActiveTokenSet: (state, data: string) => ({
      ...state,
      activeTokenSet: data,
    }),
    setUsedTokenSet: (state, data: UsedTokenSetsMap) => ({
      ...state,
      usedTokenSet: data,
    }),
    setThemes: (state, data: ThemeObjectsList) => ({
      ...state,
      themes: [...data],
    }),
    setNewTokenData: (state, data: TokenData['synced_data']) => ({
      ...state,
      usedTokenSet: data.usedTokenSets || state.usedTokenSet,
      themes: data.themes || state.themes,
      activeTheme: data.activeTheme || state.activeTheme,
      tokens: addIdPropertyToTokens(data.sets ?? {}) || addIdPropertyToTokens(state.tokens),
    }),
    addTokenSet: (state, name: string): TokenState => {
      if (name in state.tokens) {
        notifyToUI('Token set already exists', { error: true });
        return state;
      }

      return updateTokenSetsInState(state, null, [name]);
    },
    duplicateTokenSet: (state, newName: string, oldName: string): TokenState => {
      if (!(oldName in state.tokens)) {
        notifyToUI('Token set does not exist', { error: true });
        return state;
      }
      const indexOf = Object.keys(state.tokens).indexOf(oldName);
      return updateTokenSetsInState(
        state,
        null,
        [newName, state.tokens[oldName].map((token) => (
          extend(true, {}, token) as typeof token
        )), indexOf + 1],
      );
    },
    deleteTokenSet: (state, name: string) => updateTokenSetsInState(
      state,
      (setName, tokenSet) => (
        setName === name ? null : [setName, tokenSet]
      ),
    ),
    setLastSyncedState: (state, data: string) => ({
      ...state,
      lastSyncedState: data,
    }),
    setTokenSetOrder: (state, data: string[]) => {
      const newTokens = {};
      data.forEach((set) => {
        Object.assign(newTokens, { [set]: state.tokens[set] });
      });
      return {
        ...state,
        tokens: newTokens,
      };
    },
    resetImportedTokens: (state) => ({
      ...state,
      importedTokens: {
        newTokens: [],
        updatedTokens: [],
      },
    }),
    setJSONData(state, payload) {
      const parsedTokens = parseJson(payload);
      parseTokenValues(parsedTokens);
      const values = parseTokenValues({ [state.activeTokenSet]: parsedTokens });
      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...addIdPropertyToTokens(values),
        },
      };
    },
    setHasUnsavedChanges(state, payload: boolean) {
      return {
        ...state,
        hasUnsavedChanges: payload,
      };
    },
    setTokens: (state, newTokens: Record<string, AnyTokenList>) => ({
      ...state,
      tokens: addIdPropertyToTokens(newTokens),
    }),
    createToken: (state, data: UpdateTokenPayload) => {
      let newTokens: TokenStore['values'] = {};
      const existingToken = state.tokens[data.parent].find((n) => n.name === data.name);
      if (!existingToken) {
        newTokens = {
          [data.parent]: [
            ...state.tokens[data.parent],
            updateTokenPayloadToSingleToken(data, uuidv4()),
          ],
        };
      }

      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...newTokens,
        },
      };
    },
    duplicateToken: (state, data: DuplicateTokenPayload) => {
      const newTokens: TokenStore['values'] = {};
      Object.keys(state.tokens).forEach((tokenSet) => {
        if (tokenSet === data.parent) {
          const existingTokenIndex = state.tokens[tokenSet].findIndex((n) => n.name === data?.oldName);
          if (existingTokenIndex > -1) {
            const existingTokens = [...state.tokens[tokenSet]];
            existingTokens.splice(existingTokenIndex + 1, 0, {
              ...omit(state.tokens[tokenSet][existingTokenIndex], 'description', '$extensions'),
              ...updateTokenPayloadToSingleToken({
                parent: data.parent,
                name: data.newName,
                type: data.type,
                value: data.value,
                description: data.description,
                oldName: data.oldName,
                $extensions: data.$extensions,
              } as UpdateTokenPayload, uuidv4()),
            } as SingleToken);
            newTokens[tokenSet] = existingTokens;
          }
        } else if (data.tokenSets.includes(tokenSet)) {
          const existingTokenIndex = state.tokens[tokenSet].findIndex((n) => n.name === data?.newName);
          if (existingTokenIndex < 0) {
            const newToken = updateTokenPayloadToSingleToken({
              name: data.newName,
              type: data.type,
              value: data.value,
              description: data.description,
              $extensions: data.$extensions,
            } as UpdateTokenPayload, uuidv4());
            newTokens[tokenSet] = [
              ...state.tokens[tokenSet], newToken as SingleToken,
            ];
          }
        }
      });

      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...newTokens,
        },
      };
    },
    // Imports received styles as tokens, if needed
    setTokensFromStyles: (state, receivedStyles: SetTokensFromStylesPayload): TokenState => {
      const newTokens: StyleToCreateToken[] = [];
      const existingTokens: StyleToCreateToken[] = [];
      const updatedTokens: StyleToCreateToken[] = [];
      // Iterate over received styles and check if they existed before or need updating
      Object.values(receivedStyles).forEach((values) => {
        values.forEach((token) => {
          const oldValue = state.tokens[state.activeTokenSet].find((t) => t.name === token.name);
          if (oldValue) {
            if (isEqual(oldValue.value, token.value)) {
              if (
                oldValue.description === token.description
                || (typeof token.description === 'undefined' && oldValue.description === '')
              ) {
                existingTokens.push(token);
              } else {
                updatedTokens.push({
                  ...token,
                  oldDescription: oldValue.description,
                });
              }
            } else {
              const updatedToken = { ...token };
              updatedToken.oldValue = oldValue.value;
              updatedTokens.push(updatedToken);
            }
          } else {
            newTokens.push(token);
          }
        });
      });

      return {
        ...state,
        importedTokens: {
          newTokens,
          updatedTokens,
        },
      } as TokenState;
    },
    editToken: (state, data: UpdateTokenPayload) => {
      const nameToFind = data.oldName ? data.oldName : data.name;
      const index = state.tokens[data.parent].findIndex((token) => token.name === nameToFind);
      const newArray = [...state.tokens[data.parent]];
      newArray[index] = {
        ...omit(newArray[index], 'description'),
        ...updateTokenPayloadToSingleToken(data),
      } as SingleToken;
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [data.parent]: newArray,
        },
      };
    },
    deleteToken: (state, data: DeleteTokenPayload) => {
      const newState = {
        ...state,
        tokens: {
          ...state.tokens,
          [data.parent]: state.tokens[data.parent].filter((token) => token.name !== data.path),
        },
      };

      return newState;
    },
    deleteTokenGroup: (state, data: DeleteTokenGroupPayload) => {
      const newState = {
        ...state,
        tokens: {
          ...state.tokens,
          [data.parent]: state.tokens[data.parent].filter((token) => !(token.name.startsWith(`${data.path}.`) && token.type === data.type)),
        },
      };

      return newState;
    },

    renameTokenGroup: (state, data: RenameTokenGroupPayload) => {
      const {
        oldName, newName, type, parent,
      } = data;
      const tokensInParent = state.tokens[parent] ?? [];
      const renamedTokensInParent = tokensInParent.map((token) => {
        if (token.name.startsWith(`${oldName}.`) && token.type === type) {
          const { name, ...rest } = token;
          const newTokenName = name.replace(`${oldName}`, `${newName}`);
          return {
            ...rest,
            name: newTokenName,
          };
        }
        return token;
      }) as AnyTokenList;

      const newState = {
        ...state,
        tokens: {
          ...state.tokens,
          [parent]: renamedTokensInParent,
        },
      };
      return newState as TokenState;
    },

    duplicateTokenGroup: (state, data: DuplicateTokenGroupPayload) => {
      const {
        parent, oldName, newName, tokenSets, type,
      } = data;
      const selectedTokenGroup = state.tokens[parent].filter((token) => (token.name.startsWith(`${oldName}.`) && token.type === type));
      const newTokenGroup = selectedTokenGroup.map((token) => {
        const { name, ...rest } = token;
        const duplicatedTokenGroupName = token.name.replace(oldName, newName);
        return {
          name: duplicatedTokenGroupName,
          ...rest,
        };
      });

      const newTokens = Object.keys(state.tokens).reduce<Record<string, AnyTokenList>>((acc, key) => {
        if (tokenSets.includes(key)) {
          acc[key] = [...state.tokens[key], ...newTokenGroup];
        } else {
          acc[key] = state.tokens[key];
        }
        return acc;
      }, {});

      return {
        ...state,
        tokens: newTokens,
      };
    },
    updateAliases: (state, data: TokenToRename) => {
      const newTokens = Object.entries(state.tokens).reduce<TokenState['tokens']>(
        (acc, [key, values]) => {
          const newValues = values.map<SingleToken>((token) => {
            if (Array.isArray(token.value)) {
              return {
                ...token,
                value: token.value.map((t) => Object.entries(t).reduce<Record<string, string | number>>((a, [k, v]) => {
                  a[k] = replaceReferences(v.toString(), data.oldName, data.newName);
                  return a;
                }, {})),
              } as SingleToken;
            }
            if (typeof token.value === 'object') {
              return {
                ...token,
                value: Object.entries(token.value).reduce<Record<string, string | number>>((a, [k, v]) => {
                  a[k] = replaceReferences(v.toString(), data.oldName, data.newName);
                  return a;
                }, {}),
              } as SingleToken;
            }
            if (token.$extensions?.['studio.tokens'] && token.$extensions?.['studio.tokens'].modify && token.$extensions?.['studio.tokens'].modify.value && token.$extensions?.['studio.tokens'].modify.value.includes(data.oldName)) {
              return {
                ...token,
                $extensions: {
                  ...token.$extensions,
                  'studio.tokens': {
                    ...token.$extensions['studio.tokens'],
                    modify: {
                      ...token.$extensions['studio.tokens'].modify,
                      value: token.$extensions['studio.tokens'].modify.value.replace(data.oldName, data.newName),
                      space: token.$extensions['studio.tokens'].modify.space,
                      type: token.$extensions['studio.tokens'].modify.type,
                    },
                  },
                },
              } as SingleToken;
            }

            return {
              ...token,
              value: replaceReferences(token.value.toString(), data.oldName, data.newName),
            } as SingleToken;
          });

          acc[key] = newValues;
          return acc;
        },
        {},
      );

      return {
        ...state,
        tokens: newTokens,
      };
    },
    setCollapsedTokenSets: (state, data: string[]) => ({
      ...state,
      collapsedTokenSets: data,
    }),
    setCollapsedTokenTypeObj: (state, data: Record<TokenTypes, boolean>) => ({
      ...state,
      collapsedTokenTypeObj: data,
    }),
    updateCheckForChanges: (state, data: boolean) => ({
      ...state,
      checkForChanges: data,
    }),
    setCollapsedTokens: (state, data: string[]) => ({
      ...state,
      collapsedTokens: data,
    }),
    setChangedState: (state, receivedState: { tokens: Record<string, AnyTokenList>, themes: ThemeObjectsList }): TokenState => {
      const localState = {
        tokens: state.tokens,
        themes: state.themes,
      };
      return {
        ...state,
        changedState: findDifferentState(localState, receivedState),
      } as TokenState;
    },
    resetChangedState: (state) => ({
      ...state,
      changedState: {
        tokens: {},
        themes: [],
      },
    }),
    setRemoteData: (state, data: CompareStateType): TokenState => ({
      ...state,
      remoteData: data,
    }),
    renameTokenAcrossSets: (state, data: RenameTokensAcrossSetsPayload) => {
      const {
        oldName, newName, type, tokenSets,
      } = data;
      const newTokens: TokenStore['values'] = {};
      Object.keys(state.tokens).forEach((tokenSet) => {
        if (tokenSets.includes(tokenSet)) {
          const existingTokenIndex = state.tokens[tokenSet].findIndex((n) => n.name === oldName && n.type === type);
          if (existingTokenIndex > -1) {
            const existingTokens = [...state.tokens[tokenSet]];
            existingTokens.splice(existingTokenIndex, 1, {
              ...state.tokens[tokenSet][existingTokenIndex],
              name: newName,
            } as SingleToken);
            newTokens[tokenSet] = existingTokens;
          }
        }
      });

      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...newTokens,
        },
      };
    },
    ...tokenStateReducers,
  },
  effects: (dispatch) => ({
    editToken(payload: UpdateTokenPayload, rootState) {
      if (payload.oldName && payload.oldName !== payload.name) {
        dispatch.tokenState.updateAliases({ oldName: payload.oldName, newName: payload.name });
      }

      if (payload.shouldUpdate && rootState.settings.updateMode !== 'document') {
        dispatch.tokenState.updateDocument({ shouldUpdateNodes: rootState.settings.updateOnChange });
      }
    },
    deleteToken() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    deleteTokenGroup() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    addTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    duplicateTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    duplicateTokenGroup() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    renameTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    deleteTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    setTokenSetOrder() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    setTokenData(payload: SetTokenDataPayload) {
      if (payload.shouldUpdate) {
        dispatch.tokenState.updateDocument();
      }
    },
    toggleUsedTokenSet() {
      dispatch.tokenState.updateDocument({ updateRemote: false });
    },
    toggleManyTokenSets() {
      dispatch.tokenState.updateDocument({ updateRemote: false });
    },
    toggleTreatAsSource() {
      dispatch.tokenState.updateDocument({ updateRemote: false });
    },
    duplicateToken() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    createToken() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    renameTokenGroup(data: RenameTokenGroupPayload, rootState) {
      const {
        oldName, newName, type, parent,
      } = data;

      const tokensInParent = rootState.tokenState.tokens[parent] ?? [];
      tokensInParent.filter((token) => token.name.startsWith(`${newName}.`) && token.type === type).forEach((updatedToken) => {
        dispatch.tokenState.updateAliases({ oldName: updatedToken.name.replace(`${newName}`, `${oldName}`), newName: updatedToken.name });
      });
    },
    updateCheckForChanges() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false, updateRemote: false });
    },
    renameTokenAcrossSets(data: RenameTokensAcrossSetsPayload) {
      const {
        oldName, newName,
      } = data;

      dispatch.tokenState.updateAliases({ oldName, newName });
    },
    updateDocument(options?: UpdateDocumentPayload, rootState?) {
      const defaults = { shouldUpdateNodes: true, updateRemote: true };
      const params = { ...defaults, ...options };
      try {
        wrapTransaction({
          name: 'updateDocument',
          statExtractor: (result, transaction) => {
            transaction.setMeasurement('tokens', Object.entries(rootState.tokenState.tokens).reduce((acc, [, tokens]) => {
              acc += tokens.length;
              return acc;
            }, 0), '');
            transaction.setMeasurement('tokenSets', Object.keys(rootState.tokenState.tokens).length, '');
            transaction.setMeasurement('themes', rootState.tokenState.themes.length, '');
          },
        }, () => {
          updateTokensOnSources({
            tokens: params.shouldUpdateNodes ? rootState.tokenState.tokens : null,
            tokenValues: rootState.tokenState.tokens,
            usedTokenSet: rootState.tokenState.usedTokenSet,
            themes: rootState.tokenState.themes,
            activeTheme: rootState.tokenState.activeTheme,
            settings: rootState.settings,
            updatedAt: new Date().toISOString(),
            lastUpdatedAt: rootState.uiState.lastUpdatedAt ?? new Date().toISOString(),
            isLocal: rootState.uiState.storageType.provider === StorageProviderType.LOCAL,
            editProhibited: rootState.tokenState.editProhibited,
            api: rootState.uiState.api,
            storageType: rootState.uiState.storageType,
            shouldUpdateRemote: params.updateRemote && rootState.settings.updateRemote,
            checkForChanges: rootState.tokenState.checkForChanges,
            shouldSwapStyles: rootState.settings.shouldSwapStyles,
            collapsedTokenSets: rootState.tokenState.collapsedTokenSets,
            storeTokenIdInJsonEditor: rootState.settings.storeTokenIdInJsonEditor,
            dispatch,
          });
        });
      } catch (e) {
        console.error('Error updating document', e);
      }
    },
    ...Object.fromEntries(
      (Object.entries(tokenStateEffects).map(([key, factory]) => (
        [key, factory(dispatch)]
      ))),
    ),
  }),
});
