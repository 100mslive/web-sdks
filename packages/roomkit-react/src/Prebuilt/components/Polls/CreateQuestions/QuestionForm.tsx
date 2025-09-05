// @ts-check
import React, { useCallback, useRef, useState } from 'react';
import {
  HMSPollQuestionCreateParams,
  HMSPollQuestionOptionCreateParams,
  HMSPollQuestionType,
} from '@100mslive/react-sdk';
import { AddCircleIcon, TrashIcon } from '@100mslive/react-icons';
// import { Button, Dropdown, Flex, IconButton, Input, Switch, Text, TextArea, Tooltip } from '../../../..';
import { Button, Dropdown, Flex, IconButton, Input, Text, TextArea, Tooltip } from '../../../..';
// @ts-ignore
import { DialogDropdownTrigger } from '../../../primitives/DropdownTrigger';
// @ts-ignore
import { DeleteQuestionModal } from './DeleteQuestionModal';
// @ts-ignore
import { useDropdownSelection } from '../../hooks/useDropdownSelection';
// @ts-ignore
import { isValidTextInput } from '../../../common/utils';
import { Line } from '../common/Line';
// @ts-ignore
import { MultipleChoiceOptionInputs } from '../common/MultipleChoiceOptions';
// @ts-ignore
import { SingleChoiceOptionInputs } from '../common/SingleChoiceOptions';
import { QUESTION_TYPE, QUESTION_TYPE_TITLE } from '../../../common/constants';

export const QuestionForm = ({
  question,
  index,
  length,
  onSave,
  removeQuestion,
  isQuiz,
}: {
  question: HMSPollQuestionCreateParams & { draftID: number };
  index: number;
  length: number;
  onSave: (optionParams: HMSPollQuestionCreateParams & { draftID: number; saved: boolean }) => void;
  removeQuestion: () => void;
  isQuiz: boolean;
}) => {
  const ref = useRef(null);
  const selectionBg = useDropdownSelection();
  const [openDelete, setOpenDelete] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<HMSPollQuestionType>(question.type || QUESTION_TYPE.SINGLE_CHOICE);
  const [text, setText] = useState(question.text);
  const [weight, setWeight] = useState(isQuiz ? 10 : 1);
  const [options, setOptions] = useState(
    question?.options || [
      { text: '', isCorrectAnswer: false },
      { text: '', isCorrectAnswer: false },
    ],
  );
  // const [skippable, setSkippable] = useState(false);
  const isValid = isValidQuestion({
    text,
    type,
    options,
    weight,
    isQuiz,
  });

  const handleOptionTextChange = useCallback(
    (index: number, text: string) => {
      setOptions(options => [...options.slice(0, index), { ...options[index], text }, ...options.slice(index + 1)]);
    },
    [setOptions],
  );

  const removeOption = useCallback(
    (index: number) =>
      setOptions(options => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        return newOptions;
      }),
    [setOptions],
  );

  const selectSingleChoiceAnswer = useCallback(
    (answerIndex: number) => {
      if (!isQuiz) {
        return;
      }
      setOptions(options =>
        options.map((option, index) => ({
          ...option,
          isCorrectAnswer: index === answerIndex,
        })),
      );
    },
    [setOptions, isQuiz],
  );

  const selectMultipleChoiceAnswer = useCallback(
    (checked: boolean, index: number) => {
      if (!isQuiz) {
        return;
      }
      setOptions(options => [
        ...options.slice(0, index),
        { ...options[index], isCorrectAnswer: checked },
        ...options.slice(index + 1),
      ]);
    },
    [setOptions, isQuiz],
  );

  return (
    <>
      <Text variant="overline" css={{ c: 'onSurface.low', textTransform: 'uppercase' }}>
        Question {index + 1} of {length}
      </Text>
      <Text variant="body2" css={{ mt: '4', mb: 'md' }}>
        Question Type
      </Text>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <DialogDropdownTrigger
          ref={ref}
          // @ts-ignore
          title={QUESTION_TYPE_TITLE[type]}
          css={{
            backgroundColor: 'surface.bright',
            border: '1px solid $border_bright',
          }}
          open={open}
        />
        <Dropdown.Portal>
          {/* @ts-ignore */}
          <Dropdown.Content align="start" sideOffset={8} css={{ w: ref.current?.clientWidth, zIndex: 1000 }}>
            {Object.keys(QUESTION_TYPE_TITLE).map(value => {
              return (
                <Dropdown.Item
                  key={value}
                  // @ts-ignore
                  onSelect={() => setType(value)}
                  css={{
                    px: '9',
                    bg: type === value ? selectionBg : undefined,
                  }}
                >
                  {/* @ts-ignore */}
                  {QUESTION_TYPE_TITLE[value]}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <TextArea
        maxLength={1024}
        placeholder="Ask a question"
        css={{
          mt: 'md',
          backgroundColor: 'surface.bright',
          border: '1px solid $border_bright',
          minHeight: '14',
          resize: 'vertical',
          maxHeight: '32',
        }}
        value={text}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value.trimStart())}
      />
      <Text variant="xs" css={{ color: 'onSurface.medium', textAlign: 'end', mt: '4' }}>
        {text?.length || 0}/1024
      </Text>
      <Line />
      {/* @ts-ignore */}
      {type === QUESTION_TYPE.SINGLE_CHOICE || type === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <>
          <Text variant="body2" css={{ mb: '6', c: 'onSurface.medium' }}>
            Options
          </Text>

          {isQuiz && (
            <Text variant="xs" css={{ c: 'onSurface.medium', mb: 'md' }}>
              {type === QUESTION_TYPE.SINGLE_CHOICE
                ? 'Use the radio buttons to indicate the correct answer'
                : 'Use the checkboxes to indicate the correct answer(s)'}
            </Text>
          )}

          {type === QUESTION_TYPE.SINGLE_CHOICE && (
            <SingleChoiceOptionInputs
              isQuiz={isQuiz}
              options={options}
              selectAnswer={selectSingleChoiceAnswer}
              handleOptionTextChange={handleOptionTextChange}
              removeOption={removeOption}
            />
          )}

          {type === QUESTION_TYPE.MULTIPLE_CHOICE && (
            <MultipleChoiceOptionInputs
              isQuiz={isQuiz}
              options={options}
              selectAnswer={selectMultipleChoiceAnswer}
              handleOptionTextChange={handleOptionTextChange}
              removeOption={removeOption}
            />
          )}

          {options?.length < 20 && (
            <Flex
              css={{
                c: 'onSurface.medium',
                cursor: 'pointer',
                '&:hover': { c: 'onSurface.high' },
              }}
              onClick={() => setOptions([...options, { text: '', isCorrectAnswer: false }])}
            >
              <AddCircleIcon style={{ position: 'relative', left: '-2px' }} />

              <Text
                variant="sm"
                css={{
                  ml: '4',
                  c: 'inherit',
                }}
              >
                Add an option
              </Text>
            </Flex>
          )}
          <Line />
          {isQuiz ? (
            <>
              <Flex justify="between" align="center" css={{ gap: '6', w: '100%' }}>
                <Text variant="sm" css={{ color: 'onSurface.medium' }}>
                  Point Weightage
                </Text>
                <Input
                  type="number"
                  value={weight}
                  min={1}
                  max={999}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWeight(Math.min(Number(e.target.value), 999))
                  }
                  css={{
                    backgroundColor: 'surface.bright',
                    border: '1px solid $border_bright',
                    maxWidth: '20',
                  }}
                />
              </Flex>
              {/* <Flex justify="between" css={{ mt: 'md', gap: '6', w: '100%' }}>
                <Text variant="sm" css={{ color: 'onSurface.medium' }}>
                  Allow to skip
                </Text>
                <Switch defaultChecked={skippable} onCheckedChange={(checked: boolean) => setSkippable(checked)} />
              </Flex> */}
            </>
          ) : null}
        </>
      ) : null}

      <Flex justify="end" align="center" css={{ mt: '12', gap: '8' }}>
        <IconButton css={{ border: '1px solid $border_bright' }}>
          <TrashIcon onClick={() => setOpenDelete(!open)} />
        </IconButton>
        <Tooltip
          disabled={isValid}
          title={
            options.length < 2
              ? 'At least two options must be added'
              : `Please fill all the fields ${isQuiz ? 'and mark the correct answer(s)' : ''} to continue`
          }
          boxStyle={{ maxWidth: '40' }}
        >
          <Button
            variant="standard"
            disabled={!isValid}
            onClick={() => {
              onSave({
                saved: true,
                text,
                type,
                options,
                skippable: false,
                draftID: question.draftID,
                weight,
              });
            }}
          >
            Save
          </Button>
        </Tooltip>
      </Flex>

      <DeleteQuestionModal open={openDelete} setOpen={setOpenDelete} removeQuestion={removeQuestion} />
    </>
  );
};

export const isValidQuestion = ({
  text,
  type,
  options,
  weight,
  isQuiz = false,
}: {
  text: string;
  type: string;
  options: HMSPollQuestionOptionCreateParams[];
  weight: number;
  isQuiz?: boolean;
}) => {
  if (!isValidTextInput(text) || !type) {
    return false;
  }

  const everyOptionHasText = options.length > 1 && options.every(option => option && isValidTextInput(option.text, 1));
  const hasCorrectAnswer = options.some(option => option.isCorrectAnswer);

  if (!isQuiz) {
    return everyOptionHasText;
  }

  // The minimum acceptable value of weight is 1
  if (isQuiz && weight < 1) {
    return false;
  }

  return everyOptionHasText && hasCorrectAnswer;
};
