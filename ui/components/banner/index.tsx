import { AnnouncementIcon } from '../icons/announcement';

export default function Banner(props: {
  bgcolor: string;
  textcolor: string;
  icon: boolean;
  children: string;
}) {
  return (
    <div className={`bg-${props.bgcolor}`}>
      <div className={`mx-auto max-w-7xl py-3 px-3 sm:px-6 lg:px-8`}>
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex flex-1 items-center">
            {props.icon && (
              <span className={`flex rounded-lg ${props.bgcolor} p-2`}>
                <AnnouncementIcon />
              </span>
            )}
            <p className={`ml-3 text-${props.textcolor} text-xs sm:text-tiny`}>
              <span>{props.children}</span>
            </p>
          </div>
        </div>
      </div>
   </div>
  );
}
