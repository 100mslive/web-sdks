import React from 'react';
import data from '@emoji-mart/data/sets/14/apple.json';
import Picker from '@emoji-mart/react';

type EmojiSelection = { native: string };

/**
 * The @emoji-mart/react Picker plus its ~470 KB apple emoji set. Split into its own module so it
 * is only fetched when the user opens the chat emoji popover, instead of on the conference path.
 */
export default function EmojiPickerContent({ onSelect }: { onSelect: (emoji: EmojiSelection) => void }) {
  return <Picker onEmojiSelect={onSelect} data={data} previewPosition="none" skinPosition="search" />;
}
