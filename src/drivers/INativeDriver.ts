export default interface INativeDriver {
  connect(id: number, connectionString: string): Promise<void>;
  close(id: number): Promise<void>;
  execute(
    id: number,
    sql: string,
    variables?: Record<string, any>,
  ): Promise<string>;
}
