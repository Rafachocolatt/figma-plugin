import { TokenTypes } from '@/constants/TokenTypes';
import { ResolveTokenValuesResult } from './tokenHelpers';
import { numberMatchesPercentage } from '@/plugin/figmaTransforms/numberMatchesPercentage';

export default function checkIfTokenCanCreateVariable(token: ResolveTokenValuesResult): boolean {
  // Ignore multi value spacing and multi value borderRadius tokens
  if ((token.type === TokenTypes.BORDER_RADIUS || token.type === TokenTypes.SPACING) && typeof token.value === 'string') {
    return token.value.split(' ').length === 1;
  }
  // Ignore gradient colors
  if (token.type === TokenTypes.COLOR && typeof token.value === 'string' && token.value.startsWith('linear-gradient')) {
    return false;
  }
  // Ignore AUTO values on lineHeight
  if (token.type === TokenTypes.LINE_HEIGHTS && typeof token.value === 'string' && token.value === 'AUTO') {
    return false;
  }
  // Ignore percentage values, except on text type tokens
  if (token.type !== TokenTypes.TEXT && typeof token.value === 'string' && numberMatchesPercentage(token.value)) {
    return false;
  }
  return true;
}
