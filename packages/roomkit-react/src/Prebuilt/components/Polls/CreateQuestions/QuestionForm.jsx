// @ts-check
import React, { useRef, useState } from 'react';
import { AddCircleIcon, TrashIcon } from '@100mslive/react-icons';
import { Box, Button, Dropdown, Flex, Input, Switch, Text, Tooltip } from '../../../../';
import { DialogDropdownTrigger } from '../../../primitives/DropdownTrigger';
import { DeleteQuestionModal } from './DeleteQuestionModal';
import { useDropdownSelection } from '../../hooks/useDropdownSelection';
import { isValidTextInput } from '../../../common/utils';
import { MultipleChoiceOptionInputs } from '../common/MultipleChoiceOptions';
import { SingleChoiceOptionInputs } from '../common/SingleChoiceOptions';
import { QUESTION_TYPE, QUESTION_TYPE_TITLE } from '../../../common/constants';

export const QuestionForm = ({ question, index, length, onSave, removeQuestion, isQuiz }) => {
  const ref = useRef(null);
  const selectionBg = useDropdownSelection();
  const [openDelete, setOpenDelete] = useState(false);
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
        type="text"
        value={text}
        onChange={event => setText(event.target.value)}
      />
      {type === QUESTION_TYPE.SINGLE_CHOICE || type === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <>
          <Text variant="body2" css={{ my: '$6', c: '$on_surface_medium' }}>
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
            <SingleChoiceOptionInputs isQuiz={isQuiz} options={options} setOptions={setOptions} />
          )}

          {type === QUESTION_TYPE.MULTIPLE_CHOICE && (
            <MultipleChoiceOptionInputs isQuiz={isQuiz} options={options} setOptions={setOptions} />
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
          {isQuiz ? (
            <Flex css={{ mt: '$md', gap: '$6' }}>
              <Switch defaultChecked={skippable} onCheckedChange={checked => setSkippable(checked)} />
              <Text variant="sm" css={{ color: '$on_surface_medium' }}>
                Not required to answer
              </Text>
            </Flex>
          ) : null}
        </>
      ) : null}

      <Flex justify="between" align="center" css={{ mt: '$12' }}>
        <Box
          css={{
            color: '$on_surface_medium',
            cursor: 'pointer',
            '&:hover': { color: '$on_surface_high' },
          }}
        >
          <TrashIcon onClick={() => setOpenDelete(!open)} />
        </Box>
        <Tooltip
          disabled={isValid}
          title={`Please fill all the fields ${isQuiz ? 'and mark the correct answer(s)' : ''} to continue`}
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

  const everyOptionHasText = options.every(option => option && isValidTextInput(option.text, 1));
  const hasCorrectAnswer = options.some(option => option.isCorrectAnswer);

  if (!isQuiz) {
    return everyOptionHasText;
  }

  return everyOptionHasText && hasCorrectAnswer;
};
