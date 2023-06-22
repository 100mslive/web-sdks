// @ts-check
import React, { useRef, useState } from "react";
import { isEqual } from "lodash";
import { useHMSActions } from "@100mslive/react-sdk";
import { AddCircleIcon, TrashIcon } from "@100mslive/react-icons";
import {
  Button,
  Dropdown,
  Flex,
  IconButton,
  Input,
  Text,
} from "@100mslive/react-ui";
import { ErrorDialog } from "../../primitives/DialogContent";
import { DialogDropdownTrigger } from "../../primitives/DropdownTrigger";
import { Container, ContentHeader } from "../Streaming/Common";
import { useDropdownSelection } from "../hooks/useDropdownSelection";
import { POLL_QUESTION_TYPE, QUESTION_TYPE } from "../../common/constants";

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

export function LaunchPollsQuizMenu({ id, onStart, onBack }) {
  const [questions, setQuestions] = useState([{}]);
  const actions = useHMSActions();

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
    onStart();
  };

  return (
    <Container rounded>
      <ContentHeader content="Poll" onBack={onBack} />
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
        Question {index + 1} of {length}:{" "}
        {POLL_QUESTION_TYPE[question.type].replace("-", " ")}
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
      <Text variant="overline" css={{ c: "$textDisabled" }}>
        Question {index + 1} of {length}
      </Text>
      <Text variant="body2" css={{ mt: "$4", mb: "$md" }}>
        Question Type
      </Text>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <DialogDropdownTrigger
          ref={ref}
          title={POLL_QUESTION_TYPE[type]}
          open={open}
        />
        <Dropdown.Portal>
          <Dropdown.Content
            align="start"
            sideOffset={8}
            css={{ w: ref.current?.clientWidth, zIndex: 1000 }}
          >
            {Object.keys(POLL_QUESTION_TYPE).map(value => {
              return (
                <Dropdown.Item
                  key={value}
                  onSelect={() => setType(value)}
                  css={{
                    px: "$9",
                    bg: type === value ? selectionBg : undefined,
                  }}
                >
                  {POLL_QUESTION_TYPE[value]}
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
      <Flex justify="between" css={{ my: "$xs" }}>
        <IconButton onClick={() => setOpenDelete(!open)}>
          <TrashIcon />
        </IconButton>
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
      >
        <Text>Are you sure you want to delete this question?</Text>
        <Flex justify="end" align="end" gap="2" css={{ w: "100%", mt: "$10" }}>
          <Button variant="standard" onClick={() => setOpenDelete(false)}>
            Cancel
          </Button>
          <Button
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
