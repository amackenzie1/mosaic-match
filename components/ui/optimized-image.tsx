import { cn } from "@/lib/utils";
import NextImage, { ImageProps as NextImageProps } from "next/image";

interface OptimizedImageProps extends Omit<NextImageProps, "alt"> {
  alt: string; // Make alt required for better accessibility
  className?: string;
}

export function OptimizedImage({
  alt,
  className,
  priority = false,
  ...props
}: OptimizedImageProps) {
  return (
    <div className={cn("relative", className)}>
      <NextImage
        alt={alt}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
    </div>
  );
}
