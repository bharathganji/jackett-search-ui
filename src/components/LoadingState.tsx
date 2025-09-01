import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
