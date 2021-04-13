export interface JsonRpcRequest {
  id: string;
  method: string;
  params: Map<string, any>;
}
