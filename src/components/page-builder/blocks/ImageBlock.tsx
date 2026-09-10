export type ImageBlockProps = {
  id?: string;
  url?: string;
  alt?: string;
  caption?: string;
  align?: "left" | "center" | "right";
};

export default function ImageBlock({
  id,
  url = "",
  alt = "",
  caption = "",
  align = "center",
}: ImageBlockProps) {
  if (!url) {
    return null;
  }

  const justify =
    align === "left"
      ? "justify-start"
      : align === "right"
        ? "justify-end"
        : "justify-center";

  return (
    <figure id={id} className={`flex flex-col ${justify}`}>
      <img
        src={url}
        alt={alt}
        className="max-w-full rounded-lg object-contain"
      />
      {caption ? (
        <figcaption className="mt-2 text-sm text-slate-400">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
