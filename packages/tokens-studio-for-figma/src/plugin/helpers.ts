import convertOpacityToFigma from './figmaTransforms/opacity';
import { convertTypographyNumberToFigma, fakeZeroForFigma } from './figmaTransforms/generic';
import { convertLetterSpacingToFigma } from './figmaTransforms/letterSpacing';
import { convertLineHeightToFigma } from './figmaTransforms/lineHeight';
import { convertBoxShadowTypeToFigma } from './figmaTransforms/boxShadow';
import { convertTextCaseToFigma } from './figmaTransforms/textCase';
import { convertTextDecorationToFigma } from './figmaTransforms/textDecoration';
import { convertFontWeightToFigma } from './figmaTransforms/fontWeight';
import { UserIdProperty } from '@/figmaStorage';
import { generateId } from '@/utils/generateId';
import { Properties } from '@/constants/Properties';

export async function getUserId() {
  let userId = generateId(24);

  try {
    const id = await UserIdProperty.read();
    if (id === null) {
      await UserIdProperty.write(userId);
    } else {
      userId = id;
    }
  } catch (e) {
    console.error('error retrieving userId', e);
    await UserIdProperty.write(userId);
  }

  return userId;
}

export function transformValue(value: string, type: 'fontWeights', baseFontSize: string, shouldOutputForVariables?: boolean): ReturnType<typeof convertFontWeightToFigma>;
export function transformValue(value: string, type: 'letterSpacing', baseFontSize: string, shouldOutputForVariables?: boolean): LetterSpacing | null;
export function transformValue(value: string, type: 'lineHeights', baseFontSize: string, shouldOutputForVariables?: boolean): LineHeight | null;
export function transformValue(value: string, type: 'boxShadowType', baseFontSize: string, shouldOutputForVariables?: boolean): ReturnType<typeof convertBoxShadowTypeToFigma>;
export function transformValue(value: string, type: 'textCase', baseFontSize: string, shouldOutputForVariables?: boolean): ReturnType<typeof convertTextCaseToFigma>;
export function transformValue(value: string, type: 'textDecoration', baseFontSize: string, shouldOutputForVariables?: boolean): ReturnType<typeof convertTextDecorationToFigma>;
export function transformValue(value: string, type: string, baseFontSize: string, shouldOutputForVariables?: boolean): number;
export function transformValue(value: string, type: string, baseFontSize: string, shouldOutputForVariables = false) {
  switch (type) {
    case Properties.borderWidth:
    case Properties.borderWidthTop:
    case Properties.borderWidthRight:
    case Properties.borderWidthBottom:
    case Properties.borderWidthLeft:
      return convertTypographyNumberToFigma(value, baseFontSize);
    case 'width':
    case 'height':
    case 'sizing':
      return fakeZeroForFigma(convertTypographyNumberToFigma(value, baseFontSize));
    case 'backgroundBlur':
    case 'borderRadius':
    case 'borderRadiusTopLeft':
    case 'borderRadiusTopRight':
    case 'borderRadiusBottomRight':
    case 'borderRadiusBottomLeft':
    case 'spacing':
    case 'horizontalPadding':
    case 'verticalPadding':
    case 'paddingTop':
    case 'paddingRight':
    case 'paddingBottom':
    case 'paddingLeft':
    case 'itemSpacing':
    case 'paragraphSpacing':
    case 'paragraphIndent':
    case 'fontSizes':
    case 'fontSize':
    case 'dimension':
      return convertTypographyNumberToFigma(value, baseFontSize);
    case 'fontWeights':
    case 'fontWeight':
      return convertFontWeightToFigma(value);
    case 'letterSpacing':
      return convertLetterSpacingToFigma(value, baseFontSize, shouldOutputForVariables);
    case 'lineHeights':
    case 'lineHeight':
      return convertLineHeightToFigma(value, baseFontSize, shouldOutputForVariables);
    case 'opacity':
      return convertOpacityToFigma(value.toString());
    case 'boxShadowType':
      return convertBoxShadowTypeToFigma(value);
    case 'textCase':
      return convertTextCaseToFigma(value.toString());
    case 'textDecoration':
      return convertTextDecorationToFigma(value.toString());
    default:
      return value;
  }
}
