/**
 * @100mslive/hms-whiteboard
 *
 * This package re-exports the whiteboard components from @100mslive/whiteboard-core
 * and provides integration with 100ms session store using proper gRPC-web protocol.
 */

// Re-export everything from the core whiteboard package
export * from '@100mslive/whiteboard-core';

// Export our protobuf-ts based session store client
// This provides proper gRPC-web protocol support for 100ms session store
export { SessionStore } from './hooks/StoreClient';

// Export gRPC types for advanced usage
export { Value_Type } from './grpc/sessionstore';
export type {
  Value,
  GetRequest,
  GetResponse,
  SetRequest,
  SetResponse,
  DeleteRequest,
  DeleteResponse,
  ChangeStream,
  OpenRequest,
  CountRequest,
  CountResponse,
  Select,
} from './grpc/sessionstore';

// Export the protobuf-ts based StoreClient for direct usage
export { StoreClient as GrpcStoreClient } from './grpc/sessionstore.client';
