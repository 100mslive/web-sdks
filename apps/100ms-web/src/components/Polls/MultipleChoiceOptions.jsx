import { CheckIcon } from "@100mslive/react-icons";
import { Flex, Text, Checkbox, Progress } from "@100mslive/react-ui";
import { Votes } from "./OptionComponents/Votes";

export const MultipleChoiceOptions = ({
  options = [
    { text: "A", voters: ["Alex Kar", "San France", "Rachel"] },
    { text: "B", voters: ["Boris Johnson", "James Franco"] },
    { text: "C", voters: [] },
  ],
  voted,
}) => {
  const totalVotes = 5;

  return (
    <Flex direction="column" css={{ gap: "$md", w: "100%", mb: "$md" }}>
      {options.map((option, index) => {
        const progressValue = (100 * option.voters.length) / totalVotes;
        return (
          <Flex
            align="center"
            key={`${option.text}-${index}`}
            css={{ w: "100%", gap: "$9" }}
          >
            <Checkbox.Root
              disabled={voted}
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
                {voted ? <Votes voters={option.voters || []} /> : ""}
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
