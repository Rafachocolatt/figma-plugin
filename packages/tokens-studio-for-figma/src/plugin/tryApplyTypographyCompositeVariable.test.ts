import { tryApplyTypographyCompositeVariable } from './tryApplyTypographyCompositeVariable';
import { defaultTokenValueRetriever } from './TokenValueRetriever';
import { SingleTypographyToken } from '@/types/tokens';
import { ResolvedTypographyObject } from './ResolvedTypographyObject';

describe('tryApplyTypographyCompositeVariable', () => {
  let target: TextNode | TextStyle;
  let value: SingleTypographyToken['value'];
  let resolvedValue: ResolvedTypographyObject;
  let baseFontSize: string;

  beforeEach(() => {
    target = {} as TextNode | TextStyle;
    value = {};
    resolvedValue = {};
    baseFontSize = '16px';
    // const tokens = [
    //   {
    //     internal__Parent: 'core',
    //     name: 'fontFamily.default',
    //     rawValue: 'Roboto',
    //     type: 'fontFamilies',
    //     value: 'Roboto',
    //   },
    //   {
    //     internal__Parent: 'core',
    //     name: 'fontWeight.default',
    //     rawValue: 'Bold',
    //     type: 'fontWeights',
    //     value: 'Bold',
    //   },
    //   {
    //     internal__Parent: 'global',
    //     name: 'headline',
    //     rawValue: {
    //       fontFamily: '{fontFamily.default}',
    //       fontWeight: 'Bold',
    //     },
    //     resolvedValueWithReferences: {
    //       fontFamily: 'Inter',
    //       fontWeight: 'Bold',
    //     },
    //     type: 'typography',
    //     value: {
    //       fontFamily: 'Inter',
    //       fontWeight: 'Bold',
    //     },
    //   },
    // ];

    // defaultTokenValueRetriever.initiate({
    //   tokens,
    //   variableReferences: new Map([['fontFamily.default', '123'], ['fontWeight.default', '124']]),
    //   createStylesWithVariableReferences: true,
    // });
  });

  it('should set font family and weight without variables', async () => {
    target = {
      fontName: {
        family: 'Arial',
        style: 'Regular',
      },
    } as TextNode | TextStyle;
    value = {
      fontFamily: 'Inter',
      fontWeight: 'Bold',
    };
    resolvedValue = {};

    await tryApplyTypographyCompositeVariable({
      target, value, resolvedValue, baseFontSize,
    });

    expect(target.fontName).toEqual({ family: 'Inter', style: 'Bold' });
  });

  it('should apply variables if available', async () => {
    target = {
      fontName: {
        family: 'Arial',
        style: 'Regular',
      },
      setBoundVariable: jest.fn(),
    } as TextNode | TextStyle;
    resolvedValue = {
      fontFamily: '{fontFamily.default}',
      fontWeight: '{fontWeight.default}',
    };
    value = {
      fontFamily: 'Roboto-raw',
      fontWeight: 'Bold-raw',
    };
    defaultTokenValueRetriever.getVariableReference = jest.fn().mockResolvedValue('Roboto');
    defaultTokenValueRetriever.getVariableReference = jest.fn()
      .mockResolvedValueOnce('Roboto')
      .mockResolvedValueOnce('Bold');

    await tryApplyTypographyCompositeVariable({
      target, value, resolvedValue, baseFontSize,
    });

    expect(target.setBoundVariable).toHaveBeenCalledTimes(2);
    expect(target.setBoundVariable).toHaveBeenNthCalledWith(1, 'fontFamily', 'Roboto');
    expect(target.setBoundVariable).toHaveBeenNthCalledWith(2, 'fontStyle', 'Bold');
  });

  it('should apply values directly if no variables are available', async () => {
    target = {
      fontName: {
        family: 'Arial',
        style: 'Regular',
      },
    } as TextNode | TextStyle;
    value = {
      fontFamily: 'Inter',
      fontWeight: 'Ultrabold',
      fontSize: '24px',
      lineHeight: '1.5',
    };
    resolvedValue = {
      fontFamily: '{fontFamilyVariable}',
      fontWeight: '{fontWeightVariable}',
      fontSize: '{fontSizeVariable}',
      lineHeight: '1.5',
    };

    await tryApplyTypographyCompositeVariable({
      target, value, resolvedValue, baseFontSize,
    });

    expect(target.fontName).toEqual({ family: 'Inter', style: 'Ultrabold' });
    expect(target.fontSize).toEqual(24);
    expect(target.lineHeight).toEqual({ unit: 'PIXELS', value: 1.5 });
  });

  it('should handle errors gracefully', async () => {
    target = {
      fontName: {
        family: 'Arial',
        style: 'Regular',
      },
    } as TextNode | TextStyle;
    value = {
      fontFamily: '{fontFamilyVariable}',
    };
    resolvedValue = {
      fontFamily: '{fontFamilyVariable}',
    };
    defaultTokenValueRetriever.getVariableReference = jest.fn().mockRejectedValue(new Error('Failed to get variable reference'));

    await tryApplyTypographyCompositeVariable({
      target, value, resolvedValue, baseFontSize,
    });
  });
});
