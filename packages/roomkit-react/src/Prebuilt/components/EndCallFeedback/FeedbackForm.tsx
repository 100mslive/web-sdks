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

export const FEEBACK_INDEX = {
  THANK_YOU: -10,
  INIT: -1,
};
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
    setIndex(FEEBACK_INDEX.INIT);
  };
  const avoidDefaultDomBehavior = (e: Event) => {
    e.preventDefault();
  };
  if (isMobile) {
    return (
      <Sheet.Root open={index !== FEEBACK_INDEX.INIT} onOpenChange={onOpenChange}>
        <Sheet.Content
          style={{
            backgroundColor: 'var(--hms-ui-colors-surface_dim)',
            padding: 'var(--hms-ui-spacing-10)',
            overflowY: 'auto',
          }}
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
        >
          <FeedbackContent ratings={ratings} indexSelected={index} setIndex={setIndex} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }
  return (
    <Dialog.Root open={index !== FEEBACK_INDEX.INIT} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{ bg: 'surface.dim', width: '528px', p: '12' }}
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
  const { feedback } = useRoomLayoutLeaveScreen();
  const { endpoints } = useHMSPrebuiltContext();
  const isMobile = useMedia(cssConfig.media.md);
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
          question: `${feedback?.title} | ${ratings[indexSelected].question || ''}`,
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
    setIndex(FEEBACK_INDEX.THANK_YOU);
  };
  return (
    <Flex
      css={{
        p: indexSelected === FEEBACK_INDEX.INIT ? '$12 !important' : '0',
        bg: 'surface.dim',
        r: '3',
        gap: '10',
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
      <Button
        type="submit"
        icon
        css={{
          alignSelf: isMobile ? '' : 'end',
        }}
        onClick={submitFeedback}
      >
        {feedback?.submit_btn_label || 'Submit Feedback'}
      </Button>
    </Flex>
  );
};
export const FeedbackHeader = ({
  onEmojiClicked,
  ratings,
  indexSelected = FEEBACK_INDEX.INIT,
}: {
  onEmojiClicked: (index: number) => void;
  ratings: Rating[];
  indexSelected?: number;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
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
            variant={isMobile ? 'h6' : 'h5'}
            css={{
              c: 'onSurface.high',
              fontStyle: 'normal',
            }}
          >
            {feedback?.title || 'How was your experience?'}
          </Text>
          <Text
            variant={isMobile ? 'body2' : 'body1'}
            css={{
              c: 'onSurface.medium',
              opacity: 0.9,
              fontWeight: 'regular',
            }}
          >
            {feedback?.sub_title || 'Your answers help us improve the quality.'}
          </Text>
        </Flex>
        {indexSelected !== FEEBACK_INDEX.INIT ? (
          <CrossIcon width="24px" height="24px" color="white" onClick={() => onEmojiClicked(FEEBACK_INDEX.INIT)} />
        ) : null}
      </Flex>
      <Flex
        justify="between"
        css={{
          gap: '17',
          c: 'onSurface.high',
          '@md': {
            gap: '0',
          },
        }}
      >
        {ratings.map((element, index) => {
          return (
            <Flex
              align="center"
              direction="column"
              css={{
                c:
                  indexSelected === index || indexSelected === FEEBACK_INDEX.INIT
                    ? 'onSurface.high'
                    : '$on_surface_default',
                gap: '4',
              }}
              onClick={() => onEmojiClicked(index)}
              key={`${index}`}
            >
              <Text
                css={{
                  fontWeight: 'semiBold',
                  fontSize: 'h4',
                  pb: '1',
                  cursor: 'pointer',
                  opacity: indexSelected === index || indexSelected === FEEBACK_INDEX.INIT ? 1 : 0.2,
                  '@md': {
                    fontSize: 'h5',
                  },
                }}
              >
                {element.emoji}
              </Text>
              <Text
                variant={isMobile ? 'body2' : 'body1'}
                css={{
                  c:
                    indexSelected === index || indexSelected === FEEBACK_INDEX.INIT
                      ? 'onSurface.medium'
                      : 'onSurface.low',
                  fontWeight: 'regular',
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
            gap: '4',
          }}
        >
          <Text
            variant="sub2"
            css={{
              c: 'onSurface.high',
              fontWeight: 'semiBold',
              fontSize: 'sm',
              px: '2',
            }}
          >
            {rating.question || 'What do you like/dislike here?'}
          </Text>
          <Flex
            css={{
              alignItems: 'flex-start',
              alignSelf: 'stretch',
              flexWrap: 'wrap',
              gap: '6',
              flex: '1 1 calc(25% - 12px)',
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
                <Flex
                  align="center"
                  gap="2"
                  key={index}
                  css={{
                    border: '1px solid border.bright',
                    r: '1',
                    p: '6',
                  }}
                >
                  <Checkbox.Root
                    id={`${option}-${index}`}
                    checked={selectedReasons.has(index)}
                    onCheckedChange={(checked: boolean) => handleCheckedChange(checked, index)}
                    css={{
                      cursor: 'pointer',
                      flexShrink: 0,
                      bg: 'onSecondary.low',
                      border: '1px solid border.bright',
                    }}
                  >
                    <Checkbox.Indicator>
                      <CheckIcon width={12} height={12} />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label
                    htmlFor={`${option}-${index}`}
                    css={{
                      color: 'onSurface.high',
                      fontSize: 'sm',
                      fontWeight: 'regular',
                      lineHeight: '20px' /* 142.857% */,
                    }}
                  >
                    {option}
                  </Label>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      )}
      {feedback?.comment && (
        <Flex
          direction="column"
          css={{
            gap: '4',
          }}
        >
          <Text
            variant="body2"
            css={{
              c: 'onSurface.high',
              fontWeight: 'regular',
              fontSize: 'sm',
            }}
          >
            {feedback?.comment.label || 'Additional comments (optional)'}
          </Text>
          <TextArea
            maxLength={1024}
            placeholder={feedback?.comment.placeholder || 'Tell us more...'}
            css={{
              backgroundColor: 'surface.bright',
              border: '1px solid border.bright',
              resize: 'none',
              height: '36',
              display: 'flex',
            }}
            value={comment}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value.trimStart())}
          />
        </Flex>
      )}
    </>
  );
};
