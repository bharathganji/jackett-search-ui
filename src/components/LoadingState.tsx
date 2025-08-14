import { Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";

interface LoadingStateProps {
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  progress,
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 p-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}
