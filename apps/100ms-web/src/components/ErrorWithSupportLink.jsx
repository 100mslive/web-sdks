import { styled } from "@100mslive/react-ui";

const Link = styled("a", {
  color: "#2f80e1",
});

export const ErrorWithSupportLink = errorMessage => (
  <div>
    {errorMessage} If you think this is a mistake on our side, please create{" "}
    <Link
      target="_blank"
      href="https://github.com/100mslive/100ms-web/issues"
      rel="noreferrer"
    >
      an issue
    </Link>{" "}
    or reach out over{" "}
    <Link
      target="_blank"
      href="https://discord.com/invite/kGdmszyzq2"
      rel="noreferrer"
    >
      Discord
    </Link>
    .
  </div>
);
