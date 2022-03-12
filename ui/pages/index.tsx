import { getUploadPlaylistId, getVideoDescriptions } from '../utils/getVideoDescriptions';

type Props = {
  descriptions: string[];
};

export async function getServerSideProps() {
  const uploadPlaylistId = await getUploadPlaylistId();

  const descriptions = await getVideoDescriptions(uploadPlaylistId);

  console.log("these are descriptions")
  console.log(descriptions)

  return {
    props: {descriptions},
  };
}

export default function Index({descriptions}: Props) {
  return (
    <div className="p-12">
      <h1 className="text-center my-24 font-black tracking-tight text-6xl">
        Links in the Description
      </h1>
      <div className="columns-3 gap-3">
        {descriptions.map(description => {
          return <div className="p-9 my-3 border-2 whitespace-pre-wrap">{description}</div>;
        })}
      </div>
    </div>
  );
}
