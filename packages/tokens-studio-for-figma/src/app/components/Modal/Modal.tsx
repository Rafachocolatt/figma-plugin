import React from 'react';
import {
  Stack, Dialog, IconButton, Box, Heading,
} from '@tokens-studio/ui';
import { XIcon } from '@primer/octicons-react';
import { ArrowLeft } from 'iconoir-react';
import { ModalFooter } from './ModalFooter';
import { styled } from '@/stitches.config';

export type ModalProps = {
  id?: string;
  title?: string;
  full?: boolean;
  size?: 'large' | 'fullscreen';
  compact?: boolean;
  isOpen?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  stickyFooter?: boolean;
  showClose?: boolean;
  backArrow?: boolean
  close: () => void;
  modal?: boolean;
  onInteractOutside?: (event: Event) => void;
};

const StyledBody = styled('div', {
  position: 'relative',
  padding: '$4',
  overflow: 'auto',
  variants: {
    full: {
      true: {
        padding: 0,
      },
    },
    compact: {
      true: {
        padding: '$4',
      },
    },
  },
});

const StyledDialogContent = styled(Dialog.Content, {
  variants: {
    size: {
      large: {
        width: 'calc(100vw - $7)',
        maxWidth: 'calc(100vw -$7)',
        padding: 0,
        boxShadow: '$contextMenu',
        borderColor: '$borderSubtle',
      },
      fullscreen: {
        width: '100vw',
        maxWidth: '100vw',
        padding: 0,
        height: '100vh',
        maxHeight: '100vh',
        borderRadius: 0,
        boxShadow: 'none',
      },
    },
  },
});

export function Modal({
  id,
  title,
  full,
  size,
  isOpen,
  close,
  children,
  footer,
  stickyFooter = false,
  showClose = false,
  compact = false,
  modal = true,
  backArrow = false,
  onInteractOutside,
}: ModalProps) {
  const handleClose = React.useCallback(() => {
    close();
  }, [close]);

  const handleOnOpenChange = React.useCallback(
    (open) => {
      if (!open) {
        close();
      }
    },
    [close],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange} modal={modal}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Box
          css={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '$modalBackdrop',
          }}
        />
        <StyledDialogContent size={size} onInteractOutside={onInteractOutside}>
          <Box css={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          >
            {(showClose || title || backArrow) && (
            <Stack
              direction="row"
              justify={backArrow ? 'start' : 'between'}
              align="center"
              css={{
                borderBottomColor: '$borderSubtle',
                borderBottomWidth: '1px',
                borderTopLeftRadius: '$medium',
                borderTopRightRadius: '$medium',
                padding: '$4',
                position: 'sticky',
                backgroundColor: '$bgDefault',
                top: 0,
                zIndex: 10,
                gap: '$3',
              }}
            >
              {backArrow && (
                <IconButton
                  onClick={handleClose}
                  data-testid="back-arrow"
                  icon={<ArrowLeft />}
                  size="small"
                  variant="invisible"
                />
              )}
              {title && (
              <Dialog.Title>
                <Heading size="small">{title}</Heading>
              </Dialog.Title>
              )}
              {showClose && (
              <IconButton
                onClick={handleClose || null}
                data-testid="close-button"
                icon={<XIcon />}
                size="small"
                variant="invisible"
              />

              )}
            </Stack>
            )}
            <StyledBody
              compact={compact}
              full={full}
              data-testid={id}
              css={{
                scrollPaddingBlockEnd: footer ? '$8' : 0,
                paddingBlockEnd: footer ? '$8' : 0,
              }}
            >
              {children}
            </StyledBody>
            {!!footer && <ModalFooter stickyFooter={stickyFooter} fullscreen={size === 'fullscreen'}>{footer}</ModalFooter>}
          </Box>
        </StyledDialogContent>
      </Dialog.Portal>
    </Dialog>
  );
}
