import Link from 'next/link';

export default function Navbar() {
  return (
    <nav class="bg-theme-beige flex space-x-8 p-4 shadow-sm sticky text-theme-yt-red top-0">
      <div> YT Backlinks</div>
      <div className="space-x-8">
        <Link href="/">Home</Link>
        <Link href="">About</Link>
      </div>
    </nav>
  );
}
