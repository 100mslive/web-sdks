import React, { Component } from 'react';
import { CopyIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
import { Tooltip } from '../../Tooltip';
import { ErrorWithSupportLink } from './AuthToken';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, isErrorCopied: false };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`react error boundary - ${error.message}`, error, errorInfo);
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error?.message,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <Flex
          align="center"
          justify="center"
          css={{
            size: '100%',
            height: '100vh',
            width: '100%',
            color: '$on_primary_high',
            backgroundColor: '$background_default',
          }}
        >
          <Box css={{ position: 'relative', overflow: 'hidden', r: '$3', height: '100%', width: '100%' }}>
            <Flex
              direction="column"
              css={{
                position: 'absolute',
                size: '100%',
                top: '33.33%',
                left: 0,
              }}
            >
              <div style={{ margin: '1.5rem', width: '100%' }}>
                <Text>Something went wrong</Text>
                <Text>Message: ${this.state.error}</Text>
                <br />
                {ErrorWithSupportLink(`Please reload to see if it works.`)}
              </div>
              <Flex>
                <Tooltip title="Reload page">
                  <Button
                    onClick={() => {
                      window.location.reload();
                    }}
                    css={{ mx: '$8' }}
                    data-testid="join_again_btn"
                  >
                    Reload
                  </Button>
                </Tooltip>
                <Tooltip title="Copy error details to clipboard">
                  <Button
                    onClick={() => {
                      const { error, errorInfo } = this.state;
                      navigator.clipboard.writeText(
                        JSON.stringify({
                          error,
                          errorInfo,
                        }),
                      );
                      this.setState({ isErrorCopied: true });
                    }}
                    css={{ mx: '$8' }}
                    data-testid="join_again_btn"
                  >
                    <CopyIcon /> {this.state.isErrorCopied ? 'Copied' : 'Copy Details'}
                  </Button>
                </Tooltip>
              </Flex>

              <details style={{ whiteSpace: 'pre-wrap', margin: '1.5rem' }}>
                <Text>{this.state.error && this.state.error.toString()}</Text>
                <br />
                <Text>{JSON.stringify(this.state.errorInfo)}</Text>
              </details>
            </Flex>
          </Box>
        </Flex>
      );
    }

    return this.props.children;
  }
}
