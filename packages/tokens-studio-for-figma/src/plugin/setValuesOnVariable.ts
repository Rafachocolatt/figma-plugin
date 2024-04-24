import { SingleToken } from '@/types/tokens';
import setBooleanValuesOnVariable from './setBooleanValuesOnVariable';
import setColorValuesOnVariable from './setColorValuesOnVariable';
import setNumberValuesOnVariable from './setNumberValuesOnVariable';
import setStringValuesOnVariable from './setStringValuesOnVariable';
import { convertTokenTypeToVariableType } from '@/utils/convertTokenTypeToVariableType';
import { checkCanReferenceVariable } from '@/utils/alias/checkCanReferenceVariable';
import { TokenTypes } from '@/constants/TokenTypes';

export type ReferenceVariableType = {
  variable: Variable;
  modeId: string;
  referenceVariable: string;
};

export default function setValuesOnVariable(
  variablesInFigma: Variable[],
  tokens: SingleToken<true, { path: string, variableId: string }>[],
  collection: VariableCollection,
  mode: string,
) {
  const variableKeyMap: Record<string, string> = {};
  const referenceVariableCandidates: ReferenceVariableType[] = [];
  try {
    tokens.forEach((t) => {
      const variableType = convertTokenTypeToVariableType(t.type, t.value);
      // If id matches the variableId, or name patches the token path, we can use it to update the variable instead of re-creating.
      // This has the nasty side-effect that if font weight changes from string to number, it will not update the variable given we cannot change type.
      // In that case, we should delete the variable and re-create it.
      const variable = variablesInFigma.find((v) => (v.key === t.variableId && !v.remote) || v.name === t.path) || figma.variables.createVariable(t.path, collection.id, variableType);

      if (variable) {
        if (variableType !== variable?.resolvedType) {
          // TODO: DISCUSS IF THIS BEHAVIOR IS WANTED. It leads to many broken variables applied.. we cant change the type of a variable we have to re-create it
          // variable.remove();
          // variable = figma.variables.createVariable(t.path, collection.id, variableType);
        }
        variable.description = t.description ?? '';

        switch (variableType) {
          case 'BOOLEAN':
            if (typeof t.value === 'string') {
              setBooleanValuesOnVariable(variable, mode, t.value);
            }
            break;
          case 'COLOR':
            if (typeof t.value === 'string') {
              setColorValuesOnVariable(variable, mode, t.value);
            }
            break;
          case 'FLOAT':
            setNumberValuesOnVariable(variable, mode, Number(t.value));
            break;
          case 'STRING':
            if (typeof t.value === 'string') {
              setStringValuesOnVariable(variable, mode, t.value);
              // Given we cannot determine the combined family of a variable, we cannot use fallback weights from our estimates.
              // This is not an issue because users can set numerical font weights with variables, so we opt-out of the guesswork and just apply the numerical weight.
            } else if (t.type === TokenTypes.FONT_WEIGHTS && Array.isArray(t.value)) {
              setStringValuesOnVariable(variable, mode, t.value[0]);
            }
            break;
          default:
            break;
        }
        let referenceTokenName: string = '';
        if (t.rawValue && t.rawValue?.toString().startsWith('{')) {
          referenceTokenName = t.rawValue?.toString().slice(1, t.rawValue.toString().length - 1);
        } else {
          referenceTokenName = t.rawValue!.toString().substring(1);
        }
        variableKeyMap[t.name] = variable.key;
        if (checkCanReferenceVariable(t)) {
          referenceVariableCandidates.push({
            variable,
            modeId: mode,
            referenceVariable: referenceTokenName.split('.').join('/'),
          });
        }
      }
    });
  } catch (e) {
    console.error('Setting values on variable is failed', e);
  }

  return {
    variableKeyMap,
    referenceVariableCandidates,
  };
}
