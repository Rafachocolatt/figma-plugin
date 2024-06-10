import { AsyncMessageChannel } from '@/AsyncMessageChannel';
import { AsyncMessageTypes } from '@/types/AsyncMessages';
import { AnyTokenList } from '@/types/tokens';
import { SettingsState } from '@/app/store/models/settings';
import updateVariables from './updateVariables';
import { ReferenceVariableType } from './setValuesOnVariable';
import updateVariablesToReference from './updateVariablesToReference';
import { notifyUI } from './notifiers';
import { mergeVariableReferencesWithLocalVariables } from './mergeVariableReferences';
import { findCollectionAndModeIdForTheme } from './findCollectionAndModeIdForTheme';
import { createNecessaryVariableCollections } from './createNecessaryVariableCollections';

export type LocalVariableInfo = {
  collectionId: string;
  modeId: string;
  variableIds: Record<string, string>
};

/**
* This function is used to create and update variables based on themes
* - It first creates the necessary variable collections and modes or returns existing ones
* - It then checks if the selected themes generated any collections. It could be a user is in a Free plan and we were unable to create more than 1 mode. If mode wasnt created, we skip the theme.
* - Then goes on to update variables for each theme
* - There's another step that we perform where we check if any variables need to be using references to other variables. This is a second step, as we need to have all variables created first before we can reference them.
* */
export default async function createLocalVariablesInPlugin(tokens: Record<string, AnyTokenList>, settings: SettingsState, selectedThemes?: string[]) {
  // Big O (n * m * x): (n: amount of themes, m: amount of variableCollections, x: amount of modes)
  const themeInfo = await AsyncMessageChannel.PluginInstance.message({
    type: AsyncMessageTypes.GET_THEME_INFO,
  });
  const selectedThemeObjects = themeInfo.themes.filter((theme) => selectedThemes?.includes(theme.id));
  const allVariableCollectionIds: Record<string, LocalVariableInfo> = {};
  let referenceVariableCandidates: ReferenceVariableType[] = [];
  const updatedVariableCollections: VariableCollection[] = [];
  let updatedVariables: Variable[] = [];

  const checkSetting = !settings.variablesBoolean && !settings.variablesColor && !settings.variablesNumber && !settings.variablesString;
  if (!checkSetting && selectedThemes && selectedThemes.length > 0) {
    const collections = await createNecessaryVariableCollections(themeInfo.themes, selectedThemes);

    await Promise.all(selectedThemeObjects.map(async (theme) => {
      const { collection, modeId } = findCollectionAndModeIdForTheme(theme.group ?? theme.name, theme.name, collections);

      if (!collection || !modeId) return;

      const allVariableObj = await updateVariables({
        collection, mode: modeId, theme, tokens, settings,
      });
      if (Object.keys(allVariableObj.variableIds).length > 0) {
        allVariableCollectionIds[theme.id] = {
          collectionId: collection.id,
          modeId,
          variableIds: allVariableObj.variableIds,
        };
        referenceVariableCandidates = referenceVariableCandidates.concat(allVariableObj.referenceVariableCandidate);
      }
      updatedVariableCollections.push(collection);
    }));
    const existingVariables = await mergeVariableReferencesWithLocalVariables(selectedThemeObjects);

    updatedVariables = await updateVariablesToReference(existingVariables, referenceVariableCandidates);
  }

  if (updatedVariables.length === 0) {
    notifyUI('No variables were created');
  } else {
    notifyUI(`${updatedVariableCollections.length} collections and ${updatedVariables.length} variables created`);
  }
  return {
    allVariableCollectionIds,
    totalVariables: updatedVariables.length,
  };
}
