import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastIcon = ({ variant }: { variant?: string }) => {
  switch (variant) {
    case "destructive":
      return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
    case "warning":
      return (
        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
      );
    default:
      return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
  }
};

export function EnhancedToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right" duration={5000}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast
            key={id}
            variant={variant}
            className={cn(
              "group relative flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=open]:fade-in-0",
              "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=closed]:fade-out-0",
              "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full",
              "sm:max-w-sm md:max-w-md lg:max-w-lg",
              variant === "destructive" &&
                "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
              variant === "success" &&
                "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
              variant === "warning" &&
                "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
              !variant && "bg-white dark:bg-zinc-950"
            )}
            {...props}
          >
            <ToastIcon variant={variant} />
            <div className="flex-1 space-y-1">
              {title && (
                <ToastTitle className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-400">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </ToastClose>
          </Toast>
        );
      })}
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:max-w-[420px] md:max-w-[520px] gap-2" />
    </ToastProvider>
  );
}
