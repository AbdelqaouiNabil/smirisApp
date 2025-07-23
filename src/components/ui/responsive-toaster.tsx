import React, { useEffect, useState } from "react";
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
  const iconClasses = "flex-shrink-0 mt-0.5";

  switch (variant) {
    case "destructive":
      return (
        <XCircle
          className={cn("h-4 w-4 sm:h-5 sm:w-5 text-red-500", iconClasses)}
        />
      );
    case "success":
      return (
        <CheckCircle
          className={cn("h-4 w-4 sm:h-5 sm:w-5 text-green-500", iconClasses)}
        />
      );
    case "warning":
      return (
        <AlertTriangle
          className={cn("h-4 w-4 sm:h-5 sm:w-5 text-yellow-500", iconClasses)}
        />
      );
    default:
      return (
        <Info
          className={cn("h-4 w-4 sm:h-5 sm:w-5 text-blue-500", iconClasses)}
        />
      );
  }
};

// Hook to detect device type and screen size
const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    screenWidth: 0,
    orientation: "portrait" as "portrait" | "landscape",
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        screenWidth: width,
        orientation: width > height ? "landscape" : "portrait",
      });
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

export function ResponsiveToaster() {
  const { toasts } = useToast();
  const deviceInfo = useDeviceInfo();

  // Calculate viewport positioning based on device
  const getViewportClasses = () => {
    const base = "fixed z-[100] flex flex-col-reverse p-3 sm:p-4";

    if (deviceInfo.isMobile) {
      // Mobile positioning - bottom of screen for better thumb accessibility
      if (deviceInfo.orientation === "landscape") {
        return cn(base, "bottom-0 right-0 left-0 max-h-[40vh] w-full");
      }
      return cn(base, "bottom-0 right-0 left-0 max-h-[50vh] w-full");
    } else if (deviceInfo.isTablet) {
      // Tablet positioning
      return cn(base, "top-0 right-0 w-full max-w-md max-h-[70vh]");
    } else {
      // Desktop positioning
      return cn(base, "top-0 right-0 w-full max-w-[420px] max-h-screen");
    }
  };

  // Get toast container classes based on device
  const getToastClasses = (variant?: string) => {
    const baseClasses =
      "group pointer-events-auto relative flex w-full items-start justify-between space-x-2 overflow-hidden rounded-md border p-3 sm:p-4 pr-6 shadow-lg transition-all";

    if (deviceInfo.isMobile) {
      // Mobile-optimized styling
      return cn(
        baseClasses,
        "text-sm min-h-[64px] max-w-full mx-2 mb-2",
        // Larger touch targets on mobile
        "[&>button]:h-8 [&>button]:w-8 [&>button]:right-2"
      );
    } else if (deviceInfo.isTablet) {
      return cn(baseClasses, "text-sm min-h-[56px] mx-3 mb-3");
    } else {
      return cn(baseClasses, "text-sm min-h-[52px] mb-2");
    }
  };

  return (
    <ToastProvider
      swipeDirection={deviceInfo.isMobile ? "down" : "right"}
      duration={deviceInfo.isMobile ? 6000 : 5000}
    >
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
            className={getToastClasses(variant)}
            {...props}
          >
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <ToastIcon variant={variant} />
              <div className="flex-1 min-w-0 space-y-1">
                {title && (
                  <ToastTitle
                    className={cn(
                      "font-semibold leading-tight",
                      deviceInfo.isMobile ? "text-sm" : "text-sm"
                    )}
                  >
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription
                    className={cn(
                      "text-muted-foreground leading-relaxed",
                      deviceInfo.isMobile ? "text-xs" : "text-sm"
                    )}
                  >
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose
              className={cn(
                "absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none",
                deviceInfo.isMobile ? "h-6 w-6 top-3 right-3" : "h-5 w-5"
              )}
            >
              <X className={deviceInfo.isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </ToastClose>
          </Toast>
        );
      })}
      <ToastViewport className={getViewportClasses()} />
    </ToastProvider>
  );
}
