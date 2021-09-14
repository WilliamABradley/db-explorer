export default interface DatabaseConnectionInfo {
  host: string;
  port: number;
  ssl: boolean;
  username?: string;
  password?: string;
  database?: string;
}
