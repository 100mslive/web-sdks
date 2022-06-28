import React, { useState } from "react";
import { Text, Input, Button, Label, styled } from "@100mslive/react-ui";
import { ArrowRightIcon } from "@100mslive/react-icons";
import {
  useUserPreferences,
  UserPreferencesKeys,
} from "../hooks/useUserPreferences";
import UserMusicIcon from "../../images/UserMusicIcon";

const defaultPreviewPreference = {
  name: "",
  isAudioMuted: false,
  isVideoMuted: false,
};

const PreJoinScreen = ({ initialName, setIsNameScreen }) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(
    UserPreferencesKeys.PREVIEW,
    defaultPreviewPreference
  );
  const formSubmit = e => {
    e.preventDefault();
    setPreviewPreference({
      ...previewPreference,
      name,
    });
    setIsNameScreen(false);
  };
  const [name, setName] = useState(initialName || previewPreference.name);
  return (
    <>
      <UserMusicIcon />
      <Text css={{ mt: "$8", mb: "$4" }} variant="h4">
        Go live in five!
      </Text>
      <Text css={{ c: "$textMedEmp", textAlign: "center" }} variant="body1">
        Let’s get your studio setup ready in less <br /> than 5 minutes!
      </Text>
      <Form onSubmit={formSubmit}>
        <InputField>
          <Label>
            <Text css={{ c: "$textHighEmp" }} variant="body2">
              Name
            </Text>
          </Label>
          <Input
            css={{ w: "400px" }}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </InputField>

        <Button type="submit" icon>
          Get Started <ArrowRightIcon />
        </Button>
      </Form>
    </>
  );
};

const InputField = styled("fieldset", {
  display: "flex",
  flexDirection: "column",
  margin: "$12 0",
  "& > * + *": {
    marginTop: "$2",
    marginBottom: "0rem",
  },
});

const Form = styled("form", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export default PreJoinScreen;
