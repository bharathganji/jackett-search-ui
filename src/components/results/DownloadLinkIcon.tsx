import { ExternalLink, Magnet } from "lucide-react";

interface DownloadLinkIconProps {
  link?: string;
}

export function DownloadLinkIcon({ link }: DownloadLinkIconProps) {
  if (link?.startsWith("magnet:")) {
    return <Magnet className="h-4 w-4" />;
  }
  return <ExternalLink className="h-4 w-4" />;
}
