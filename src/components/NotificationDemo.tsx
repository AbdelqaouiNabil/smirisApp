import React from "react";
import { useNotification } from "@/hooks/use-notification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smartphone, Tablet, Monitor, Volume2, Vibrate } from "lucide-react";

export function NotificationDemo() {
  const notification = useNotification();

  const handleTestNotification = (
    type: "success" | "error" | "warning" | "info"
  ) => {
    const notifications = {
      success: {
        title: "Success!",
        description: "Your action was completed successfully.",
        sound: true,
        vibrate: true,
      },
      error: {
        title: "Error occurred",
        description: "Something went wrong. Please try again.",
        sound: true,
        vibrate: true,
      },
      warning: {
        title: "Warning",
        description: "Please review your input before continuing.",
        sound: true,
        vibrate: false,
      },
      info: {
        title: "Information",
        description: "Here's some helpful information for you.",
        sound: false,
        vibrate: false,
      },
    };

    notification[type](notifications[type]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Responsive Notification System
        </CardTitle>
        <CardDescription>
          Test notifications across different devices and screen sizes. Our
          system automatically adapts to mobile, tablet, and desktop layouts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Support Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
            <Smartphone className="h-8 w-8 mb-2 text-blue-500" />
            <h3 className="font-semibold text-sm">Mobile</h3>
            <p className="text-xs text-muted-foreground">
              Bottom positioning, swipe down
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
            <Tablet className="h-8 w-8 mb-2 text-green-500" />
            <h3 className="font-semibold text-sm">Tablet</h3>
            <p className="text-xs text-muted-foreground">
              Top-right, optimized sizing
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg">
            <Monitor className="h-8 w-8 mb-2 text-purple-500" />
            <h3 className="font-semibold text-sm">Desktop</h3>
            <p className="text-xs text-muted-foreground">Top-right corner</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Volume2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Sound feedback</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Vibrate className="h-4 w-4 text-green-500" />
            <span className="text-sm">Haptic feedback</span>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Test Notifications:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestNotification("success")}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestNotification("error")}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestNotification("warning")}
              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestNotification("info")}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              Info
            </Button>
          </div>
        </div>

        {/* Accessibility Note */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">
            Accessibility Features:
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Screen reader compatible with proper ARIA labels</li>
            <li>• High contrast support for better visibility</li>
            <li>• Keyboard navigation support</li>
            <li>• Respects user's motion preferences</li>
            <li>• Customizable duration and sound settings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
