import { RawVariableReferenceMap } from '@/types/RawVariableReferenceMap';
import { AnyTokenList } from '@/types/tokens';

export class TokenValueRetriever {
  public tokens;

  public variableReferences;

  public cachedVariableReferences;

  private styleReferences;

  private stylePathPrefix;

  private ignoreFirstPartForStyles;

  public createStylesWithVariableReferences;

  private getAdjustedTokenName(tokenName: string): string {
    const withIgnoredFirstPart = this.ignoreFirstPartForStyles ? tokenName.split('.').slice(1).join('.') : tokenName;
    const withPrefix = [this.stylePathPrefix, withIgnoredFirstPart].filter((n) => n).join('.');
    return withPrefix;
  }

  public initiate({
    tokens, variableReferences, styleReferences, stylePathPrefix, ignoreFirstPartForStyles = false, createStylesWithVariableReferences = false,
  }: { tokens: AnyTokenList, variableReferences?: RawVariableReferenceMap, styleReferences?: Map<string, string>, stylePathPrefix?: string, ignoreFirstPartForStyles?: boolean; createStylesWithVariableReferences?: boolean }) {
    this.stylePathPrefix = typeof stylePathPrefix !== 'undefined' ? stylePathPrefix : null;
    this.ignoreFirstPartForStyles = ignoreFirstPartForStyles;
    this.createStylesWithVariableReferences = createStylesWithVariableReferences;
    this.styleReferences = styleReferences || new Map();
    this.variableReferences = variableReferences || new Map();
    this.cachedVariableReferences = new Map();

    this.tokens = new Map<string, any>(tokens.map((token) => {
      const variableId = variableReferences?.get(token.name);
      // For styles, we need to ignore the first part of the token name as well as consider theme prefix
      const adjustedTokenName = this.getAdjustedTokenName(token.name);
      const styleId = styleReferences?.get(adjustedTokenName);
      return [token.name, {
        ...token, variableId, styleId, adjustedTokenName,
      }];
    }));
  }

  public get(tokenName: string) {
    return this.tokens.get(tokenName);
  }

  public async getVariableReference(tokenName: string) {
    let variable;
    const hasCachedVariable = this.cachedVariableReferences.has(tokenName);
    if (hasCachedVariable) {
      variable = this.cachedVariableReferences.get(tokenName);
      return variable;
    }
    const variableMapped = this.variableReferences.get(tokenName);
    if (!variableMapped) return false;
    if (!hasCachedVariable && typeof variableMapped === 'string') {
      try {
        const foundVariable = await figma.variables.importVariableByKeyAsync(variableMapped);
        if (foundVariable) {
          this.cachedVariableReferences.set(tokenName, foundVariable);
          variable = foundVariable;
          return variable;
        }
      } catch (e) {
        console.log('error importing variable', e);
        Promise.reject(e);
      }
    }

    if (variable === undefined) return null;
    return null;
  }

  public getTokens() {
    return this.tokens;
  }

  public clearCache() {
    if (this.cachedVariableReferences) this.cachedVariableReferences.clear();
    if (this.tokens) this.tokens.clear();
    if (this.variableReferences) this.variableReferences.clear();
    if (this.styleReferences) this.styleReferences.clear();
    if (this.stylePathPrefix) this.stylePathPrefix = undefined;
    if (this.ignoreFirstPartForStyles) this.ignoreFirstPartForStyles = undefined;
    if (this.createStylesWithVariableReferences) this.createStylesWithVariableReferences = undefined;
  }
}

const defaultTokenValueRetriever = new TokenValueRetriever();

export { defaultTokenValueRetriever };
