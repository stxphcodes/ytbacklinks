import { TResponseWrapper } from '../utilsLibrary/responseWrapper';

export function getServerUrl(): TResponseWrapper {
  if (
    !process.env.SERVER_URL ||
    process.env.SERVER_URL == ''
  ) {
    return {
      Ok: false,
      Status: 500,
      StatusText: 'Internal Server',
      Message: 'SERVER_URL env not set.',
      RawMessage: 'In getServerUrl.',
    };
  }

  return {
    Ok: true,
    Status: 200,
    StatusText: 'Ok',
    Message: process.env.SERVER_URL,
    RawMessage: process.env.SERVER_URL,
  };
}
