import React from "react";
import { Box, Text } from "@100mslive/react-ui";

export function HlsStatsOverlay({ hlsStatsState }) {
  return (
    <Box>
      <table
        style={{
          borderCollapse: "collapse",
          position: "absolute",
          tableLayout: "fixed",
          wordWrap: "break-word",
          padding: "@h3",
          zIndex: 100,
          backgroundColor: "rgba(101,112,128, 0.25)",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                URL
              </Text>
            </td>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                <a
                  href={`${hlsStatsState?.url}`}
                  target="_blank"
                  rel="noreferrer"
                >{`${hlsStatsState?.url}`}</a>
              </Text>
            </td>
          </tr>
          <tr>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                Video Size
              </Text>
            </td>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >{` ${hlsStatsState?.videoSize.width}x${hlsStatsState?.videoSize.height}`}</Text>
            </td>
          </tr>
          <tr>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                Buffer Health
              </Text>
            </td>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >{`${hlsStatsState?.bufferHealth.toFixed(2)}`}</Text>
            </td>
          </tr>
          <tr>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                Connection Speed
              </Text>
            </td>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                {`${(hlsStatsState?.bandwidthEstimate / (1000 * 1000)).toFixed(
                  2
                )}Mbps`}
              </Text>
            </td>
          </tr>
          <tr>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                Bitrate
              </Text>
            </td>
            <td
              style={{
                maxWidth: "320px",
                verticalAlign: "top",
                padding: "0.25rem 0.5rem 0.25rem 0.5rem",
              }}
            >
              <Text
                css={{
                  "@md": { fontSize: "@md" },
                  "@sm": { fontSize: "@xs" },
                }}
              >
                {`${(hlsStatsState?.bitrate / (1000 * 1000)).toFixed(2)}Mbps`}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
}
