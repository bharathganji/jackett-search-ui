import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
        <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
      </div>
      <span className="text-muted-foreground font-medium animate-pulse">
        {message}
      </span>
    </div>
  );
}
