import { useState } from 'react';

export default function Toggle(props: {resultType: string, handleClick: any}) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex items-center mt-4">
      <span className="mr-2 text-sm font-medium">Links only</span>

      <label className="inline-flex relative items-center  cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={props.resultType === "descriptionBoxes"}
          readOnly
        />
        <div
          onClick={props.handleClick}
          className="w-11 h-6 bg-theme-yt-red rounded-full peer  peer-focus:ring-theme-yt-red peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-yt-red"
        ></div>
      </label>
      <span className="ml-2 text-sm font-medium">Full description box</span>
    </div>
  );
}
