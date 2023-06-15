import { Text } from "@100mslive/react-ui";

export const VoteCount = ({ count }) => (
  <Text variant="sm" css={{ color: "$textMedEmp" }}>
    {count}&nbsp;
    {count && count !== 1 ? "votes" : "votes"}
  </Text>
);
