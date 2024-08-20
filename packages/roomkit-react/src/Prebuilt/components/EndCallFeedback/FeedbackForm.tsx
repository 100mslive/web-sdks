import React from 'react';
import { useMedia } from 'react-use';
import { CheckIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Checkbox } from '../../../Checkbox';
import { Label } from '../../../Label';
import { Flex } from '../../../Layout';
import { Dialog } from '../../../Modal';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { TextArea } from '../../../TextArea';
import { config as cssConfig } from '../../../Theme';

export const FeedbackModal = ({
  ratings,
  index,
  setIndex,
}: {
  ratings: any[];
  index: number;
  setIndex: (index: number) => void;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
  const onOpenChange = () => {
    setIndex(-1);
  };
  if (isMobile) {
    return (
      <Sheet.Root open={index !== -1} onOpenChange={onOpenChange}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$12' }}>
          <FeedbackContent ratings={ratings} indexSelected={index} setIndex={setIndex} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }
  return (
    <Dialog.Root open={index !== -1} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ bg: '$surface_dim', maxWidth: '528px', p: '$8' }}>
          <FeedbackContent ratings={ratings} indexSelected={index} setIndex={setIndex} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const FeedbackContent = ({
  ratings,
  indexSelected,
  setIndex,
}: {
  ratings: any[];
  indexSelected: number;
  setIndex: (index: number) => void;
}) => {
  return (
    <Flex
      css={{
        p: indexSelected === -1 ? '$12 !important' : '0',
        border: '1px solid $border_default',
        bg: '$surface_dim',
        r: '$3',
        gap: '$10',
      }}
      direction="column"
    >
      <FeedbackHeader ratings={ratings} indexSelected={indexSelected} onEmojiClicked={setIndex} />
      <FeedbackForm rating={ratings[indexSelected]} />
      <SubmitFeedback />
    </Flex>
  );
};
export const FeedbackHeader = ({
  onEmojiClicked,
  ratings,
  indexSelected = -1,
}: {
  onEmojiClicked: (index: number) => void;
  ratings: any[];
  indexSelected?: number;
}) => {
  return (
    <>
      <Flex align="center">
        <Flex
          direction="column"
          css={{
            flex: '1 1 0',
          }}
        >
          <Text
            variant="h5"
            css={{
              c: '$on_surface_high',
            }}
          >
            How was your experience?
          </Text>
          <Text
            variant="body1"
            css={{
              c: '$on_surface_medium',
              opacity: 0.9,
              fontWeight: '$regular',
            }}
          >
            Your answers help us improve the quality.
          </Text>
        </Flex>
        {indexSelected !== -1 ? (
          <CrossIcon width="24px" height="24px" color="white" onClick={() => onEmojiClicked(-1)} />
        ) : null}
      </Flex>
      <Flex
        justify="between"
        css={{
          gap: '$17',
          c: '$on_surface_high',
        }}
      >
        {ratings.map((element, index) => {
          return (
            <Flex
              align="center"
              direction="column"
              css={{
                c: indexSelected === index || indexSelected === -1 ? '$on_surface_high' : '$on_surface_default',
              }}
              onClick={() => onEmojiClicked(index)}
            >
              <Text
                css={{
                  fontWeight: '$semiBold',
                  fontSize: '$h4',
                  pb: '$1',
                  opacity: indexSelected === index || indexSelected === -1 ? 1 : 0.2,
                }}
              >
                {element.emoji}
              </Text>
              <Text
                variant="body1"
                css={{
                  c: indexSelected === index || indexSelected === -1 ? '$on_surface_medium' : '$on_surface_low',
                  fontWeight: '$regular',
                }}
              >
                {element.label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </>
  );
};
export const FeedbackForm = ({ rating }: { rating: any }) => {
  return (
    <>
      <Flex
        direction="column"
        css={{
          gap: '$4',
        }}
      >
        <Text
          variant="sub2"
          css={{
            c: '$on_surface_high',
            fontWeight: '$semiBold',
            fontSize: '$sm',
            px: '$2',
          }}
        >
          {rating.question}
        </Text>
        <Flex
          justify="between"
          css={{
            r: '$2',
            border: '1px solid $border_bright',
            alignItems: 'center',
            gap: '$3',
            p: '$6',
            flexWrap: 'wrap',
            flex: '1 1 calc(33.333% - 12px)',
            '@md': {
              flex: '1 1 calc(50% - 12px)',
            },
            '@sm': {
              flex: '1 1 100%',
            },
          }}
        >
          {rating.reasons.map((option: string) => {
            return (
              <Flex align="center" gap="2">
                <Checkbox.Root
                  css={{
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Checkbox.Indicator>
                    <CheckIcon width={16} height={16} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <Label>{option}</Label>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      <Flex direction="column">
        <Text
          variant="body2"
          css={{
            c: '$on_surface_high',
            fontWeight: '$regular',
            fontSize: '$sm',
          }}
        >
          Additional comments (optional)
        </Text>
        <TextArea
          maxLength={1024}
          placeholder="Ask a question"
          css={{
            mt: '$md',
            backgroundColor: '$surface_bright',
            border: '1px solid $border_bright',
            minHeight: '$14',
            resize: 'vertical',
            maxHeight: '$32',
          }}
          // value={"here"}
          // onChange={event => setText(event.target.value.trimStart())}
        />
      </Flex>
    </>
  );
};

export const SubmitFeedback = () => {
  return (
    <Button
      type="submit"
      icon
      css={{
        alignSelf: 'end',
      }}
    >
      Submit Feedback
    </Button>
  );
};
