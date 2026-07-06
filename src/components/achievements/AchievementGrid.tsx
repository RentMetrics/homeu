"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AchievementCard } from "./AchievementCard";
import {
  Trophy,
  Wallet,
  Flame,
  UserPlus,
  Calendar,
  MessageSquare,
  Gift
} from "lucide-react";

interface AchievementGridProps {
  userId: string;
}

interface AchievementProgress {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  badgeColor: string;
  pointsAwarded: number;
  isHidden: boolean;
  displayOrder?: number;
  status: "locked" | "in_progress" | "completed";
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  unlockedAt?: number;
}

interface RecentUnlock {
  _id: string;
  name: string;
  pointsAwarded: number;
}

const categoryConfig = {
  all: { label: "All", icon: Trophy },
  onboarding: { label: "Onboarding", icon: Gift },
  payment: { label: "Payments", icon: Wallet },
  streak: { label: "Streaks", icon: Flame },
  referral: { label: "Referrals", icon: UserPlus },
  milestone: { label: "Milestones", icon: Calendar },
  engagement: { label: "Engagement", icon: MessageSquare },
};

export function AchievementGrid({ userId }: AchievementGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const achievementData = useQuery(api.achievements.getUserAchievementProgress, {
    userId
  });

  if (!achievementData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading achievements...</p>
        </CardContent>
      </Card>
    );
  }

  const { achievements, summary } = achievementData;

  // Filter by category
  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter((a) => a.category === selectedCategory);

  // Sort: unlocked first, then in-progress, then locked
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const statusOrder = { completed: 0, in_progress: 1, locked: 2 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50">
              {summary.unlocked} / {summary.total} Unlocked
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              <Gift className="h-3 w-3 mr-1" />
              {summary.totalPointsFromAchievements} pts earned
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{summary.unlocked}</p>
            <p className="text-sm text-muted-foreground">Unlocked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{summary.locked}</p>
            <p className="text-sm text-muted-foreground">Locked</p>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full"
        >
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            {sortedAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No achievements in this category yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.achievementId}
                    achievement={achievement}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Compact version for dashboard sidebar
export function AchievementSummary({ userId }: { userId: string }) {
  const achievementData = useQuery(api.achievements.getUserAchievementProgress, {
    userId
  });

  const recentUnlocks = useQuery(api.achievements.getRecentUnlocks, {
    userId,
    limit: 3
  });

  if (!achievementData) {
    return null;
  }

  const { summary } = achievementData;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <Badge variant="outline">
            {summary.unlocked} / {summary.total}
          </Badge>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{
              width: `${(summary.unlocked / summary.total) * 100}%`
            }}
          />
        </div>

        {recentUnlocks && recentUnlocks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Recent Unlocks
            </p>
            {recentUnlocks.map((unlock: RecentUnlock) => (
              <div
                key={unlock._id}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="truncate">{unlock.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  +{unlock.pointsAwarded}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
