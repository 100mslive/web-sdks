import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { Rating } from '@100mslive/types-prebuilt/elements/feedback';
import { useHMSActions } from '@100mslive/react-sdk';
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
import { useHMSPrebuiltContext } from '../../AppContext';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const FeedbackModal = ({
  ratings,
  index,
  setIndex,
}: {
  ratings: Rating[];
  index: number;
  setIndex: (index: number) => void;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
  const onOpenChange = () => {
    setIndex(-1);
  };
  const avoidDefaultDomBehavior = (e: Event) => {
    e.preventDefault();
  };
  if (isMobile) {
    return (
      <Sheet.Root open={index !== -1} onOpenChange={onOpenChange}>
        <Sheet.Content
          css={{ bg: '$surface_dim', p: '$12' }}
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
        >
          <FeedbackContent ratings={ratings} indexSelected={index} setIndex={setIndex} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }
  return (
    <Dialog.Root open={index !== -1} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{ bg: '$surface_dim', maxWidth: '528px', p: '$8' }}
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
        >
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
  ratings: Rating[];
  indexSelected: number;
  setIndex: (index: number) => void;
}) => {
  const { endpoints } = useHMSPrebuiltContext();
  const hmsActions = useHMSActions();
  const [comment, setComment] = useState('');
  const [selectedReasons, setSelectedReasons] = useState(new Set<number>());
  const handleCheckedChange = (checked: boolean | string, index: number) => {
    const newSelected = new Set(selectedReasons);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedReasons(newSelected);
  };
  const submitFeedback = async () => {
    if (indexSelected < 0 || ratings.length <= indexSelected) {
      return;
    }
    try {
      const reasons = [...selectedReasons].map((value: number) => ratings[indexSelected]?.reasons?.[value] || '');
      await hmsActions.submitSessionFeedback(
        {
          question: ratings[indexSelected].question,
          rating: ratings[indexSelected].value || 1,
          min_rating: 1,
          max_rating: ratings.length,
          reasons: selectedReasons.size === 0 ? [] : reasons,
          comment: comment,
        },
        endpoints?.event,
      );
    } catch (e) {
      console.error(e);
    }
    // always submit and take it to thankyou page
    setIndex(-10);
  };
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
      <FeedbackHeader
        ratings={ratings}
        indexSelected={indexSelected}
        onEmojiClicked={(value: number) => {
          setSelectedReasons(new Set<number>());
          setIndex(value);
        }}
      />
      <FeedbackForm
        rating={ratings[indexSelected]}
        comment={comment}
        setComment={setComment}
        selectedReasons={selectedReasons}
        handleCheckedChange={handleCheckedChange}
      />
      <SubmitFeedback onSubmitFeedback={submitFeedback} />
    </Flex>
  );
};
export const FeedbackHeader = ({
  onEmojiClicked,
  ratings,
  indexSelected = -1,
}: {
  onEmojiClicked: (index: number) => void;
  ratings: Rating[];
  indexSelected?: number;
}) => {
  const { feedback } = useRoomLayoutLeaveScreen();
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
            {feedback?.title || 'How was your experience?'}
          </Text>
          <Text
            variant="body1"
            css={{
              c: '$on_surface_medium',
              opacity: 0.9,
              fontWeight: '$regular',
            }}
          >
            {feedback?.sub_title || 'Your answers help us improve the quality.'}
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
              key={`${index}`}
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
export const FeedbackForm = ({
  rating,
  comment,
  setComment,
  selectedReasons,
  handleCheckedChange,
}: {
  rating: Rating;
  comment: string;
  setComment: (value: string) => void;
  selectedReasons: Set<number>;
  handleCheckedChange: (checked: string | boolean, index: number) => void;
}) => {
  const { feedback } = useRoomLayoutLeaveScreen();
  return (
    <>
      {rating.reasons && rating.reasons.length > 0 && (
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
            {rating.question || 'What do you like/unlike here?'}
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
            {rating.reasons.map((option: string, index: number) => {
              return (
                <Flex align="center" gap="2" key={`${index}`}>
                  <Checkbox.Root
                    id={`${option}-${index}`}
                    checked={selectedReasons.has(index)}
                    onCheckedChange={checked => handleCheckedChange(checked, index)}
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
      )}
      {feedback?.comment && (
        <Flex direction="column">
          <Text
            variant="body2"
            css={{
              c: '$on_surface_high',
              fontWeight: '$regular',
              fontSize: '$sm',
            }}
          >
            {feedback?.comment.label || 'Additional comments (optional)'}
          </Text>
          <TextArea
            maxLength={1024}
            placeholder={feedback?.comment.placeholder || 'Ask a question'}
            css={{
              mt: '$md',
              backgroundColor: '$surface_bright',
              border: '1px solid $border_bright',
              minHeight: '$14',
              resize: 'vertical',
              maxHeight: '$32',
            }}
            value={comment}
            onChange={event => setComment(event.target.value.trimStart())}
          />
        </Flex>
      )}
    </>
  );
};

export const SubmitFeedback = ({ onSubmitFeedback }: { onSubmitFeedback: () => void }) => {
  const { feedback } = useRoomLayoutLeaveScreen();
  return (
    <Button
      type="submit"
      icon
      css={{
        alignSelf: 'end',
      }}
      onClick={onSubmitFeedback}
    >
      {feedback?.submit_btn_label || 'Submit Feedback'}
    </Button>
  );
};
