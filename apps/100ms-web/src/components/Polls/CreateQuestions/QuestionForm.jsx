// @ts-check
import React, { useRef, useState } from "react";
import { AddCircleIcon, TrashIcon } from "@100mslive/react-icons";
import {
  Box,
  Button,
  Dropdown,
  Flex,
  Input,
  Switch,
  Text,
} from "@100mslive/react-ui";
import { ErrorDialog } from "../../../primitives/DialogContent";
import { DialogDropdownTrigger } from "../../../primitives/DropdownTrigger";
import { useDropdownSelection } from "../../hooks/useDropdownSelection";
import { validTextInput } from "../../../common/utils";
import { MultipleChoiceOptionInputs } from "../common/MultipleChoiceOptions";
import { SingleChoiceOptionInputs } from "../common/SingleChoiceOptions";
import { QUESTION_TYPE, QUESTION_TYPE_TITLE } from "../../../common/constants";

export const QuestionForm = ({
  question,
  index,
  length,
  onSave,
  removeQuestion,
  isQuiz,
}) => {
  const ref = useRef(null);
  const selectionBg = useDropdownSelection();
  const [openDelete, setOpenDelete] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(
    question.type || QUESTION_TYPE.SINGLE_CHOICE
  );
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState(
    question?.options || [
      { text: "", isCorrectAnswer: false },
      { text: "", isCorrectAnswer: false },
    ]
  );
  const [skippable, setSkippable] = useState(true);

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
        type="text"
        value={text}
        onChange={event => setText(event.target.value)}
      />
      {type === QUESTION_TYPE.SINGLE_CHOICE ||
      type === QUESTION_TYPE.MULTIPLE_CHOICE ? (
        <>
          <Text variant="body2" css={{ my: "$md", c: "$textMedEmp" }}>
            Options{" "}
            {isQuiz && (
              <Text variant="xs" css={{ c: "$textMedEmp" }}>
                (Use checkboxes to indicate correct answers)
              </Text>
            )}
          </Text>
          {type === QUESTION_TYPE.SINGLE_CHOICE && (
            <SingleChoiceOptionInputs
              isQuiz={isQuiz}
              options={options}
              setOptions={setOptions}
            />
          )}
          {type === QUESTION_TYPE.MULTIPLE_CHOICE && (
            <MultipleChoiceOptionInputs
              isQuiz={isQuiz}
              options={options}
              setOptions={setOptions}
            />
          )}
          <Flex
            css={{
              c: "$textMedEmp",
              cursor: "pointer",
              "&:hover": { c: "$textHighEmp" },
            }}
            onClick={() =>
              setOptions([...options, { text: "", isCorrectAnswer: false }])
            }
          >
            <AddCircleIcon />
            <Text
              variant="body1"
              css={{
                ml: "$9",
                c: "inherit",
              }}
            >
              Add Option
            </Text>
          </Flex>
          {isQuiz ? (
            <Flex css={{ mt: "$md" }}>
              <Switch
                css={{ mr: "$6" }}
                defaultChecked={skippable}
                onCheckedChange={checked => setSkippable(checked)}
              />
              <Text>Not required to answer</Text>
            </Flex>
          ) : null}
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
          disabled={
            !isValidQuestion({
              text,
              type,
              options,
              isQuiz,
              skippable,
            })
          }
          onClick={() => {
            onSave({
              saved: true,
              text,
              type,
              options,
              skippable,
              draftID: question.draftID,
            });
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

export const isValidQuestion = ({
  text,
  type,
  options,
  isQuiz = false,
  skippable = true,
}) => {
  if (!validTextInput(text) || !type) {
    return false;
  }

  if (
    ![QUESTION_TYPE.SINGLE_CHOICE, QUESTION_TYPE.MULTIPLE_CHOICE].includes(type)
  ) {
    return true;
  }

  const everyOptionHasText = options.every(
    option => option && validTextInput(option.text, 1)
  );
  const isCorrectAnswerRequired = isQuiz && !skippable;
  const hasCorrectAnswer = options.some(option => option.isCorrectAnswer);

  if (!isCorrectAnswerRequired) {
    return everyOptionHasText;
  }

  return everyOptionHasText && hasCorrectAnswer;
};
