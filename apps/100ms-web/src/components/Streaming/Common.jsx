import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CrossIcon,
} from "@100mslive/react-icons";
import {
  Box,
  Flex,
  IconButton,
  slideLeftAndFade,
  Text,
} from "@100mslive/react-ui";

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

export const Container = ({ children }) => {
  return (
    <Box
      css={{
        size: "100%",
        zIndex: 2,
        position: "absolute",
        top: 0,
        left: 0,
        bg: "$surfaceDefault",
        transform: "translateX(10%)",
        animation: `${slideLeftAndFade("10%")} 100ms ease-out forwards`,
      }}
    >
      {children}
    </Box>
  );
};

export const ContentBody = ({ Icon, title, children }) => {
  return (
    <Box css={{ p: "$10" }}>
      <Text>
        <Icon width={40} height={40} />
      </Text>
      <Text css={{ fontWeight: "$semiBold", mt: "$8", mb: "$4" }}>{title}</Text>
      <Text variant="sm" color="$textMedEmp">
        {children}
      </Text>
    </Box>
  );
};
