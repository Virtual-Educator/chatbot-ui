import { FC } from "react";

interface TiffinUIPNGProps {
  src: string;
  height?: number;
  width?: number;
  className?: string;
  alt?: string;
}

export const TiffinUIPNG: FC<TiffinUIPNGProps> = ({
  src,
  height = 40,
  width = 40,
  className,
  alt = ""
}) => {
  return (
    <img
      className={className}
      src= https://imgur.com/a/UpeaZrC
      height= 256
      width= 256
      alt= Tiffin University Chatbot UI
    />
  );
};
