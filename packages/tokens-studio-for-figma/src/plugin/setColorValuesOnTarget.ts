import { isPaintEqual } from '@/utils/isPaintEqual';
import { convertToFigmaColor } from './figmaTransforms/colors';
import { convertStringToFigmaGradient } from './figmaTransforms/gradients';
import { defaultTokenValueRetriever } from './TokenValueRetriever';
import { ColorPaintType, tryApplyColorVariableId } from '@/utils/tryApplyColorVariableId';

export default async function setColorValuesOnTarget(target: BaseNode | PaintStyle, token: string, key: 'paints' | 'fills' | 'strokes' = 'paints') {
  try {
    const resolvedToken = defaultTokenValueRetriever.get(token);
    if (typeof resolvedToken === 'undefined') return;
    const { description, value } = resolvedToken;
    const resolvedValue = defaultTokenValueRetriever.get(token)?.rawValue;
    if (typeof resolvedValue === 'undefined') return;
    let existingPaint: Paint | null = null;
    if (key === 'paints' && 'paints' in target) {
      existingPaint = target.paints[0] ?? null;
    } else if (key === 'fills' && 'fills' in target && target.fills !== figma.mixed) {
      existingPaint = target.fills[0] ?? null;
    } else if (key === 'strokes' && 'strokes' in target) {
      existingPaint = target.strokes[0] ?? null;
    }

    if (value.startsWith('linear-gradient')) {
      const { gradientStops, gradientTransform } = convertStringToFigmaGradient(value);
      const newPaint: GradientPaint = {
        type: 'GRADIENT_LINEAR',
        gradientTransform,
        gradientStops,
      };

      if (!existingPaint || !isPaintEqual(newPaint, existingPaint)) {
        if (key === 'paints' && 'paints' in target) target.paints = [newPaint];
        if (key === 'fills' && 'fills' in target) target.fills = [newPaint];
        if (key === 'strokes' && 'strokes' in target) target.strokes = [newPaint];
      }
    } else {
      // If the raw value is a pure reference to another token, we first should try to apply that reference as a variable if it exists.
      let successfullyAppliedVariable = false;
      if (resolvedValue.toString().startsWith('{') && resolvedValue.toString().endsWith('}')) {
        try {
          successfullyAppliedVariable = await tryApplyColorVariableId(target, resolvedValue.slice(1, -1), ColorPaintType.PAINTS);
        } catch (e) {
          console.error('Error setting bound variable for paint', e);
        }
      }
      // If we didnt find a variable to apply, we should apply the color directly.
      if (!successfullyAppliedVariable) {
        const { color, opacity } = convertToFigmaColor(value);
        await tryApplyColorVariableId(target, resolvedValue, ColorPaintType.FILLS);
        const newPaint: SolidPaint = { color, opacity, type: 'SOLID' };
        if (!existingPaint || !isPaintEqual(newPaint, existingPaint)) {
          if (key === 'paints' && 'paints' in target) target.paints = [newPaint];
          if (key === 'fills' && 'fills' in target) target.fills = [newPaint];
          if (key === 'strokes' && 'strokes' in target) target.strokes = [newPaint];
        }
      }
    }
    if (description && 'description' in target) {
      target.description = description;
    }
    Promise.resolve();
  } catch (e) {
    console.error('Error setting color', e);
  }
}
