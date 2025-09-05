// @ts-check
import React from 'react';
import { CheckCircleIcon } from '@100mslive/react-icons';
import { Flex, Label, RadioGroup, Text } from '../../../..';
import { OptionInputWithDelete } from './OptionInputWithDelete';
import { VoteCount } from './VoteCount';
import { VoteProgress } from './VoteProgress';

export const SingleChoiceOptions = ({
  questionIndex,
  options,
  canRespond,
  setAnswer,
  totalResponses,
  showVoteCount,
  correctOptionIndex,
  isStopped,
  isQuiz,
  localPeerResponse,
}) => {
  return (
    <RadioGroup.Root value={localPeerResponse?.option} onValueChange={value => setAnswer(value)}>
      <Flex direction="column" css={{ gap: 'md', w: '100%', mb: 'md' }}>
        {options.map(option => {
          return (
            <Flex align="center" key={`${questionIndex}-${option.index}`} css={{ w: '100%', gap: '4' }}>
              {!isStopped || !isQuiz ? (
                <RadioGroup.Item
                  css={{
                    background: 'none',
                    h: '9',
                    w: '9',
                    border: '2px solid',
                    borderColor: 'onSurface.high',
                    display: 'flex',
                    flexShrink: 0,
                    pt: '1',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: canRespond ? 'pointer' : 'not-allowed',
                    '&[data-state="checked"]': {
                      borderColor: 'primary.bright',
                      borderWidth: '2px',
                    },
                  }}
                  disabled={!canRespond}
                  value={option.index}
                  id={`${questionIndex}-${option.index}`}
                >
                  <RadioGroup.Indicator
                    css={{
                      h: '80%',
                      w: '80%',
                      background: '$primary_bright',
                      borderRadius: 'round',
                    }}
                  />
                </RadioGroup.Item>
              ) : null}

              {isStopped && correctOptionIndex === option.index && isQuiz ? (
                <Flex css={{ color: 'onSurface.high' }}>
                  <CheckCircleIcon height={20} width={20} />
                </Flex>
              ) : null}

              <Flex direction="column" css={{ flexGrow: '1' }}>
                <Flex css={{ w: '100%' }}>
                  <Text css={{ display: 'flex', flexGrow: '1', color: 'onSurface.high' }}>
                    <Label style={{ color: 'inherit' }} htmlFor={`${questionIndex}-${option.index}`}>
                      {option.text}
                    </Label>
                  </Text>
                  {showVoteCount && <VoteCount voteCount={option.voteCount} />}
                </Flex>
                {showVoteCount && <VoteProgress option={option} totalResponses={totalResponses} />}
              </Flex>
              {isStopped && isQuiz && localPeerResponse?.option === option.index ? (
                <Text variant="sm" css={{ color: 'onSurface.medium', maxWidth: 'max-content' }}>
                  Your Answer
                </Text>
              ) : null}
            </Flex>
          );
        })}
      </Flex>
    </RadioGroup.Root>
  );
};

export const SingleChoiceOptionInputs = ({ isQuiz, options, selectAnswer, handleOptionTextChange, removeOption }) => {
  const correctOptionIndex = options.findIndex(option => option.isCorrectAnswer);

  return (
    <RadioGroup.Root value={correctOptionIndex} onValueChange={selectAnswer}>
      <Flex direction="column" css={{ gap: 'md', w: '100%', mb: 'md' }}>
        {options.map((option, index) => {
          return (
            <Flex align="center" key={`option-${index}`} css={{ w: '100%', gap: '4' }}>
              {isQuiz && (
                <RadioGroup.Item
                  css={{
                    background: 'none',
                    w: '9',
                    border: '2px solid',
                    borderColor: 'onSurface.high',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&[data-state="checked"]': {
                      borderColor: 'primary.bright',
                      borderWidth: '2px',
                    },
                  }}
                  value={index}
                >
                  <RadioGroup.Indicator
                    css={{
                      h: '80%',
                      w: '80%',
                      background: '$primary_bright',
                      borderRadius: 'round',
                    }}
                  />
                </RadioGroup.Item>
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
    </RadioGroup.Root>
  );
};
