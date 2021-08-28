export default interface INativeMessageDatabaseDriver {
  sendMessage(message: string): Promise<string>;
}
