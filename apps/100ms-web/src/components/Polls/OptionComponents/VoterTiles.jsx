import { Flex, Avatar, Box, Text } from "@100mslive/react-ui";

export const VoterTiles = ({ voters, hiddenVotersCount }) => {
  return (
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
  );
};
