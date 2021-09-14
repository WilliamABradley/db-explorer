export enum DriverManagerOutboundMessageType {
  Result = 'Result',
  Log = 'Log',
  Error = 'Error',
}

type DriverManagerOutboundMessageTemplate<
  TType extends DriverManagerOutboundMessageType,
  TData,
> = {
  type: TType;
  data: TData;
};

type DriverErrorType<TType extends string, TData = any> = {
  error_type: TType;
  error_data: TData;
};

type DriverManagerUnknownConnection = {
  connection_type: string;
  connection_id: number;
};

type DriverManagerUnknownType = {
  unknown_from: string;
  unknown_type: string;
};

export type DriverErrors =
  | DriverErrorType<'Error', string>
  | DriverErrorType<'FatalError', string>
  | DriverErrorType<'ParseError', string>
  | DriverErrorType<'SerializeError', string>
  | DriverErrorType<'NoConnectionError', DriverManagerUnknownConnection>
  | DriverErrorType<'UnknownMessage', DriverManagerUnknownType>
  | DriverErrorType<'UnknownDriver', DriverManagerUnknownType>
  | DriverErrorType<'UnknownError', never>;

export type DriverManagerOutboundMessage =
  | DriverManagerOutboundMessageTemplate<
      DriverManagerOutboundMessageType.Result,
      any
    >
  | DriverManagerOutboundMessageTemplate<
      DriverManagerOutboundMessageType.Log,
      {level: 'Debug' | 'Info' | 'Warn' | 'Error' | 'Fatal'; message: string}
    >
  | DriverManagerOutboundMessageTemplate<
      DriverManagerOutboundMessageType.Error,
      DriverErrors
    >;
