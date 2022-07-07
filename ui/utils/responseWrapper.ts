
export const ErrRequest = 'Error requesting URL';
export const ErrNullResponse = 'Null response received';
export const ErrUnknown = 'Unknown'

export class ResponseError {
  Message: string;
  RawMessage: string | null;

  constructor (message: string, rawmessage: string|null = null) {
    this.Message = message;
    this.RawMessage = rawmessage;
  }
}

// Create a type to address serialization errors when setting props to
// object in data fetching functions like getServerSideProps.
// Class objects do not automatically serialize to JSON but types do.
export type TResponseWrapper = {
  Ok: boolean;
  Status: number;
  StatusText: string;
  Message: any;
  RawMessage: any;
};

export class ResponseWrapper {
  Ok: boolean;
  Status: number;
  StatusText: string;
  Message: any;
  RawMessage: any;

  constructor(
    ok: boolean = false,
    status: number = 500,
    statusText: string = 'Internal Server',
    message: any = null,
    rawmessage: any = null
  ) {
    this.Ok = ok;
    this.Status = status;
    this.StatusText = statusText;
    this.Message = message;
    this.RawMessage = rawmessage;
  }

  UpdateWithResponse(response: Response) {
    this.Ok = response.ok;
    this.Status = response.status;
    this.StatusText = response.statusText;
  }

  SetDefaultError() {
    this.Ok = false;
    this.Status = 500;
    this.StatusText = 'Internal Server';
  }

  Serialize(): TResponseWrapper {
    return JSON.parse(JSON.stringify(this));
  }
}
