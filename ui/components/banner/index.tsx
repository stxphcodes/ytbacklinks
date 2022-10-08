import { AnnouncementIcon } from '../icons/announcement';

export default function Banner() {
  return (
    <div className="bg-theme-yt-red-1">
      <div className="mx-auto max-w-7xl py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex w-0 flex-1 items-center">
            <span className="flex rounded-lg bg-theme-yt-red p-2">
              <AnnouncementIcon />
            </span>
            <p className="ml-3 text-white text-xs sm:text-tiny">
              <span>
                This website is still in beta phase and may have bugs. If you experience errors or have suggestions for improvement please email sitesbystephanie@gmail.com.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
