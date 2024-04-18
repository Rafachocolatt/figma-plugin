import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Label, Box, Link, Button, Switch, Text,
} from '@tokens-studio/ui';
import {
  ChevronLeftIcon,
} from '@primer/octicons-react';
import { useDispatch, useSelector } from 'react-redux';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Modal } from '../Modal/Modal';
import { LabelledCheckbox } from './LabelledCheckbox';
import { ExplainerModal } from '../ExplainerModal';
import {
  ignoreFirstPartForStylesSelector,
  prefixStylesWithThemeNameSelector,
  createStylesWithVariableReferencesSelector,
  removeStylesAndVariablesWithoutConnectionSelector,
  renameExistingStylesAndVariablesSelector,
  variablesColorSelector,
  variablesNumberSelector,
  variablesBooleanSelector,
  variablesStringSelector,
  stylesColorSelector,
  stylesEffectSelector,
  stylesTypographySelector,
} from '@/selectors';
import ignoreFirstPartImage from '@/app/assets/hints/ignoreFirstPartForStyles.png';
import prefixStylesImage from '@/app/assets/hints/prefixStyles.png';
import { Dispatch } from '../../store';

type ExportOptions = {
  variablesColor: boolean,
  variablesString: boolean,
  variablesNumber: boolean,
  variablesBoolean: boolean,
  stylesColor: boolean,
  stylesTypography: boolean,
  stylesEffect: boolean,
  rulesIgnoreFirstPartForStyles: boolean | undefined,
  rulesPrefixStylesWithThemeName: boolean | undefined,
  rulesCreateStylesWithVariableReferences: boolean | undefined,
};

export default function OptionsModal({ isOpen, title, closeAction }: { isOpen: boolean, title: string, closeAction: () => void }) {
  const rulesRemoveStylesAndVariablesWithoutConnection = useSelector(removeStylesAndVariablesWithoutConnectionSelector);
  const rulesRenameExisting = useSelector(renameExistingStylesAndVariablesSelector);

  const rulesIgnoreFirstPartForStyles = useSelector(ignoreFirstPartForStylesSelector);
  const rulesPrefixStylesWithThemeName = useSelector(prefixStylesWithThemeNameSelector);
  const rulesCreateStylesWithVariableReferences = useSelector(createStylesWithVariableReferencesSelector);

  const variablesColor = useSelector(variablesColorSelector);
  const variablesNumber = useSelector(variablesNumberSelector);
  const variablesBoolean = useSelector(variablesBooleanSelector);
  const variablesString = useSelector(variablesStringSelector);
  const stylesColor = useSelector(stylesColorSelector);
  const stylesTypography = useSelector(stylesTypographySelector);
  const stylesEffect = useSelector(stylesEffectSelector);

  const exportOptions: ExportOptions = {
    variablesColor,
    variablesString,
    variablesNumber,
    variablesBoolean,
    stylesColor,
    stylesTypography,
    stylesEffect,
    rulesIgnoreFirstPartForStyles,
    rulesPrefixStylesWithThemeName,
    rulesCreateStylesWithVariableReferences,
  };

  const dispatch = useDispatch<Dispatch>();

  const handleIgnoreChange = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setIgnoreFirstPartForStyles(!!state);
    },
    [dispatch.settings],
  );

  const handlePrefixWithThemeNameChange = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setPrefixStylesWithThemeName(!!state);
    },
    [dispatch.settings],
  );

  const handleCreateStylesWithVariableReferencesChange = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setCreateStylesWithVariableReferences(!!state);
    },
    [dispatch.settings],
  );

  const handleRenameExistingChange = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setRenameExistingStylesAndVariables(!!state);
    },
    [dispatch.settings],
  );

  const handleRemoveStylesAndVariablesWithoutConnectionChange = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setRemoveStylesAndVariablesWithoutConnection(!!state);
    },
    [dispatch.settings],
  );

  const handleExportVariablesColor = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setVariablesColor(!!state);
      // color can be created *either* styles or variables, we dont want both. if we're setting this to true, disable the other one
      if (state) dispatch.settings.setStylesColor(!state);
    },
    [dispatch.settings],
  );

  const handleExportVariablesNumber = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setVariablesNumber(!!state);
    },
    [dispatch.settings],
  );
  const handleExportVariablesBoolean = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setVariablesBoolean(!!state);
    },
    [dispatch.settings],
  );
  const handleExportVariablesString = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setVariablesString(!!state);
    },
    [dispatch.settings],
  );
  const handleExportStylesColor = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setStylesColor(!!state);
      // color can be created *either* styles or variables, we dont want both. if we're setting this to true, disable the other one
      if (state) dispatch.settings.setVariablesColor(!state);
    },
    [dispatch.settings],
  );
  const handleExportStylesTypography = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setStylesTypography(!!state);
    },
    [dispatch.settings],
  );
  const handleExportStylesEffect = React.useCallback(
    (state: CheckedState) => {
      dispatch.settings.setStylesEffect(!!state);
    },
    [dispatch.settings],
  );

  const handleSaveOptions = React.useCallback(() => {
    closeAction();
  }, [closeAction]);

  const onInteractOutside = (event: Event) => {
    event.preventDefault();
  };

  const { t } = useTranslation(['manageStylesAndVariables', 'tokens']);

  return (
    <Modal
      size="fullscreen"
      title={title}
      backArrow
      isOpen={isOpen}
      close={closeAction}
      /* eslint-disable-next-line react/jsx-no-bind */
      onInteractOutside={(event) => onInteractOutside(event)}
      footer={(
        <Stack direction="row" justify="between" gap={4}>
          <Button variant="invisible" id="manageStyles-button-close" onClick={closeAction} icon={<ChevronLeftIcon />}>
            {t('actions.cancel')}
          </Button>

          <Button variant="primary" id="pullDialog-button-overwrite" onClick={handleSaveOptions}>
            {t('actions.confirm')}
          </Button>

        </Stack>
)}
      stickyFooter
    >
      <Stack direction="column" align="start" gap={4}>
        <Stack direction="column" align="start" gap={3}>
          <Text>{t('options.intro')}</Text>
          <Link target="_blank" href="https://docs.tokens.studio/">{`${t('generic.learnMore')} – ${t('docs.exportToFigmaOptions')}`}</Link>
        </Stack>
        <form>
          <Stack direction="column" gap={6}>

            <Stack direction="column" gap={3}>
              <Text bold css={{ fontSize: '$medium' }}>{t('options.createAndUpdate')}</Text>
              <Box css={{
                width: '100%', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: '$5',
              }}
              >
                <Stack direction="column" gap={3}>
                  <Text css={{ fontSize: '$small' }}>{t('generic.variables')}</Text>
                  <LabelledCheckbox id="variablesColor" onChange={handleExportVariablesColor} checked={exportOptions.variablesColor} label={t('variables.color')} />
                  <LabelledCheckbox id="variablesString" onChange={handleExportVariablesString} checked={exportOptions.variablesString} label={t('variables.string')} />
                  <LabelledCheckbox id="variablesNumber" onChange={handleExportVariablesNumber} checked={exportOptions.variablesNumber} label={t('variables.number')} />
                  <LabelledCheckbox id="variablesBoolean" onChange={handleExportVariablesBoolean} checked={exportOptions.variablesBoolean} label={t('variables.boolean')} />
                </Stack>
                <Box css={{ alignSelf: 'stretch', width: '1px', border: '1px solid $colors$borderSubtle' }} />
                <Stack direction="column" gap={3}>
                  <Text css={{ fontSize: '$small' }}>{t('generic.styles')}</Text>
                  <LabelledCheckbox id="styleColor" onChange={handleExportStylesColor} checked={exportOptions.stylesColor} label={t('styles.color')} />
                  <LabelledCheckbox id="stylesTypography" onChange={handleExportStylesTypography} checked={exportOptions.stylesTypography} label={t('styles.typography')} />
                  <LabelledCheckbox id="stylesEffect" onChange={handleExportStylesEffect} checked={exportOptions.stylesEffect} label={t('styles.effects')} />
                </Stack>
              </Box>
            </Stack>
            <Box css={{
              display: 'grid',
              alignItems: 'center',
              gridAutoRows: 'auto',
              gridTemplateColumns: 'min-content auto min-content',
              maxWidth: '90vw',
              width: '100%',
              gridColumnGap: '$2',
              gridRowGap: '$3',
            }}
            >
              <Switch
                data-testid="renameExisting"
                id="renameExisting"
                checked={!!rulesRenameExisting}
                defaultChecked={rulesRenameExisting}
                onCheckedChange={handleRenameExistingChange}
              />
              <Label css={{ fontWeight: '$sansRegular' }} htmlFor="renameExisting">{t('options.renameExisting')}</Label>
              <ExplainerModal title={t('options.renameExisting')}>
                <Box as="img" src={ignoreFirstPartImage} css={{ borderRadius: '$small' }} />
                <Box>{t('options.renameExistingExplanation')}</Box>
              </ExplainerModal>
              <Switch
                data-testid="removeWithoutConnection"
                id="removeWithoutConnection"
                checked={!!rulesRemoveStylesAndVariablesWithoutConnection}
                defaultChecked={rulesRemoveStylesAndVariablesWithoutConnection}
                onCheckedChange={handleRemoveStylesAndVariablesWithoutConnectionChange}
              />
              <Label css={{ fontWeight: '$sansRegular' }} htmlFor="removeWithoutConnection">{t('options.removeWithoutConnection')}</Label>
              <ExplainerModal title={t('options.removeWithoutConnection')}>
                <Box as="img" src={ignoreFirstPartImage} css={{ borderRadius: '$small' }} />
                <Box>{t('options.removeWithoutExplanation')}</Box>
              </ExplainerModal>
              <Text bold css={{ fontSize: '$medium', gridColumnStart: 1, gridColumnEnd: 4 }}>{t('options.tokensExportedToFigmaShould')}</Text>
              <Switch
                data-testid="ignoreFirstPartForStyles"
                id="ignoreFirstPartForStyles"
                checked={!!rulesIgnoreFirstPartForStyles}
                defaultChecked={rulesIgnoreFirstPartForStyles}
                onCheckedChange={handleIgnoreChange}
              />
              <Label css={{ fontWeight: '$sansRegular' }} htmlFor="ignoreFirstPartForStyles">{t('options.ignorePrefix')}</Label>
              <ExplainerModal title={t('options.ignorePrefix')}>
                <Box as="img" src={ignoreFirstPartImage} css={{ borderRadius: '$small' }} />
                <Box>{t('options.ignorePrefixExplanation')}</Box>
              </ExplainerModal>

              <Switch
                data-testid="prefixStylesWithThemeName"
                id="prefixStylesWithThemeName"
                checked={!!rulesPrefixStylesWithThemeName}
                defaultChecked={rulesPrefixStylesWithThemeName}
                onCheckedChange={handlePrefixWithThemeNameChange}
              />
              <Label css={{ fontWeight: '$sansRegular' }} htmlFor="prefixStylesWithThemeName">{t('options.prefixStyles')}</Label>
              <ExplainerModal title={t('options.prefixStyles')}>
                <Box as="img" src={prefixStylesImage} css={{ borderRadius: '$small' }} />
                <Box>{t('options.prefixStylesExplanation')}</Box>
              </ExplainerModal>

              <Switch
                data-testid="createStylesWithVariableReferences"
                id="createStylesWithVariableReferences"
                checked={!!rulesCreateStylesWithVariableReferences}
                defaultChecked={rulesCreateStylesWithVariableReferences}
                onCheckedChange={handleCreateStylesWithVariableReferencesChange}
              />
              <Label css={{ fontWeight: '$sansRegular' }} htmlFor="createStylesWithVariableReferences">{t('options.createStylesWithVariableReferences')}</Label>
              <ExplainerModal title={t('options.createStylesWithVariableReferences')}>
                <Box>{t('options.createStylesWithVariableReferencesExplanation')}</Box>
              </ExplainerModal>
            </Box>

          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
