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
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <input
          type="text"
          id="simple-search"
          className="focus:outline-theme-yt-red rounded-lg pl-10 p-2.5 text-lg w-full"
          placeholder="Search"
          required
          onChange={handleInputChange}
          value={inputValue}
        />
      </div>
      <button
        type="submit"
        className="bg-theme-yt-red font-medium hover:bg-theme-yt-red-2 ml-2 py-2.5 px-4 text-md  rounded-lg text-white"
        onClick={handleSubmit}
      >
        Search
      </button>
    </form>
  );
}