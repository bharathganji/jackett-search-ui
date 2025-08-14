import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  className = "",
}: ErrorDisplayProps) {
  return (
    <Card className={`border-destructive/50 ${className}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
