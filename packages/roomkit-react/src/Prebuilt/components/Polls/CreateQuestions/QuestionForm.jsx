// @ts-check
import React, { useCallback, useRef, useState } from 'react';
import { AddCircleIcon, TrashIcon } from '@100mslive/react-icons';
import { Button, Dropdown, Flex, Input, Switch, Text, Tooltip } from '../../../../';
import IconButton from '../../../IconButton';
import { DialogDropdownTrigger } from '../../../primitives/DropdownTrigger';
import { DeleteQuestionModal } from './DeleteQuestionModal';
import { useDropdownSelection } from '../../hooks/useDropdownSelection';
import { isValidTextInput } from '../../../common/utils';
import { MultipleChoiceOptionInputs } from '../common/MultipleChoiceOptions';
import { SingleChoiceOptionInputs } from '../common/SingleChoiceOptions';
import { QUESTION_TYPE, QUESTION_TYPE_TITLE } from '../../../common/constants';

const Line = () => <Flex css={{ w: '100%', borderBottom: '1px solid $border_bright', h: '1px', my: '$8' }} />;

export const QuestionForm = ({ question, index, length, onSave, removeQuestion, isQuiz }) => {
  const ref = useRef(null);
  const selectionBg = useDropdownSelection();
  const [openDelete, setOpenDelete] = useState(false);
  // const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(question.type || QUESTION_TYPE.SINGLE_CHOICE);
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(
    question?.options || [
      { text: '', isCorrectAnswer: false },
      { text: '', isCorrectAnswer: false },
    ],
  );
  const [skippable, setSkippable] = useState(false);
  const isValid = isValidQuestion({
    text,
    type,
    options,
    isQuiz,
  });

  const handleOptionTextChange = useCallback(
    (index, text) => {
      setOptions(options => [...options.slice(0, index), { ...options[index], text }, ...options.slice(index + 1)]);
    },
    [setOptions],
  );

  const removeOption = useCallback(
    index =>
      setOptions(options => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        return newOptions;
      }),
    [setOptions],
  );

  const selectSingleChoiceAnswer = useCallback(
    answerIndex => {
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
    (checked, index) => {
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
      <Text variant="overline" css={{ c: '$on_surface_low', textTransform: 'uppercase' }}>
        Question {index + 1} of {length}
      </Text>
      <Text variant="body2" css={{ mt: '$4', mb: '$md' }}>
        Question Type
      </Text>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <DialogDropdownTrigger
          ref={ref}
          title={QUESTION_TYPE_TITLE[type]}
          css={{
            backgroundColor: '$surface_bright',
            border: '1px solid $border_bright',
          }}
          open={open}
        />
        <Dropdown.Portal>
          <Dropdown.Content align="start" sideOffset={8} css={{ w: ref.current?.clientWidth, zIndex: 1000 }}>
            {Object.keys(QUESTION_TYPE_TITLE).map(value => {
              return (
                <Dropdown.Item
                  key={value}
                  onSelect={() => setType(value)}
                  css={{
                    px: '$9',
                    bg: type === value ? selectionBg : undefined,
                  }}
                >
                  {QUESTION_TYPE_TITLE[value]}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <Input
        placeholder="Ask a question"
        css={{
          mt: '$md',
          backgroundColor: '$surface_bright',
          border: '1px solid $border_bright',
        }}
        autoFocus
        type="text"
        value={text}
        onChange={event => setText(event.target.value)}
      />

      <Line />

      {/* {type === QUESTION_TYPE.SHORT_ANSWER && isQuiz ? (
        <Input ref={inputRef} placeholder="Enter the answer" onBlur={e => acceptTextAnswer(inputRef.current?.value)} />
      ) : null} */}

      {type === QUESTION_TYPE.SINGLE_CHOICE || type === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <>
          <Text variant="body2" css={{ mb: '$6', c: '$on_surface_medium' }}>
            Options
          </Text>

          {isQuiz && (
            <Text variant="xs" css={{ c: '$on_surface_medium', mb: '$md' }}>
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
                c: '$on_surface_medium',
                cursor: 'pointer',
                '&:hover': { c: '$on_surface_high' },
              }}
              onClick={() => setOptions([...options, { text: '', isCorrectAnswer: false }])}
            >
              <AddCircleIcon style={{ position: 'relative', left: '-2px' }} />

              <Text
                variant="body1"
                css={{
                  ml: '$4',
                  c: 'inherit',
                }}
              >
                Add an option
              </Text>
            </Flex>
          )}

          <Line />

          <Flex justify="between" css={{ gap: '$6', w: '100%' }}>
            <Text variant="sm" css={{ color: '$on_surface_medium' }}>
              Allow to skip
            </Text>
            <Switch defaultChecked={skippable} onCheckedChange={checked => setSkippable(checked)} />
          </Flex>
        </>
      ) : null}

      <Flex justify="end" align="center" css={{ mt: '$12', w: '100%', gap: '$4' }}>
        <IconButton css={{ background: 'none' }} onClick={() => setOpenDelete(!open)}>
          <TrashIcon />
        </IconButton>
        <Tooltip
          disabled={isValid}
          title={
            options.length === 0
              ? 'At least one option is required for a question'
              : `Please fill all the fields ${isQuiz ? 'and mark the correct answer(s)' : ''} to continue`
          }
          boxCss={{ maxWidth: '$40' }}
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
                skippable,
                draftID: question.draftID,
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

export const isValidQuestion = ({ text, type, options, isQuiz = false }) => {
  if (!isValidTextInput(text) || !type) {
    return false;
  }

  if (![QUESTION_TYPE.SINGLE_CHOICE, QUESTION_TYPE.MULTIPLE_CHOICE].includes(type)) {
    return true;
  }

  const everyOptionHasText = options.length > 0 && options.every(option => option && isValidTextInput(option.text, 1));
  const hasCorrectAnswer = options.some(option => option.isCorrectAnswer);

  if (!isQuiz) {
    return everyOptionHasText;
  }

  return everyOptionHasText && hasCorrectAnswer;
};
