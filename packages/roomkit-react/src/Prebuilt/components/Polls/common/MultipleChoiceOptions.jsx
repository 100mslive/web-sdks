// @ts-check
import React from 'react';
import { CheckCircleIcon, CheckIcon } from '@100mslive/react-icons';
import { Checkbox, Flex, Label, Text } from '../../../../';
import { OptionInputWithDelete } from './OptionInputWithDelete';
import { VoteCount } from './VoteCount';
import { VoteProgress } from './VoteProgress';

export const MultipleChoiceOptions = ({
  questionIndex,
  options,
  canRespond,
  totalResponses,
  selectedOptions,
  setSelectedOptions,
  showVoteCount,
  isQuiz,
  correctOptionIndexes,
  localPeerResponse,
  isStopped,
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
        return (
          <Flex align="center" key={`${questionIndex}-${option.index}`} css={{ w: '100%', gap: '$4' }}>
            {!isStopped || !isQuiz ? (
              <Checkbox.Root
                id={`${questionIndex}-${option.index}`}
                disabled={!canRespond}
                checked={localPeerResponse?.options?.includes(option.index)}
                onCheckedChange={checked => handleCheckedChange(checked, option.index)}
                css={{
                  cursor: canRespond ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
              >
                <Checkbox.Indicator>
                  <CheckIcon width={16} height={16} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            ) : null}

            {isStopped && correctOptionIndexes?.includes(option.index) ? (
              <Flex align="center" css={{ color: '$on_surface_high' }}>
                <CheckCircleIcon height={20} width={20} />
              </Flex>
            ) : null}

            <Flex direction="column" css={{ flexGrow: '1' }}>
              <Flex css={{ w: '100%' }}>
                <Text css={{ display: 'flex', flexGrow: '1' }}>
                  <Label htmlFor={`${questionIndex}-${option.index}`} css={{ color: 'inherit' }}>
                    {option.text}
                  </Label>
                </Text>
                {showVoteCount && <VoteCount voteCount={option.voteCount} />}
              </Flex>
              {showVoteCount && <VoteProgress option={option} totalResponses={totalResponses} />}
            </Flex>

            {isStopped && isQuiz && localPeerResponse?.options.includes(option.index) ? (
              <Text variant="sm" css={{ color: '$on_surface_medium', maxWidth: 'max-content' }}>
                Your Answer
              </Text>
            ) : null}
          </Flex>
        );
      })}
    </Flex>
  );
};

export const MultipleChoiceOptionInputs = ({ isQuiz, options, selectAnswer, handleOptionTextChange, removeOption }) => {
  return (
    <Flex direction="column" css={{ gap: '$md', w: '100%', mb: '$md' }}>
      {options.map((option, index) => {
        return (
          <Flex align="center" key={index} css={{ w: '100%', gap: '$4' }}>
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
