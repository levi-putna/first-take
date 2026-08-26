import { useEffect, useState, type CSSProperties, type ImgHTMLAttributes } from "react";
import { continueRender, delayRender } from "@storyboard/core";

/**
 * Image that blocks frame capture until loaded and decoded.
 */
export function Img({
  src,
  style,
  className,
  alt = "",
  ...rest
}: {
  src: string;
  style?: CSSProperties;
  className?: string;
  alt?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const [handle] = useState(() => delayRender(`Img:${src}`));

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      try {
        if (img.decode) await img.decode();
      } catch {
        // decode may fail on some formats; still continue
      }
      if (!cancelled) continueRender(handle);
    };
    img.onerror = () => {
      if (!cancelled) continueRender(handle);
    };
    img.src = src;
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [src, handle]);

  return <img src={src} alt={alt} style={style} className={className} {...rest} />;
}
