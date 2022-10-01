import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-theme-beige flex space-x-8 p-4 shadow-sm sticky text-theme-yt-red top-0">
      <Link href="/" passHref={true}>
        <a className="flex">
          <img className="w-8 h-8 mr-1" src="/static/favicon.png"></img>
          Youtube Backlinks
        </a>
      </Link>
      <Link href="/about">About</Link>
    </nav>
  );
}
