export interface INativeMessageDriver {
  postMessage(message: string): Promise<string>;
}

export * from './types.inbound';
export * from './types.database';
export * from './types.tunnel';
export * from './types.outbound';
