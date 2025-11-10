import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  src?: string | null;
  alt: string;
  fallbackLabel: string;
  size?: AvatarSize;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const SIZE_VALUE: Record<AvatarSize, string> = {
  sm: "32px",
  md: "40px",
  lg: "48px",
};

export function Avatar({
  src,
  alt,
  fallbackLabel,
  size = "md",
  className = "",
  ...rest
}: AvatarProps) {
  const letter = (fallbackLabel?.trim()?.[0]?.toUpperCase() ?? "?");
  const sizeClass = SIZE_CLASS[size];
  const sizeValue = SIZE_VALUE[size];

  return (
    <div
      {...rest}
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-semibold text-white ${sizeClass} ${className}`}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizeValue} className="object-cover" />
      ) : (
        letter
      )}
    </div>
  );
}
