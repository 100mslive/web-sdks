import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CrossIcon,
} from "@100mslive/react-icons";
import { Box, Flex, IconButton, Text } from "@100mslive/react-ui";

export const StreamCard = ({ title, subtitle, Icon, css = {}, onClick }) => {
  return (
    <Flex
      css={{
        w: "100%",
        p: "$10",
        r: "$1",
        cursor: "pointer",
        bg: "$surfaceLight",
        mb: "$10",
        mt: "$8",
        ...css,
      }}
      onClick={onClick}
    >
      <Text css={{ alignSelf: "center", p: "$4" }}>
        <Icon width={40} height={40} />
      </Text>
      <Box css={{ flex: "1 1 0", mx: "$8" }}>
        <Text variant="h6" css={{ mb: "$4" }}>
          {title}
        </Text>
        <Text variant="sm">{subtitle}</Text>
      </Box>
      <Text css={{ alignSelf: "center" }}>
        <ChevronRightIcon />
      </Text>
    </Flex>
  );
};

export const ContentHeader = ({ onBack, title, content }) => {
  return (
    <Flex css={{ w: "100%", py: "$8", px: "$10", cursor: "pointer" }}>
      <Text
        css={{ p: "$2", bg: "$surfaceLight", r: "$round", alignSelf: "center" }}
        onClick={onBack}
      >
        <ChevronLeftIcon width={16} height={16} />
      </Text>
      <Box css={{ flex: "1 1 0", mx: "$8" }}>
        <Text variant="sm">{title}</Text>
        <Text variant="h6">{content}</Text>
      </Box>
      <IconButton onClick={onBack} css={{ alignSelf: "flex-start" }}>
        <CrossIcon width={16} height={16} />
      </IconButton>
    </Flex>
  );
};
