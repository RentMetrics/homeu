"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AchievementCardProps {
  achievement: {
    achievementId: string;
    name: string;
    description: string;
    category: string;
    iconName: string;
    badgeColor: string;
    pointsAwarded: number;
    isUnlocked: boolean;
    currentValue?: number;
    percentComplete?: number;
    status?: string;
    unlockedAt?: number;
    requirements?: {
      target: number;
    };
  };
  compact?: boolean;
  onClick?: () => void;
}

export function AchievementCard({
  achievement,
  compact = false,
  onClick
}: AchievementCardProps) {
  const IconComponent = iconMap[achievement.iconName] || Award;
  const isLocked = !achievement.isUnlocked && achievement.status === "locked";
  const isInProgress = achievement.status === "in_progress";

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all",
          achievement.isUnlocked
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            : isLocked
              ? "bg-gray-50 border-gray-200 opacity-60"
              : "bg-white border-gray-200 hover:border-green-300",
          onClick && "cursor-pointer hover:shadow-sm"
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            achievement.isUnlocked
              ? achievement.badgeColor
              : "bg-gray-200"
          )}
        >
          {isLocked ? (
            <Lock className="h-5 w-5 text-gray-400" />
          ) : (
            <IconComponent
              className={cn(
                "h-5 w-5",
                achievement.isUnlocked ? "text-white" : "text-gray-500"
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            isLocked && "text-gray-400"
          )}>
            {achievement.name}
          </p>
          {isInProgress && (
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={achievement.percentComplete || 0}
                className="h-1.5 flex-1"
              />
              <span className="text-xs text-muted-foreground">
                {achievement.percentComplete}%
              </span>
            </div>
          )}
        </div>
        {achievement.isUnlocked && (
          <Badge className="bg-green-100 text-green-800 shrink-0">
            +{achievement.pointsAwarded}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        achievement.isUnlocked
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm"
          : isLocked
            ? "bg-gray-50 border-gray-200"
            : "bg-white border-gray-200 hover:border-green-300 hover:shadow-sm",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Unlocked indicator */}
      {achievement.isUnlocked && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            achievement.isUnlocked
              ? achievement.badgeColor
              : "bg-gray-200"
          )}
        >
          {isLocked ? (
            <Lock className="h-8 w-8 text-gray-400" />
          ) : (
            <IconComponent
              className={cn(
                "h-8 w-8",
                achievement.isUnlocked ? "text-white" : "text-gray-500"
              )}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-center">
        <h3
          className={cn(
            "font-semibold mb-1",
            isLocked && "text-gray-400"
          )}
        >
          {achievement.name}
        </h3>
        <p
          className={cn(
            "text-sm mb-3",
            isLocked ? "text-gray-400" : "text-muted-foreground"
          )}
        >
          {achievement.description}
        </p>

        {/* Progress bar for in-progress achievements */}
        {isInProgress && (
          <div className="mb-3">
            <Progress
              value={achievement.percentComplete || 0}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {achievement.currentValue || 0} / {achievement.requirements?.target || 0}
            </p>
          </div>
        )}

        {/* Points badge */}
        <Badge
          className={cn(
            achievement.isUnlocked
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          )}
        >
          <Gift className="h-3 w-3 mr-1" />
          {achievement.pointsAwarded} points
        </Badge>

        {/* Unlock date */}
        {achievement.isUnlocked && achievement.unlockedAt && (
          <p className="text-xs text-green-600 mt-2">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
