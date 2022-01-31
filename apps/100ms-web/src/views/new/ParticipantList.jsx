import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  IconButton,
  DropdownItemSeparator,
} from "@100mslive/react-ui";
import { ChevronDownIcon } from "@100mslive/react-icons";

export const ParticipantList = () => {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <IconButton
          css={{
            mr: "$2",
            height: "max-content",
            alignSelf: "center",
            display: "none",
            "@md": { display: "block" },
          }}
        >
          <ChevronDownIcon />
        </IconButton>
      </DropdownTrigger>
      <DropdownContent sideOffset={5} align="end">
        <DropdownItem>Hello</DropdownItem>
        <DropdownItem>Test</DropdownItem>
        <DropdownItemSeparator />
        <DropdownItem>Test1</DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
};
