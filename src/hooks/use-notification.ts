import { useToast } from "@/hooks/use-toast";

export type NotificationVariant =
  | "default"
  | "destructive"
  | "success"
  | "warning";

export interface NotificationOptions {
  title?: string;
  description?: string;
  variant?: NotificationVariant;
  sound?: boolean;
  vibrate?: boolean;
  duration?: number;
  position?: "top" | "bottom" | "center";
}

export function useNotification() {
  const { toast } = useToast();

  const playSound = (type: NotificationVariant) => {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different tones for different notification types
        switch (type) {
          case "success":
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              1000,
              audioContext.currentTime + 0.1
            );
            break;
          case "warning":
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              400,
              audioContext.currentTime + 0.2
            );
            break;
          case "destructive":
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              300,
              audioContext.currentTime + 0.3
            );
            break;
          default:
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        }

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.3
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn("Audio notification not supported:", error);
      }
    }
  };

  const triggerVibration = (pattern: number[] = [200]) => {
    if (
      typeof window !== "undefined" &&
      "navigator" in window &&
      "vibrate" in navigator
    ) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn("Vibration not supported:", error);
      }
    }
  };

  const notify = ({
    title = "Notification",
    description,
    variant = "default",
    sound = false,
    vibrate = false,
    duration,
    position = "top",
  }: NotificationOptions) => {
    // Trigger sound notification if enabled
    if (sound) {
      playSound(variant);
    }

    // Trigger vibration if enabled
    if (vibrate) {
      const vibrationPatterns = {
        default: [100],
        success: [100, 50, 100],
        warning: [200, 100, 200],
        destructive: [300, 100, 300, 100, 300],
      };
      triggerVibration(vibrationPatterns[variant]);
    }

    // Show toast notification
    return toast({
      title,
      description,
      variant,
      duration: duration || (variant === "destructive" ? 6000 : 4000),
    });
  };

  return {
    notify,
    success: (options: Omit<NotificationOptions, "variant">) =>
      notify({ ...options, variant: "success" }),
    error: (options: Omit<NotificationOptions, "variant">) =>
      notify({ ...options, variant: "destructive" }),
    warning: (options: Omit<NotificationOptions, "variant">) =>
      notify({ ...options, variant: "warning" }),
    info: (options: Omit<NotificationOptions, "variant">) =>
      notify({ ...options, variant: "default" }),
  };
}
