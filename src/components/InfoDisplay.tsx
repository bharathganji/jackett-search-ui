import { Info, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface InfoDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: "info" | "warning";
}

export function InfoDisplay({
  message,
  onRetry,
  className = "",
  variant = "info",
}: InfoDisplayProps) {
  const variantStyles = {
    info: "border-blue-200 dark:border-blue-800",
    warning: "border-yellow-200 dark:border-yellow-800",
  };

  const iconStyles = {
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-yellow-600 dark:text-yellow-400",
  };

  const textStyles = {
    info: "text-blue-800 dark:text-blue-200",
    warning: "text-yellow-800 dark:text-yellow-200",
  };

  return (
    <Card className={`${variantStyles[variant]} ${className}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <Info className={`h-5 w-5 ${iconStyles[variant]} flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textStyles[variant]}`}>
            {variant === "info" ? "Information" : "Notice"}
          </p>
          <p className="text-sm text-muted-foreground">{message}</p>
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
