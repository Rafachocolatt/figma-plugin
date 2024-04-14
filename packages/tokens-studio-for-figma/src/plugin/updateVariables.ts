import { AnyTokenList, SingleToken } from '@/types/tokens';
import { generateTokensToCreate } from './generateTokensToCreate';
import { ThemeObject } from '@/types';
import { SettingsState } from '@/app/store/models/settings';
import checkIfTokenCanCreateVariable from '@/utils/checkIfTokenCanCreateVariable';
import setValuesOnVariable from './setValuesOnVariable';
import { mapTokensToVariableInfo } from '@/utils/mapTokensToVariableInfo';
import { tokenTypesToCreateVariable } from '@/constants/VariableTypes';
import { ExportNumberVariablesTokenTypes, TokenTypes } from '@/constants/TokenTypes';

export type CreateVariableTypes = {
  collection: VariableCollection;
  mode: string;
  theme: ThemeObject;
  tokens: Record<string, AnyTokenList>;
  settings: SettingsState;
};

export type VariableToken = SingleToken<true, { path: string, variableId: string }>;

export default function updateVariables({
  collection, mode, theme, tokens, settings,
}: CreateVariableTypes) {
  const tokensToCreate = generateTokensToCreate(theme, tokens, tokenTypesToCreateVariable);
  const variablesToCreate: VariableToken[] = [];
  tokensToCreate.forEach((token) => {
    if (checkIfTokenCanCreateVariable(token)) {
      if (
        (token.type === TokenTypes.COLOR && settings.variablesColor)
        || (ExportNumberVariablesTokenTypes.includes(token.type) && settings.variablesNumber)
        || ([TokenTypes.TEXT, TokenTypes.FONT_FAMILIES].includes(token.type) && settings.variablesString)
        || (token.type === TokenTypes.BOOLEAN && settings.variablesBoolean)
        || (token.type === TokenTypes.FONT_WEIGHTS && Boolean(parseFloat(token.value)) && settings.variablesNumber)
        || (token.type === TokenTypes.FONT_WEIGHTS && !parseFloat(token.value) && settings.variablesString)
      ) {
        variablesToCreate.push(mapTokensToVariableInfo(token, theme, settings));
      }
    }
  });
  console.log('varaiblers to create', variablesToCreate, tokensToCreate);
  const variableObj = setValuesOnVariable(figma.variables.getLocalVariables().filter((v) => v.variableCollectionId === collection.id), variablesToCreate, collection, mode);
  return {
    variableIds: variableObj.variableKeyMap,
    referenceVariableCandidate: variableObj.referenceVariableCandidates,
  };
}
