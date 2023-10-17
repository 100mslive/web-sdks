// @ts-check
import React, { useCallback } from 'react';
import { CheckIcon } from '@100mslive/react-icons';
import { Checkbox, Flex, Label, Text } from '../../../../';
import { OptionInputWithDelete } from './OptionInputWithDelete';
import { VoteCount } from './VoteCount';
import { VoteProgress } from './VoteProgress';

export const MultipleChoiceOptions = ({
  questionIndex,
  isQuiz,
  options,
  correctOptionIndexes,
  canRespond,
  response,
  totalResponses,
  selectedOptions,
  setSelectedOptions,
  showVoteCount,
}) => {
  const handleCheckedChange = (checked, index) => {
    const newSelected = new Set(selectedOptions);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedOptions(newSelected);
  };

  return (
    <Flex direction="column" css={{ gap: '$md', w: '100%', mb: '$md' }}>
      {options.map(option => {
        const isCorrectAnswer = isQuiz && correctOptionIndexes?.includes(option.index);

        return (
          <Flex align="center" key={`${questionIndex}-${option.index}`} css={{ w: '100%', gap: '$9' }}>
            <Checkbox.Root
              id={`${questionIndex}-${option.index}`}
              disabled={!canRespond}
              checked={response?.options?.includes(option.index)}
              onCheckedChange={checked => handleCheckedChange(checked, option.index)}
              css={{
                cursor: canRespond ? 'pointer' : 'not-allowed',
              }}
            >
              <Checkbox.Indicator>
                <CheckIcon width={16} height={16} />
              </Checkbox.Indicator>
            </Checkbox.Root>

            <Flex direction="column" css={{ flexGrow: '1' }}>
              <Flex css={{ w: '100%' }}>
                <Text css={{ display: 'flex', flexGrow: '1' }}>
                  <Label htmlFor={`${questionIndex}-${option.index}`}>{option.text}</Label>
                </Text>
                {showVoteCount && (
                  <VoteCount isQuiz={isQuiz} isCorrectAnswer={isCorrectAnswer} voteCount={option.voteCount} />
                )}
              </Flex>
              {showVoteCount && <VoteProgress option={option} totalResponses={totalResponses} />}
            </Flex>
          </Flex>
        );
      })}
    </Flex>
  );
};

export const MultipleChoiceOptionInputs = ({ isQuiz, options, setOptions }) => {
  const selectAnswer = useCallback(
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

  return (
    <Flex direction="column" css={{ gap: '$md', w: '100%', mb: '$md' }}>
      {options.map((option, index) => {
        return (
          <Flex align="center" key={index} css={{ w: '100%', gap: '$5' }}>
            {isQuiz && (
              <Checkbox.Root
                onCheckedChange={checked => selectAnswer(checked, index)}
                checked={option.isCorrectAnswer}
                css={{
                  cursor: 'pointer',
                  width: '$9',
                }}
              >
                <Checkbox.Indicator>
                  <CheckIcon width={16} height={16} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            )}
            <OptionInputWithDelete
              index={index}
              option={option}
              handleOptionTextChange={handleOptionTextChange}
              removeOption={removeOption}
            />
          </Flex>
        );
      })}
    </Flex>
  );
};
