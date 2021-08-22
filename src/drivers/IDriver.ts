export default interface IDriver {
  connect(connectionString: string): Promise<void>;
  close(): Promise<void>;
  execute(sql: string, variables?: Record<string, any>): Promise<string>;
}
