// @ts-check
import React from "react";
import { CheckIcon } from "@100mslive/react-icons";
import { Checkbox, Flex, Progress, Text } from "@100mslive/react-ui";

export const MultipleChoiceOptions = ({
  options,
  voted,
  totalResponses,
  selectedOptions,
  setSelectedOptions,
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
    <Flex direction="column" css={{ gap: "$md", w: "100%", mb: "$md" }}>
      {options.map(option => {
        const progressValue = (100 * option.voteCount) / totalResponses;
        return (
          <Flex
            align="center"
            key={`${option.text}-${option.index}`}
            css={{ w: "100%", gap: "$9" }}
          >
            <Checkbox.Root
              disabled={voted}
              onCheckedChange={checked =>
                handleCheckedChange(checked, option.index)
              }
              css={{
                cursor: voted ? "not-allowed" : "pointer",
              }}
            >
              <Checkbox.Indicator>
                <CheckIcon width={16} height={16} />
              </Checkbox.Indicator>
            </Checkbox.Root>

            <Flex direction="column" css={{ flexGrow: "1" }}>
              <Flex css={{ w: "100%", mb: voted ? "$4" : "0" }}>
                <Text css={{ display: "flex", flexGrow: "1" }}>
                  {option.text}
                </Text>
                <Text variant="sm" css={{ color: "$textMedEmp" }}>
                  {option.voteCount}&nbsp;
                  {option.voteCount !== 1 ? "votes" : "votes"}
                </Text>
              </Flex>
              {voted ? (
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
  );
};
