import { buildErrorMessage, handleDeviceError, handlePluginMigrationError, logError } from './error-handling';
import HMSLogger from './logger';

// Mock HMSLogger
jest.mock('./logger', () => ({
  e: jest.fn(),
  w: jest.fn(),
  d: jest.fn(),
}));

describe('Error Handling Utilities', () => {
  const mockLogger = HMSLogger as jest.Mocked<typeof HMSLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logError', () => {
    it('should log error with tag and message', () => {
      const tag = '[TestComponent]';
      const message = 'Test error occurred';
      const error = new Error('Test error');

      logError(tag, message, error);

      expect(mockLogger.e).toHaveBeenCalledWith(tag, message, error);
    });

    it('should log with context information', () => {
      const tag = '[TestComponent]';
      const message = 'Test error occurred';
      const error = new Error('Test error');
      const context = { userId: '123', action: 'join' };

      logError(tag, message, error, context);

      expect(mockLogger.e).toHaveBeenCalledWith(
        tag,
        'Test error occurred, context: {"userId":"123","action":"join"}',
        error,
      );
    });

    it('should support different log levels', () => {
      const tag = '[TestComponent]';
      const message = 'Test warning';
      const error = new Error('Test error');

      logError(tag, message, error, undefined, 'warn');

      expect(mockLogger.w).toHaveBeenCalledWith(tag, message, error);
    });
  });

  describe('buildErrorMessage', () => {
    it('should build error message with operation', () => {
      const result = buildErrorMessage('connect to server');
      expect(result).toBe('Failed to connect to server');
    });

    it('should include context in error message', () => {
      const context = { url: 'wss://example.com', retry: 3 };
      const result = buildErrorMessage('connect to server', context);
      expect(result).toBe('Failed to connect to server (url=wss://example.com, retry=3)');
    });

    it('should include original message', () => {
      const result = buildErrorMessage('connect to server', undefined, 'Connection timeout');
      expect(result).toBe('Failed to connect to server: Connection timeout');
    });

    it('should include both context and original message', () => {
      const context = { url: 'wss://example.com' };
      const result = buildErrorMessage('connect to server', context, 'Connection timeout');
      expect(result).toBe('Failed to connect to server (url=wss://example.com): Connection timeout');
    });
  });

  describe('handlePluginMigrationError', () => {
    it('should log plugin migration error with proper context', () => {
      const tag = '[TestTrack]';
      const plugin = { constructor: { name: 'TestPlugin' } };
      const error = new Error('Plugin failed');

      handlePluginMigrationError(tag, plugin, error);

      expect(mockLogger.e).toHaveBeenCalledWith(
        tag,
        'Plugin add failed while migrating, context: {"plugin":"TestPlugin"}',
        error,
      );
    });

    it('should handle plugin without constructor name', () => {
      const tag = '[TestTrack]';
      const plugin = {};
      const error = new Error('Plugin failed');

      handlePluginMigrationError(tag, plugin, error);

      expect(mockLogger.e).toHaveBeenCalledWith(
        tag,
        'Plugin add failed while migrating, context: {"plugin":"unknown"}',
        error,
      );
    });
  });

  describe('handleDeviceError', () => {
    it('should log device error with proper context', () => {
      const tag = '[DeviceManager]';
      const deviceType = 'audio';
      const operation = 'enumeration';
      const error = new Error('Device error');

      handleDeviceError(tag, deviceType, operation, error);

      expect(mockLogger.e).toHaveBeenCalledWith(
        tag,
        'audio device enumeration failed, context: {"deviceType":"audio","operation":"enumeration"}',
        error,
      );
    });
  });
});
