import React, {
  useCallback, useContext, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton } from '@tokens-studio/ui';
import { styled } from '@stitches/react';
import { editProhibitedSelector } from '@/selectors';
import { DragControlsContext } from '@/context';
import { StyledDragButton } from '../StyledDragger/StyledDragButton';
import { DragGrabber } from '../StyledDragger/DragGrabber';
import Text from '../Text';
import Box from '../Box';
import Input from '../Input';
import IconPencil from '@/icons/pencil.svg';
import { Dispatch } from '@/app/store';

type Props = React.PropsWithChildren<{
  groupName: string
  label: string
  setIsGroupEditing: (value: boolean) => void
}>;

export function ThemeListGroupHeader({
  groupName,
  label,
  setIsGroupEditing,
}: Props) {
  const dispatch = useDispatch<Dispatch>();
  const dragContext = useContext(DragControlsContext);
  const editProhibited = useSelector(editProhibitedSelector);
  const [currentGroupName, setCurrentGroupName] = useState(label);
  const [isEditing, setIsEditing] = useState(false);
  const handleDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragContext.controls?.start(event);
  }, [dragContext.controls]);

  const handleEditButtonClick = useCallback(() => {
    setIsEditing(true);
    setIsGroupEditing(true);
  }, [setIsEditing, setIsGroupEditing]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      dispatch.tokenState.updateThemeGroupName(groupName, currentGroupName);
      setIsEditing(false);
      setIsGroupEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setIsGroupEditing(false);
    }
  }, [currentGroupName, groupName, dispatch.tokenState, setIsEditing, setIsGroupEditing]);

  const handleGroupNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGroupName(event.target.value);
  }, []);

  const StyledDragGrabber = styled(DragGrabber, {
    gridArea: 'handle',
  });

  return (
    <StyledDragButton
      type="button"
      css={{
        display: 'grid',
        cursor: 'inherit',
        '&:not(:first-of-type)': { marginTop: '$4' },
      }}
    >
      <StyledDragGrabber
        item={groupName}
        canReorder={!editProhibited}
        onDragStart={handleDragStart}
      />
      <Box css={{
        display: 'inherit',
        alignItems: 'center',
        gridTemplateColumns: 'min-content min-content',
        '& > div > button ': {
          display: 'none',
        },
        '&:hover > div > button ': {
          display: 'block',
        },
      }}
      >
        {!isEditing ? (
          <>
            <Text css={{
              color: '$fgMuted', height: '$controlSmall', display: 'flex', alignItems: 'center',
            }}
            >
              {label}
            </Text>
            <IconButton
              onClick={handleEditButtonClick}
              icon={<IconPencil />}
              size="small"
              variant="invisible"
              tooltip="Rename group"
            />
          </>
        ) : (
          <Input
            type="text"
            name={`groupName-${groupName}`}
            value={currentGroupName}
            onChange={handleGroupNameChange}
            onKeyDown={handleKeyDown}
            autofocus
          />
        )}
      </Box>
    </StyledDragButton>
  );
}
