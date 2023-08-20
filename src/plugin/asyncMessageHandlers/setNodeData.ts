import { AsyncMessageChannelHandlers } from '@/AsyncMessageChannel';
import { AsyncMessageTypes } from '@/types/AsyncMessages';
import { tokenArrayGroupToMap } from '@/utils/tokenArrayGroupToMap';
import { updatePluginDataAndNodes } from '../updatePluginDataAndNodes';
import { sendSelectionChange } from '../sendSelectionChange';

export const setNodeData: AsyncMessageChannelHandlers[AsyncMessageTypes.SET_NODE_DATA] = async (msg) => {
  try {
    if (figma.currentPage.selection.length) {
      const tokensMap = tokenArrayGroupToMap(msg.tokens);
      const nodes = figma.currentPage.selection;
      await updatePluginDataAndNodes({
        entries: nodes, values: msg.values, tokensMap, settings: msg.settings,
      });
      sendSelectionChange();
    }
  } catch (e) {
    console.error(e);
  }
};
