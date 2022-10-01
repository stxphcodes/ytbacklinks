export default function Toggle(props: {
  displayOption: string;
  handleClick: any;
}) {
  return (
    <div className="flex items-center mt-4 bg-theme-yt-red w-fit p-2 rounded-full text-white text-xs sm:text-sm">
      <span className="mr-1 font-medium ">Links only</span>

      <label className="inline-flex relative items-center  cursor-pointer -">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={props.displayOption !== "linksOnly"}
          readOnly
        />
        <div
          onClick={props.handleClick}
          className="w-11 h-5 bg-theme-beige-2 rounded-full peer peer-focus:ring-theme-yt-red peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0 after:left-[2px] after:bg-theme-yt-red after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-beige-2"
        ></div>
      </label>
      <span className="ml-1 font-medium">Full description box</span>
    </div>
  );
}
