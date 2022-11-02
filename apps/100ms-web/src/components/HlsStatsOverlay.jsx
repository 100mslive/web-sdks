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
          padding: "0.5rem",
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
                  "@md": { fontSize: "1rem" },
                  "@sm": { fontSize: "0.75rem" },
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
