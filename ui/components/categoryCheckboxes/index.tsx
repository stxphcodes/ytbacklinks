export function CategoryCheckboxes(props: {
  channelCategories: string[];
  handleCategoryCheck: any;
  styles?: string;
}) {
  return (
    <ul className={`px-3 rounded-lg border border-gray-200 my-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 ${props.styles}`}>
      {props.channelCategories.map((category) => {
        return (
          <li key={category}>
            <div className="flex items-center py-3">
              <input
                id="checkbox-list"
                type="checkbox"
                value={category}
                className="w-4 h-4 accent-theme-yt-red rounded border-gray-300 focus:ring-theme-yt-red focus:ring-2"
                onClick={props.handleCategoryCheck}
              />
              <label
                htmlFor="checkbox-list"
                className="ml-2 text-sm font-medium"
              >
                {category}
              </label>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
