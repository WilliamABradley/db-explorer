export enum SSHTunnelAuthenticationMethod {
  Password = 'Password',
  PublicKey = 'PublicKey',
  Agent = 'Agent',
}

export type SSHTunnelInfo = {
  host: string;
  port: string;
  username: string;
  authenticationMethod: SSHTunnelAuthenticationMethod;
  password?: string;
  privateKey?: string;
  passphrase?: string;
};
