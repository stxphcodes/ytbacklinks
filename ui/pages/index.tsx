import Link from 'next/link';

import { ChannelsResponse, getChannels } from '../utils/getChannels';

type Props = {
  channels: ChannelsResponse | null;
};

export async function getStaticProps() {
  let channels = await getChannels();

  return {
    props: {channels},
  };
}

export default function Index({channels}: Props) {
  return (
    <div className="p-12">
      <h1 className="text-center my-12 font-black tracking-tight text-6xl">
        YT BackLinks
      </h1>
      <h3 className="text-center my-4 font-black tracking-tight text-3xl">
        Featured Channels
      </h3>

      <div className="grid grid-cols-3 gap-x-2">
        {channels &&
          Object.entries(channels).map(([channelId, channel]) => {
            return (
              <Link href={`/channels/${channelId}`}>
                <button className="shadow-sm border-2 text-left p-1">
                  <div className="grid grid-cols-3 gap-x-2">
                    <div>
                      <img
                        alt={`${channel.Title} channel thumbnail`}
                        src={channel.ThumbnailUrl}
                        className="w-fit h-auto"
                      />
                    </div>

                    <div className="col-span-2">
                      <h1 className="font-black pb-2">{channel.Title}</h1>
                      <p className="pb-2">{channel.Description}</p>

                      <p>
                        {' '}
                        {channel.VideoCount} Videos | {channel.LinkCount} Links
                      </p>
                    </div>
                  </div>
                </button>
              </Link>
            );
          })}
      </div>
    </div>
  );
}

// type Props = {
//   record: ChannelRecord;
// };

// export function getStaticProps() {
//   const record = getRecord();

//   return {
//     props: {record},
//   };
// }

// export default function Index({record}: Props) {
//   const [displayLinkDetails, setDisplayLinkDetails] = useState(
//     Array(record.Links.length).fill(false)
//   );

//   return (
//     <div className="p-12">
//       <h1 className="text-center my-24 font-black tracking-tight text-6xl">
//         Jenn's Links
//       </h1>
//       <div>
//         {record.Links.map((link, index) => {
//           return (
//             <div className="my-2">
//               <button
//                 className="p-1 bg-slate-300"
//                 onClick={() => {

//                   displayLinkDetails[index] = !displayLinkDetails[index];

//                   setDisplayLinkDetails([...displayLinkDetails]);
//                 }}
//               >
//                 +
//               </button>
//               {link.Brand !== ''
//                 ? `${link.Brand} - ${link.Description}`
//                 : `${link.Description}`}{' '}
//               <a href={link.Href} target="_blank" className="text-blue-600">
//                 {link.Href}
//               </a>
//               <div style={{display: displayLinkDetails[index] ? 'block' : 'none'}}>
//                 {link.PublishedAt} {link.VideoTitle}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
