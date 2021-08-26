export default interface DatabaseConnectionInfo {
  host: string;
  port: string;
  ssl: boolean;
  username?: string;
  password?: string;
  database?: string;
};