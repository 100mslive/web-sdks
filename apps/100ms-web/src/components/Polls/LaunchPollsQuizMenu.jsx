import React, { useState } from "react";
import {
  AddCircleIcon,
  ChevronUpIcon,
  TrashIcon,
} from "@100mslive/react-icons";
import {
  Button,
  Dropdown,
  Flex,
  IconButton,
  Input,
  Text,
} from "@100mslive/react-ui";
import { ErrorDialog } from "../../primitives/DialogContent";
import { Container, ContentHeader } from "../Streaming/Common";

export function LaunchPollsQuizMenu({ onBack }) {
  return (
    <Container rounded>
      <ContentHeader content="Poll" onBack={onBack} />
      <Flex direction="column" css={{ p: "$10" }}>
        <Flex direction="column">
          <QuestionCard />
        </Flex>
        <Flex css={{ c: "$textDisabled", my: "$md", cursor: "pointer" }}>
          <AddCircleIcon />
          <Text variant="body1" css={{ ml: "$md", c: "$textDisabled" }}>
            Add another question
          </Text>
        </Flex>

        <Flex css={{ w: "100%" }} justify="end">
          <Button>Launch Poll</Button>
        </Flex>
      </Flex>
    </Container>
  );
}

const questionTypes = ["Single Choice", "Multiple Choice"];

const QuestionCard = () => {
  const [questionType, setQuestionType] = useState("Single Choice");
  const [openDelete, setOpenDelete] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <Flex direction="column" css={{ p: "$md", bg: "$surfaceLight", r: "$1" }}>
      <Text variant="overline" css={{ c: "$textDisabled" }}>
        {"Question 1 of 1".toUpperCase()}
      </Text>
      <Text variant="body2" css={{ mt: "$4", mb: "$md" }}>
        Question Type
      </Text>
      <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
        <Dropdown.Trigger
          asChild
          data-testid="participant_more_actions"
          css={{
            p: "$2",
            r: "$0",
            border: "$space$px solid $borderLight",
            c: "$textHighEmp",
          }}
          tabIndex={0}
        >
          <Flex justify="between" align="center">
            <Text variant="body1">{questionType}</Text>
            <Flex
              css={{
                transform: !open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease-in-out",
              }}
            >
              <ChevronUpIcon />
            </Flex>
          </Flex>
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
      <Input placeholder="Ask a question" css={{ mt: "$md" }} />
      <Text variant="body2" css={{ my: "$md", c: "$textMedEmp" }}>
        Options
      </Text>
      <Input placeholder="Option 1" css={{ mb: "$md" }} />
      <Flex css={{ c: "$textMedEmp", cursor: "pointer" }}>
        <AddCircleIcon />
        <Text variant="body1" css={{ ml: "$9", c: "$textMedEmp" }}>
          Add Option
        </Text>
      </Flex>
      <Flex justify="between">
        <IconButton onClick={() => setOpenDelete(!open)}>
          <TrashIcon />
        </IconButton>
        <Button variant="standard">Save</Button>
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
