import { SearchIcon } from '../icons/search';

type Props = {
  handleInputChange: any;
  handleSubmit: any;
  inputValue: string;
};

export default function Searchbar({ handleInputChange, handleSubmit, inputValue}: Props) {
  return (
    <form className="flex items-center">
      <label className="sr-only">Search</label>
      <div className="relative w-full">
        <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
         <SearchIcon />
        </div>
        <input
          type="text"
          id="simple-search"
          className="focus:outline-theme-yt-red rounded-lg pl-10 p-2 text-lg w-full"
          placeholder="Search"
          required
          onChange={handleInputChange}
          value={inputValue}
        />
      </div>
      <button
        type="submit"
        className="bg-theme-yt-red font-medium hover:bg-theme-yt-red-2 ml-2 py-2 px-4 text-md rounded-lg text-white"
        onClick={handleSubmit}
      >
        Search
      </button>
    </form>
  );
}
