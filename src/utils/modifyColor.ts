import Color from 'colorjs.io';
import { ColorModifierTypes } from '@/constants/ColorModifierTypes';
import { ColorModifier } from '@/types/Modifier';

export function modifyColor(baseColor: string, modifier: ColorModifier) {
  try {
    switch (modifier.type) {
      case ColorModifierTypes.LIGHTEN:
        return new Color(new Color(baseColor).lighten(Number(modifier.value)).to(modifier.space)).toString();
      case ColorModifierTypes.DARKEN:
        return new Color(new Color(baseColor).darken(Number(modifier.value)).to(modifier.space)).toString();
      case ColorModifierTypes.MIX:
        return new Color(new Color(new Color(baseColor).mix(new Color(modifier.color), Number(modifier.value), { outputSpace: 'sRGB' }).toString()).to(modifier.space)).toString();
      case ColorModifierTypes.ALPHA:
        // eslint-disable-next-line no-case-declarations
        const newColor = new Color(baseColor);
        newColor.alpha = Number(modifier.value);
        return new Color(newColor.to(modifier.space)).toString();
      default:
        return new Color(baseColor).toString();
    }
  } catch (e) {
    return baseColor;
  }
}
