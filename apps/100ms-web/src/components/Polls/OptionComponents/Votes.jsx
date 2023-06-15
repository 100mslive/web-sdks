import { Avatar, Box, Text, Flex, Tooltip } from "@100mslive/react-ui";

export const Votes = ({ voters }) => {
  const hiddenVotersCount = voters.length > 2 ? voters.length - 2 : 0;

  return (
    <Flex align="center" css={{ gap: "$4" }}>
      <Text variant="sm" css={{ color: "$textMedEmp" }}>
        {voters.length}&nbsp;
        {voters.length && voters.length !== 1 ? "votes" : "votes"}
      </Text>
      <Tooltip
        side="bottom"
        align="start"
        disabled={hiddenVotersCount === 0}
        boxCss={{
          backgroundColor: "$surfaceLighter",
          borderRadius: "$1",
          p: "$4 $6",
          top: "$2",
          zIndex: "20",
          minWidth: "$44",
        }}
        title={voters.map((voter, index) => (
          <Flex
            align="center"
            key={`${voter}-${index}`}
            css={{ gap: "$4", py: "$2" }}
          >
            <Avatar
              name={voter}
              css={{
                position: "relative",
                transform: "unset",
                fontSize: "$tiny",
                size: "$9",
                p: "$4",
              }}
            />
            <Text
              variant="xs"
              css={{ color: "$textMedEmp", fontWeight: "$semiBold" }}
            >
              {voter}
            </Text>
          </Flex>
        ))}
      >
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
                    zIndex: "5",
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
      </Tooltip>
    </Flex>
  );
};
