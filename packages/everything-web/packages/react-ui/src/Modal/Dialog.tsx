import { Root, Trigger } from '@radix-ui/react-dialog';
import { styled } from '@stitches/react';
import React from 'react';
import type * as Stitches from '@stitches/react';
import { DialogClose, DialogContent } from './DialogContent';

const StyledDialog = styled(Root, {});

type DialogProps = Stitches.VariantProps<typeof StyledDialog>;

export const Dialog: React.FC<DialogProps> & {
    Close: typeof DialogClose;
    Content: typeof DialogContent;
    Trigger: typeof Trigger;
} = (props) => <StyledDialog {...props} />;

Dialog.Close = DialogClose;
Dialog.Content = DialogContent;
Dialog.Trigger = Trigger;

Dialog.displayName = 'Dialog';
