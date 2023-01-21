import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-theme-beige flex space-x-4 sm:space-x-8 p-4 pt-4 pb-3 sm:py-5 shadow-sm sticky text-theme-yt-red top-0 text-sm md:text-md">
      <Link href="/" passHref={true}>
        <a className="flex">
          <img
            className="w-5 h-5 md:w-6 md:h-6 sm:w-8 sm:h-8 mr-1"
            src="/static/favicon.png"
            alt="Logo for youtubebacklinks: red triangles with links."
          ></img>
          Youtube Backlinks
        </a>
      </Link>
      <Link href="/about" shallow={false}>
        About
      </Link>
      <Link href="/channels/new">Add New Channel</Link>
    </nav>
  );
}
