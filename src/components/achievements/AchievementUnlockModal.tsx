"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Award,
  Trophy,
  Star,
  Flame,
  Clock,
  UserPlus,
  Users,
  Calendar,
  Medal,
  Wallet,
  Repeat,
  Sunrise,
  Crown,
  Shield,
  ShieldCheck,
  Link,
  UserCheck,
  MessageSquare,
  FileText,
  Stars,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// Icon mapping
const iconMap: Record<string, any> = {
  Gift,
  Award,
  Trophy,
  Star,
  Flame,
  Clock,
  UserPlus,
  Users,
  Calendar,
  Medal,
  Wallet,
  Repeat,
  Sunrise,
  Crown,
  Shield,
  ShieldCheck,
  Link,
  UserCheck,
  MessageSquare,
  FileText,
  Stars
};

interface AchievementUnlockModalProps {
  userId: string;
  onClose?: () => void;
}

export function AchievementUnlockModal({
  userId,
  onClose
}: AchievementUnlockModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);

  const pendingCelebrations = useQuery(api.achievements.getPendingCelebrations, {
    userId
  });

  const markCelebrationShown = useMutation(api.achievements.markCelebrationShown);

  useEffect(() => {
    if (pendingCelebrations && pendingCelebrations.length > 0 && !currentAchievement) {
      const first = pendingCelebrations[0];
      setCurrentAchievement(first);
      setIsOpen(true);

      // Trigger confetti
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 300);
    }
  }, [pendingCelebrations, currentAchievement]);

  const handleClose = async () => {
    if (currentAchievement) {
      await markCelebrationShown({
        userId,
        achievementId: currentAchievement.definition.achievementId
      });
    }

    setIsOpen(false);
    setCurrentAchievement(null);
    onClose?.();
  };

  if (!currentAchievement) {
    return null;
  }

  const { definition } = currentAchievement;
  const IconComponent = iconMap[definition.iconName] || Award;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-4">
          {/* Celebration Animation */}
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-yellow-200 animate-ping opacity-25" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-4 border-yellow-300 animate-pulse" />
            </div>

            {/* Icon */}
            <div className="relative flex justify-center">
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center shadow-lg animate-bounce",
                  definition.badgeColor
                )}
              >
                <IconComponent className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Trophy sparkle */}
          <div className="flex items-center justify-center gap-2 text-yellow-500">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Achievement Unlocked!
            </span>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>

          {/* Achievement Details */}
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold">
              {definition.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {definition.description}
            </DialogDescription>
          </DialogHeader>

          {/* Points Earned */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
            <Gift className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-green-700">
              +{definition.pointsAwarded} Points
            </span>
          </div>

          {/* Category Badge */}
          <Badge variant="outline" className="capitalize">
            {definition.category}
          </Badge>

          {/* Continue Button */}
          <Button
            onClick={handleClose}
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            Awesome!
          </Button>

          {/* Remaining count */}
          {pendingCelebrations && pendingCelebrations.length > 1 && (
            <p className="text-sm text-muted-foreground">
              +{pendingCelebrations.length - 1} more achievement{pendingCelebrations.length > 2 ? 's' : ''} unlocked!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Toast notification for achievements (lighter weight alternative)
export function useAchievementToasts(userId: string) {
  const [shown, setShown] = useState(new Set<string>());

  const pendingCelebrations = useQuery(api.achievements.getPendingCelebrations, {
    userId
  });

  const markCelebrationShown = useMutation(api.achievements.markCelebrationShown);

  useEffect(() => {
    if (!pendingCelebrations) return;

    for (const celebration of pendingCelebrations) {
      const { definition } = celebration;
      const id = definition.achievementId;

      if (!shown.has(id)) {
        // You would import toast from sonner here
        // toast.success(`Achievement Unlocked: ${definition.name}`, {
        //   description: `+${definition.pointsAwarded} points`,
        //   icon: <Award className="h-5 w-5 text-yellow-500" />,
        // });

        markCelebrationShown({ userId, achievementId: id });
        setShown(prev => new Set(prev).add(id));
      }
    }
  }, [pendingCelebrations, userId, shown, markCelebrationShown]);
}
