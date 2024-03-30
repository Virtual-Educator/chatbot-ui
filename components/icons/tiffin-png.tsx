import { FC } from "react";

interface TiffinUIPNGProps {
  src: string;
  className?: string;
  alt?: string;
}

export const TiffinUIPNG: FC<TiffinUIPNGProps> = ({
  src,
  className,
  alt = "Tiffin University Chatbot UI"
}) => {
  return (
    <img
      className={className}
      src={src}
      height="256" // If height is always 256
      width="256" // If width is always 256
      alt={alt}
    />
  );
};
