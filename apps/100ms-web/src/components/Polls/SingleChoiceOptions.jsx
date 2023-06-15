import { Box, Flex, RadioGroup, Text } from "@100mslive/react-ui";
import { ProgressBar } from "./OptionComponents/ProgressBar";
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
            <RadioGroup.Item disabled={voted} value={option.text}>
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
                <ProgressBar
                  w={`${(100 * option.voters.length) / totalVotes}%`}
                />
              ) : null}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </RadioGroup.Root>
  );
};
