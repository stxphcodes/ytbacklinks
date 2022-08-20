export default function Navbar() {
  return (
    <nav class="bg-theme-beige flex space-x-8 p-4 shadow-sm sticky text-theme-yt-red top-0">
      <div> YT Backlinks</div>
      <div className="space-x-8">
        <a href="/">Home</a>
        <a href="">About</a>
        <a href="">Contact Us</a>
      </div>
    </nav>
  );
}
