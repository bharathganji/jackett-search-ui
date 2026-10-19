import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSafeUrl(url: string | null | undefined): string {
  if (!url) return "#";

  try {
    const parsed = new URL(url, "https://dummybase.com");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return "#";
  } catch {
    return "#";
  }
}
