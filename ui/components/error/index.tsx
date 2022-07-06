import { TApiResponse } from '../../utils/apiResponse';

type Props = {
  response: TApiResponse;
};

export default function ErrorPage({response}: Props) {
  return (
    <div className="p-12">
      <h1 className="text-center my-12 font-black tracking-tight text-6xl">
        {response.Status} {response.StatusText} Error
      </h1>
      <h3 className="text-center my-4 font-black tracking-tight text-3xl">
        {response.Message}
      </h3>
    </div>
  );
}
