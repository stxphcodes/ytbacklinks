// Create a type to address serialization errors when setting props to
// object in data fetching functions like getServerSideProps.
// Class objects do not automatically serialize to JSON but types do.
export type TApiResponse = {
  Ok: boolean;
  Status: number;
  StatusText: string;
  Message: any;
  RawMessage: any;
};

export class ApiResponse {
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

  Serialize(): TApiResponse {
    return JSON.parse(JSON.stringify(this));
  }
}
