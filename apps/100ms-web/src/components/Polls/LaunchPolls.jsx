import React, { useState } from "react";
import {
  AddCircleIcon,
  QuestionIcon,
  StatsIcon,
  TrashIcon,
} from "@100mslive/react-icons";
import {
  Flex,
  Input,
  Switch,
  Text,
  Button,
  Dropdown,
  IconButton,
} from "@100mslive/react-ui";
import { Container, ContentHeader } from "../Streaming/Common";
import { ErrorDialog } from "../../primitives/DialogContent";

function LaunchPolls() {
  return (
    <Container rounded>
      <ContentHeader content="Launch Poll" />
      <Flex direction="column" css={{ p: "$10" }}>
        <Flex direction="column">
          <QuestionCard></QuestionCard>
        </Flex>
        <Flex>
          <Button>Launch Poll</Button>
        </Flex>
      </Flex>
    </Container>
  );
}

export default LaunchPolls;

const questionTypes = ["Single Choice", "Multiple Choice"];

const QuestionCard = () => {
  const [questionType, setQuestionType] = useState("Single Choice");
  const [openDelete, setOpenDelete] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <Flex direction="column">
      <Text variant="overline">Question 1 of 1</Text>
      <Text variant="body2">Question Type</Text>
      <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
        <Dropdown.Trigger
          asChild
          data-testid="participant_more_actions"
          css={{ p: "$2", r: "$0" }}
          tabIndex={0}
        >
          <Text>{questionType}</Text>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" sideOffset={8} css={{ w: "$64" }}>
            {questionTypes.map(type => (
              <Dropdown.Item onClick={() => setQuestionType(type)}>
                <Text css={{ ml: "$4" }}>{type}</Text>
              </Dropdown.Item>
            ))}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <Input placeholder="Ask a question" />
      <Text>Options</Text>
      <Input placeholder="Option 1" />
      <Flex>
        <AddCircleIcon />
        <Text>Add Option</Text>
      </Flex>
      <Flex>
        <IconButton onClick={() => setOpenDelete(!open)}>
          <TrashIcon />
        </IconButton>
        <Button standard="standard">Save</Button>
      </Flex>
      <ErrorDialog
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Question"
      >
        <Text>Are you sure you want to delete this question?</Text>
      </ErrorDialog>
    </Flex>
  );
};
