import React, { useState } from "react";
import { useEmbedScreenShare } from "@100mslive/react-sdk";
import { ViewIcon } from "@100mslive/react-icons";
import { Button, Dialog, Dropdown, Text } from "@100mslive/react-ui";
import {
  DialogContent,
  DialogInput,
  DialogRow,
} from "../../primitives/DialogContent";

export const EmbedUrl = ({ setShowOpenUrl }) => {
  if (!window.CropTarget) {
    return null;
  }

  return (
    <Dropdown.Item
      onClick={() => {
        setShowOpenUrl(true);
      }}
      data-testid="embed_url_btn"
    >
      <ViewIcon />
      <Text variant="sm" css={{ ml: "$4" }}>
        Embed URL
      </Text>
    </Dropdown.Item>
  );
};

export function EmbedUrlModal({ onOpenChange }) {
  const { config, setConfig } = useEmbedScreenShare();
  const [url, setUrl] = useState(config?.url || "");

  const isAnythingEmbedded = !!config?.url;
  const isModifying = isAnythingEmbedded && url && url !== config?.url;
  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <DialogContent title="Embed URL" Icon={ViewIcon}>
        <DialogInput
          title="URL"
          value={url}
          onChange={setUrl}
          placeholder="https://www.tldraw.com/"
          type="url"
        />
        <DialogRow>
          <Text>
            Embed a url and share with everyone in the room. Ensure that you're
            sharing the current tab when the prompt opens. Note that not all
            websites support being embedded.
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          {isAnythingEmbedded ? (
            <>
              <Button
                variant="primary"
                type="submit"
                disabled={!isModifying}
                onClick={() => {
                  setConfig({ url });
                  onOpenChange(false);
                }}
                data-testid="embed_url_btn"
                css={{ mr: "$4" }}
              >
                Update Embed
              </Button>
              <Button
                variant="danger"
                type="submit"
                onClick={() => {
                  setConfig({ url: "" });
                  onOpenChange(false);
                }}
                data-testid="embed_url_btn"
              >
                Stop Embed
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              type="submit"
              disabled={!url.trim()}
              onClick={() => {
                setConfig({ url });
                onOpenChange(false);
              }}
              data-testid="embed_url_btn"
            >
              Embed and Share
            </Button>
          )}
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
