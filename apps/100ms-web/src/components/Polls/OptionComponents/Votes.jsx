import { Avatar, Box, Text, Flex } from "@100mslive/react-ui";

export const Votes = ({ voters }) => {
  const hiddenVotersCount = voters.length > 2 ? voters.length - 2 : 0;

  return (
    <Flex align="center" css={{ gap: "$4" }}>
      <Text variant="sm" css={{ color: "$textMedEmp" }}>
        {voters.length}&nbsp;
        {voters.length && voters.length !== 1 ? "votes" : "votes"}
      </Text>
      <Flex align="center">
        {voters.length
          ? voters.slice(0, 2).map((voter, index) => (
              <Avatar
                name={voter}
                css={{
                  position: "relative",
                  transform: "unset",
                  left: `${index * -1}px`,
                  fontSize: "$tiny",
                  size: "$9",
                  p: "$4",
                }}
              />
            ))
          : null}
        {hiddenVotersCount ? (
          <Box
            css={{
              backgroundColor: "$secondaryDefault",
              borderRadius: "$round",
              position: "relative",
              left: "-3px",
              p: "$2 $3",
            }}
          >
            <Text
              variant="caption"
              css={{
                fontWeight: "$semiBold",
                color: "$textHighEmp",
                fontSize: "9px",
              }}
            >
              +{hiddenVotersCount}
            </Text>
          </Box>
        ) : null}
      </Flex>
    </Flex>
  );
};
