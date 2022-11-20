export default function Error(props: { header: string; message: string }) {
  return (
    <div className="text-center text-lg p-24">
      <div className="font-bold text-theme-yt-red">{props.header}</div>
      <div>{props.message}</div>
    </div>
  );
}
