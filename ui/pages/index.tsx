

import { getUploadPlaylistId, getVideoDescriptions } from '../utils/getVideoDescriptions';

type Props = {
  descriptions: string[];
};

export async function getStaticProps() {
  let playlistId = await getUploadPlaylistId();
  let descriptions = await getVideoDescriptions(playlistId)

  return {
    props: {descriptions},
  };
}

export default function Index({descriptions}: Props) {

  return (
    <div className="p-12">
      <h1 className="text-center my-24 font-black tracking-tight text-6xl">
        Jenn's Links
      </h1>
      <div>
        {descriptions.map(description => {
          return (
            <div>{description}</div>
          )
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
