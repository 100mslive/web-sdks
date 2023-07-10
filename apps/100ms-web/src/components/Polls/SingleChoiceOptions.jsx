// @ts-check
import React, { useCallback } from "react";
import { Flex, Input, Progress, RadioGroup, Text } from "@100mslive/react-ui";

export const SingleChoiceOptions = ({
  options,
  response,
  setAnswer,
  totalResponses,
}) => {
  return (
    <RadioGroup.Root
      value={response?.option}
      onValueChange={value => setAnswer(value)}
    >
      <Flex direction="column" css={{ gap: "$md", w: "100%", mb: "$md" }}>
        {options.map(option => {
          const progressValue = (100 * option.voteCount) / totalResponses;

          return (
            <Flex
              align="center"
              key={`${option.text}-${option.index}`}
              css={{ w: "100%", gap: "$9" }}
            >
              <RadioGroup.Item
                css={{
                  background: "none",
                  h: "$9",
                  w: "$9",
                  border: "2px solid",
                  borderColor: "$textHighEmp",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: response ? "not-allowed" : "pointer",
                  '&[data-state="checked"]': {
                    borderColor: "$primaryLight",
                    borderWidth: "2px",
                  },
                }}
                disabled={!!response}
                value={option.index}
              >
                <RadioGroup.Indicator
                  css={{
                    h: "80%",
                    w: "80%",
                    background: "$primaryLight",
                    borderRadius: "$round",
                  }}
                />
              </RadioGroup.Item>

              <Flex direction="column" css={{ flexGrow: "1" }}>
                <Flex css={{ w: "100%", mb: response ? "$4" : "0" }}>
                  <Text css={{ display: "flex", flexGrow: "1" }}>
                    {option.text}
                  </Text>
                  {response && (
                    <Text variant="sm" css={{ color: "$textMedEmp" }}>
                      {option.voteCount}&nbsp;
                      {option.voteCount !== 1 ? "votes" : "votes"}
                    </Text>
                  )}
                </Flex>

                {response ? (
                  <Progress.Root value={progressValue}>
                    <Progress.Content
                      style={{
                        transform: `translateX(-${100 - progressValue}%)`,
                      }}
                    />
                  </Progress.Root>
                ) : null}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </RadioGroup.Root>
  );
};

export const SingleChoiceOptionInputs = ({ isQuiz, options, setOptions }) => {
  const selectAnswer = useCallback(
    answerIndex => {
      if (!isQuiz) {
        return;
      }
      setOptions(options =>
        options.map((option, index) => ({
          ...option,
          isCorrectAnswer: index === answerIndex,
        }))
      );
    },
    [setOptions, isQuiz]
  );

  return (
    <RadioGroup.Root onValueChange={selectAnswer}>
      <Flex direction="column" css={{ gap: "$md", w: "100%", mb: "$md" }}>
        {options.map((option, index) => {
          return (
            <Flex
              align="center"
              key={`option-${index}`}
              css={{ w: "100%", gap: "$9" }}
            >
              {isQuiz && (
                <RadioGroup.Item
                  css={{
                    background: "none",
                    h: "$9",
                    w: "$9",
                    border: "2px solid",
                    borderColor: "$textHighEmp",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    '&[data-state="checked"]': {
                      borderColor: "$primaryLight",
                      borderWidth: "2px",
                    },
                  }}
                  value={index}
                >
                  <RadioGroup.Indicator
                    css={{
                      h: "80%",
                      w: "80%",
                      background: "$primaryLight",
                      borderRadius: "$round",
                    }}
                  />
                </RadioGroup.Item>
              )}

              <Input
                placeholder={`Option ${index + 1}`}
                css={{ w: "100%" }}
                value={option?.text || ""}
                key={index}
                onChange={event => {
                  setOptions(options => [
                    ...options.slice(0, index),
                    { ...options[index], text: event.target.value },
                    ...options.slice(index + 1),
                  ]);
                }}
              />
            </Flex>
          );
        })}
      </Flex>
    </RadioGroup.Root>
  );
};
