import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { styled } from '@/stitches.config';

const itemStyles = {
  fontSize: '$xsmall',
  padding: '$2 $3 $2 $6',
  borderRadius: '$small',
  cursor: 'default',

  '&:hover:not([data-disabled]), &:focus:not([data-disabled])': {
    outline: 'none',
    backgroundColor: '$accentDefault',
    color: '$fgOnEmphasis',
  },

  '&[data-disabled]': {
    color: '$contextMenuFgDisabled',
  },
};

const StyledDropdownMenuContent = styled(DropdownMenuPrimitive.Content, {
  minWidth: 130,
  maxWidth: 'min(300px, 80vw)',
  backgroundColor: '$contextMenuBg',
  color: '$contextMenuFg',
  borderRadius: '$medium',
  padding: '$2',
  boxShadow: '$contextMenu',
});

const StyledDropdownMenuCheckboxItem = styled(DropdownMenuPrimitive.CheckboxItem, itemStyles);
const StyledDropdownMenuItem = styled(DropdownMenuPrimitive.Item, { ...itemStyles, paddingLeft: '$3' });

const StyledDropdownMenuItemIndicator = styled(DropdownMenuPrimitive.ItemIndicator, {
  position: 'absolute',
  left: '$2',
});

const StyledDropdownMenuSeparator = styled(DropdownMenuPrimitive.Separator, {
  height: '1px',
  backgroundColor: '$contextMenuSeperator',
  margin: '$2',
});
const StyledDropdownMenuTrigger = styled(DropdownMenuPrimitive.Trigger, {
  display: 'flex',
  alignItems: 'center',
  padding: '$3',
  gap: '$1',
  borderRadius: '$small',
  backgroundColor: '$bgDefault',
  color: '$fgDefault',
  fontSize: '$xsmall',

  '&:focus-visible, &:hover': {
    outline: 'none',
    boxShadow: 'none',
    backgroundColor: '$bgSubtle',
    borderColor: '$borderDefault',
  },

  variants: {
    bordered: {
      true: {
        border: '1px solid $borderMuted',
      },
    },
  },
});

const StyledDropdownSubmenu = styled(DropdownMenuPrimitive.DropdownMenuGroup, {
  position: 'absolute',
  left: '$2',
});

const StyledDropdownMenuRadioGroup = styled(DropdownMenuPrimitive.RadioGroup, {});

const StyledDropdownMenuRadioItem = styled(DropdownMenuPrimitive.RadioItem, itemStyles);

const StyledDropdownMenuArrow = styled(DropdownMenuPrimitive.Arrow, { fill: '$contextMenuBg' });

const StyledDropdownMenu = styled(DropdownMenuPrimitive.Root, {
});

const StyledScrollDropdownMenuRadioItem = styled(DropdownMenuPrimitive.RadioItem, {
  ...itemStyles,
  padding: '$2 $3 $2 $2',
  userselect: 'none',
  display: 'flex',
  alignItems: 'center',
});

const StyledScrollDropdownMenuItemIndicator = styled(DropdownMenuPrimitive.ItemIndicator, {});

export const DropdownMenuContent = StyledDropdownMenuContent;
export const DropdownMenuCheckboxItem = StyledDropdownMenuCheckboxItem;
export const DropdownMenuRadioGroup = StyledDropdownMenuRadioGroup;
export const DropdownMenuRadioItem = StyledDropdownMenuRadioItem;
export const DropdownMenuTrigger = StyledDropdownMenuTrigger;
export const DropdownMenuSeparator = StyledDropdownMenuSeparator;
export const DropdownMenuItem = StyledDropdownMenuItem;
export const DropdownMenuItemIndicator = StyledDropdownMenuItemIndicator;
export const DropdownMenu = StyledDropdownMenu;
export const DropdownSubmenu = StyledDropdownSubmenu;
export const DropdownMenuArrow = StyledDropdownMenuArrow;
export const ScrollDropdownMenuRadioItem = StyledScrollDropdownMenuRadioItem;
export const ScrollDropdownMenuItemIndicator = StyledScrollDropdownMenuItemIndicator;
