export default interface DatabaseQueryData {
  sql: string;
  variables?: Record<string, string> | undefined;
}
