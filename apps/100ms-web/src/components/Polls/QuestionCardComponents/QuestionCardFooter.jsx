import { Flex, Button, Text } from "@100mslive/react-ui";

export const QuestionCardFooter = ({isSkippable, voted, stringAnswerExpected, setVoted}) => {
  return (
    <Flex align="center" justify="end" css={{ gap: "$4", w: "100%" }}>
      {isSkippable && !voted ? (
        <Button
          variant="standard"
          css={{ p: "$xs $10", fontWeight: "$semiBold" }}
        >
          Skip
        </Button>
      ) : null}

      {voted ? (
        <Text css={{ fontWeight: "$semiBold", color: "$textMedEmp" }}>
          {stringAnswerExpected ? "Submitted" : "Voted"}
        </Text>
      ) : (
        <Button
          css={{ p: "$xs $10", fontWeight: "$semiBold" }}
          onClick={() => setVoted(true)}
        >
          {stringAnswerExpected ? "Submit" : "Vote"}
        </Button>
      )}
    </Flex>
  );
};
