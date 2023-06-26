// @ts-check
import React, { useRef, useState } from "react";
import { isEqual } from "lodash";
import { useHMSActions } from "@100mslive/react-sdk";
import { AddCircleIcon, TrashIcon } from "@100mslive/react-icons";
import { Box, Button, Dropdown, Flex, Input, Text } from "@100mslive/react-ui";
import { ErrorDialog } from "../../primitives/DialogContent";
import { DialogDropdownTrigger } from "../../primitives/DropdownTrigger";
import { Container, ContentHeader } from "../Streaming/Common";
import { useWidgetState } from "../AppData/useUISettings";
import { useDropdownSelection } from "../hooks/useDropdownSelection";
import {
  QUESTION_TYPE,
  QUESTION_TYPE_TITLE,
  WIDGET_VIEWS,
} from "../../common/constants";

const isValidQuestion = ({ text, type, options }) => {
  if (!text) {
    return false;
  }

  if (
    type === QUESTION_TYPE.SINGLE_CHOICE ||
    type === QUESTION_TYPE.MULTIPLE_CHOICE
  ) {
    return options.every(option => option && option.length > 0);
  } else {
    return true;
  }
};

export function LaunchPollsQuizMenu() {
  const [questions, setQuestions] = useState([{}]);
  const actions = useHMSActions();
  const { pollInView: id, setWidgetView } = useWidgetState();

  const launchPoll = async () => {
    await actions.interactivityCenter.addQuestionsToPoll(
      id,
      questions
        .filter(question => isValidQuestion(question))
        .map(question => ({
          text: question.text,
          type: question.type,
          options: question.options?.map(option => ({ text: option })),
        }))
    );
    await actions.interactivityCenter.startPoll(id);
    setWidgetView(WIDGET_VIEWS.VOTE);
  };

  return (
    <Container rounded>
      <ContentHeader
        content="Poll"
        onBack={() => setWidgetView(WIDGET_VIEWS.CREATE_POLL_QUIZ)}
      />
      <Flex direction="column" css={{ p: "$10" }}>
        <Flex direction="column">
          {questions.map((question, index) => (
            <QuestionCard
              key={index}
              question={question}
              index={index}
              length={questions.length}
              onSave={questionParams => {
                const newQuestions = [...questions];
                newQuestions[index] = questionParams;
                setQuestions(newQuestions);
              }}
              removeQuestion={() =>
                setQuestions(prev =>
                  prev.filter(
                    questionFromSet => !isEqual(question, questionFromSet)
                  )
                )
              }
            />
          ))}
        </Flex>
        <Flex
          css={{ c: "$textDisabled", my: "$sm", cursor: "pointer" }}
          onClick={() => setQuestions([...questions, {}])}
        >
          <AddCircleIcon />
          <Text variant="body1" css={{ ml: "$md", c: "$textDisabled" }}>
            Add another question
          </Text>
        </Flex>

        <Flex css={{ w: "100%" }} justify="end">
          <Button onClick={launchPoll}>Launch Poll</Button>
        </Flex>
      </Flex>
    </Container>
  );
}

const QuestionCard = ({ question, onSave, index, length, removeQuestion }) => {
  return (
    <Flex
      direction="column"
      css={{ p: "$md", bg: "$surfaceLight", r: "$1", mb: "$sm" }}
    >
      {question.saved ? (
        <SavedQuestion question={question} index={index} length={length} />
      ) : (
        <QuestionForm
          question={question}
          removeQuestion={removeQuestion}
          onSave={params => {
            onSave(params);
          }}
          index={index}
          length={length}
        />
      )}
    </Flex>
  );
};

const SavedQuestion = ({ question, index, length }) => {
  return (
    <>
      <Text variant="overline" css={{ c: "$textDisabled" }}>
        Question {index + 1} of {length}: {QUESTION_TYPE_TITLE[question.type]}
      </Text>
      <Text variant="body2" css={{ mt: "$4", mb: "$md" }}>
        {question.text}
      </Text>
      {question.options.map(option => (
        <Text variant="body2" css={{ my: "$md", c: "$textMedEmp" }}>
          {option}
        </Text>
      ))}
    </>
  );
};

const QuestionForm = ({ question, index, length, onSave, removeQuestion }) => {
  const ref = useRef(null);
  const selectionBg = useDropdownSelection();
  const [openDelete, setOpenDelete] = useState(false);
  const [open, setOpen] = useState(false);

  const [type, setType] = useState(
    question.type || QUESTION_TYPE.SINGLE_CHOICE
  );
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(question.options || ["", ""]);

  return (
    <>
      <Text
        variant="overline"
        css={{ c: "$textDisabled", textTransform: "uppercase" }}
      >
        Question {index + 1} of {length}
      </Text>
      <Text variant="body2" css={{ mt: "$4", mb: "$md" }}>
        Question Type
      </Text>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <DialogDropdownTrigger
          ref={ref}
          title={QUESTION_TYPE_TITLE[type]}
          open={open}
        />
        <Dropdown.Portal>
          <Dropdown.Content
            align="start"
            sideOffset={8}
            css={{ w: ref.current?.clientWidth, zIndex: 1000 }}
          >
            {Object.keys(QUESTION_TYPE_TITLE).map(value => {
              return (
                <Dropdown.Item
                  key={value}
                  onSelect={() => setType(value)}
                  css={{
                    px: "$9",
                    bg: type === value ? selectionBg : undefined,
                  }}
                >
                  {QUESTION_TYPE_TITLE[value]}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <Input
        placeholder="Ask a question"
        css={{ mt: "$md" }}
        value={text}
        onChange={event => setText(event.target.value)}
      />
      {type === "single-choice" || type === "multiple-choice" ? (
        <>
          <Text variant="body2" css={{ my: "$md", c: "$textMedEmp" }}>
            Options
          </Text>
          {options.map((option, index) => (
            <Input
              placeholder={`Option ${index + 1}`}
              css={{ mb: "$md" }}
              key={index}
              value={option}
              onChange={event => {
                const newOptions = [...options];
                newOptions[index] = event.target.value;
                setOptions(newOptions);
              }}
            />
          ))}
          <Flex css={{ c: "$textMedEmp", cursor: "pointer" }}>
            <AddCircleIcon />
            <Text
              variant="body1"
              css={{ ml: "$9", c: "$textMedEmp" }}
              onClick={() => setOptions([...options, ""])}
            >
              Add Option
            </Text>
          </Flex>
        </>
      ) : null}
      <Flex justify="between" align="center" css={{ mt: "$12" }}>
        <Box
          css={{
            color: "$textMedEmp",
            cursor: "pointer",
            "&:hover": { color: "$textHighEmp" },
          }}
        >
          <TrashIcon onClick={() => setOpenDelete(!open)} />
        </Box>
        <Button
          variant="standard"
          disabled={!isValidQuestion({ text, type, options })}
          onClick={() => {
            onSave({ saved: true, text, type, options });
          }}
        >
          Save
        </Button>
      </Flex>
      <ErrorDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Delete question?"
        css={{ w: "$80", p: "$10", backgroundColor: "#201617" }}
      >
        <Text variant="sm" css={{ color: "$textMedEmp" }}>
          Are you sure you want to delete this question? This action cannot be
          undone.
        </Text>
        <Flex css={{ w: "100%", mt: "$12", gap: "$md" }}>
          <Button
            variant="standard"
            outlined
            onClick={() => setOpenDelete(false)}
            css={{ w: "100%", fontSize: "$md", fontWeight: "$semiBold" }}
          >
            Cancel
          </Button>
          <Button
            css={{ w: "100%", fontSize: "$md", fontWeight: "$semiBold" }}
            variant="danger"
            onClick={() => {
              removeQuestion();
              setOpenDelete(false);
            }}
          >
            Delete
          </Button>
        </Flex>
      </ErrorDialog>
    </>
  );
};
