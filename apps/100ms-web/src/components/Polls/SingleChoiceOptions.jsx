import { Flex, Progress, RadioGroup, Text } from "@100mslive/react-ui";
import { Votes } from "./OptionComponents/Votes";

export const SingleChoiceOptions = ({
  options = [
    { text: "A", voters: ["Alex Kar", "San France", "Rachel"] },
    { text: "B", voters: ["Boris Johnson", "James Franco"] },
    { text: "C", voters: [] },
  ],
  voted,
}) => {
  const totalVotes = 5;
  return (
    <RadioGroup.Root>
      <Flex direction="column" css={{ gap: "$md", w: "100%", mb: "$md" }}>
        {options.map((option, index) => (
          <Flex
            align="center"
            key={`${option.text}-${index}`}
            css={{ w: "100%", gap: "$9" }}
          >
            <RadioGroup.Item
              css={{
                background: "none",
                border: "2px solid $textHighEmp",
                cursor: voted ? "not-allowed" : "pointer",
              }}
              disabled={voted}
              value={option.text}
            >
              <RadioGroup.Indicator />
            </RadioGroup.Item>

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
        ))}
      </Flex>
    </RadioGroup.Root>
  );
};
