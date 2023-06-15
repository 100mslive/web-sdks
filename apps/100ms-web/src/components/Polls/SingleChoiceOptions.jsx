import { Box, Flex, RadioGroup, Text } from "@100mslive/react-ui";
import { ProgressBar } from "./OptionComponents/ProgressBar";
import { VoteCount } from "./OptionComponents/VoteCount";

export const SingleChoiceOptions = ({
  options = [
    { text: "A", voters: ["Alex Kar", "San France", "Rachel"] },
    { text: "B", voters: [] },
    { text: "C", voters: [] },
  ],
  voted,
}) => {
  const totalVotes = 3;
  return options.map((option, index) => (
    <Flex
      key={`${option.text}-${index}`}
      css={{ w: "100%", gap: "$9", mb: "$md" }}
    >
      <RadioGroup.Root>
        <RadioGroup.Item value="">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
      </RadioGroup.Root>

      <Box css={{ w: "100%" }}>
        <Flex css={{ w: "100%" }}>
          <Text css={{ display: "flex", flexGrow: "1" }}>{option.text}</Text>
          {voted ? <VoteCount count={option.voters.length} /> : ""}
          {/* AvatarList */}
        </Flex>
        {voted ? (
          <ProgressBar w={`${(100 * option.voters.length) / totalVotes}%`} />
        ) : null}
      </Box>
    </Flex>
  ));
};
