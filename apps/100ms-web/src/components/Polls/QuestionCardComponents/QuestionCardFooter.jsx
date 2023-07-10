import { Button, Flex, Text } from "@100mslive/react-ui";

export const QuestionCardFooter = ({
  skippable,
  response,
  stringAnswerExpected,
  handleVote,
  skipQuestion,
}) => {
  return (
    <Flex align="center" justify="end" css={{ gap: "$4", w: "100%" }}>
      {skippable && !response ? (
        <Button
          variant="standard"
          onClick={skipQuestion}
          css={{ p: "$xs $10", fontWeight: "$semiBold" }}
        >
          Skip
        </Button>
      ) : null}

      {response ? (
        <Text css={{ fontWeight: "$semiBold", color: "$textMedEmp" }}>
          {response.skipped
            ? "Skipped"
            : stringAnswerExpected
            ? "Submitted"
            : "Voted"}
        </Text>
      ) : (
        <Button
          css={{ p: "$xs $10", fontWeight: "$semiBold" }}
          onClick={() => handleVote()}
        >
          {stringAnswerExpected ? "Submit" : "Vote"}
        </Button>
      )}
    </Flex>
  );
};
