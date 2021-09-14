export enum SSHTunnelAuthenticationMethod {
  Password = 'Password',
  PublicKey = 'PublicKey',
  Agent = 'Agent',
}

type SSHTunnelInfoBase = {
  host: string;
  port: number;
  username: string;
  authenticationMethod: SSHTunnelAuthenticationMethod;
  password?: string;
  passphrase?: string;
};

export type SSHTunnelInfo = SSHTunnelInfoBase & {
  privateKey?: {
    uri: string;
    data: string;
  };
};

export type SSHTunnelConfiguration = SSHTunnelInfoBase & {
  privateKey?: String;
};

export type SSHTunnelPortForward = {
  remoteHost: String;
  remotePort: number;
  localPort?: number;
};
