"use client";

import {
  Gift,
  Award,
  Copy,
  Star,
  Percent,
  Shield,
  Share2,
  Users,
  Trophy,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Loader2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useUserSync } from "@/hooks/useUserSync";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { AwardcoSSOButton } from "@/components/rewards/AwardcoSSOButton";

const fmt = (n: number) =>
  n.toLocaleString("en-US");

export default function RewardsPage() {
  const [copied, setCopied] = useState(false);
  const { user } = useUserSync();

  // Awardco balance
  const [awardcoBalance, setAwardcoBalance] = useState<number | null>(null);
  const [awardcoLoading, setAwardcoLoading] = useState(true);

  useEffect(() => {
    fetch("/api/awardco/balance")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAwardcoBalance(data.balance);
      })
      .catch(() => {})
      .finally(() => setAwardcoLoading(false));
  }, []);

  // Convex queries and mutations
  const userPoints = useQuery(
    api.rewards.getUserPoints,
    user?.id ? { userId: user.id } : "skip"
  );
  const availableRewards = useQuery(api.rewards.getAvailableRewards);
  const claimedRewards = useQuery(
    api.rewards.getClaimedRewards,
    user?.id ? { userId: user.id } : "skip"
  );
  const claimReward = useMutation(api.rewards.claimReward);

  const referralLink = `https://beta.homeu.co/${user?.firstName?.toLowerCase() || "user"}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimReward = async (reward: any) => {
    if (!user?.id) {
      toast.error("Please sign in to claim rewards");
      return;
    }
    if (!userPoints || userPoints.points < reward.points) {
      toast.error("Not enough points to claim this reward");
      return;
    }
    try {
      const result = await claimReward({
        userId: user.id,
        rewardId: reward.id,
        pointsCost: reward.points,
        rewardTitle: reward.title,
      });
      if (result.success) toast.success(result.message);
    } catch {
      toast.error("Failed to claim reward");
    }
  };

  const getRewardIcon = (iconType: string) => {
    switch (iconType) {
      case "percent": return <Percent className="h-5 w-5 text-green-600" />;
      case "gift": return <Gift className="h-5 w-5 text-blue-600" />;
      case "star": return <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case "shield": return <Shield className="h-5 w-5 text-purple-600" />;
      default: return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "rent": return "bg-green-50 border-green-200";
      case "gift_card": return "bg-blue-50 border-blue-200";
      case "premium": return "bg-yellow-50 border-yellow-200";
      case "credit": return "bg-purple-50 border-purple-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  // How to earn points list
  const earnActivities = [
    { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: "Complete Profile", pts: 50 },
    { icon: <Shield className="h-4 w-4 text-blue-500" />, label: "Verify Identity", pts: 100 },
    { icon: <TrendingUp className="h-4 w-4 text-indigo-500" />, label: "On-Time Rent Payment", pts: 25 },
    { icon: <Users className="h-4 w-4 text-pink-500" />, label: "Refer a Friend", pts: 200 },
    { icon: <Star className="h-4 w-4 text-yellow-500" />, label: "Leave a Review", pts: 50 },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Rewards
        </h1>
        <p className="text-gray-500 mt-1">
          Earn points, redeem rewards, and access the HomeU Rewards Store
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HomeU Points */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-green-600 font-medium mb-1">HomeU Points</p>
            <p className="text-4xl font-bold text-green-700">
              {userPoints ? fmt(userPoints.points) : "0"}
            </p>
            {userPoints?.breakdown && (
              <div className="mt-3 flex justify-center gap-3 text-xs text-green-600/70">
                <span>Welcome: {userPoints.breakdown.welcome}</span>
                <span>Verified: {userPoints.breakdown.verification}</span>
                <span>Profile: {userPoints.breakdown.profileCompletion}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Awardco Balance */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-sm text-amber-600 font-medium mb-1">Awardco Balance</p>
            {awardcoLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto mt-2" />
            ) : (
              <p className="text-4xl font-bold text-amber-700">
                {awardcoBalance !== null
                  ? `$${awardcoBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : "$0.00"}
              </p>
            )}
            <p className="text-xs text-amber-600/60 mt-2">
              {user?.emailAddresses?.[0]?.emailAddress || "Connected via email"}
            </p>
          </CardContent>
        </Card>

        {/* Rewards Claimed */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm text-purple-600 font-medium mb-1">Rewards Claimed</p>
            <p className="text-4xl font-bold text-purple-700">
              {claimedRewards ? fmt(claimedRewards.length) : "0"}
            </p>
            <p className="text-xs text-purple-600/60 mt-2">Lifetime redemptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Awardco Rewards Store CTA */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold">HomeU Rewards Store</h3>
            <p className="text-white/80 text-sm mt-1">
              Browse gift cards, merchandise, experiences and more. Powered by Awardco.
            </p>
          </div>
          <AwardcoSSOButton
            variant="secondary"
            size="lg"
            className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shrink-0"
          >
            Open Rewards Store
          </AwardcoSSOButton>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Rewards (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Available Rewards
              </CardTitle>
              <CardDescription>Redeem your HomeU points for these rewards</CardDescription>
            </CardHeader>
            <CardContent>
              {!availableRewards ? (
                <div className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto" />
                  <p className="text-gray-400 mt-2 text-sm">Loading rewards...</p>
                </div>
              ) : availableRewards.length === 0 ? (
                <div className="text-center py-10">
                  <Gift className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No rewards available right now. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRewards.map((reward: any) => {
                    const hasEnough = userPoints && userPoints.points >= reward.points;
                    return (
                      <div
                        key={reward.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getCategoryStyle(reward.category)} ${
                          hasEnough ? "hover:shadow-md" : "opacity-70"
                        }`}
                      >
                        <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                          {getRewardIcon(reward.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{reward.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5 truncate">{reward.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="secondary" className="mb-1 text-xs font-semibold">
                            {fmt(reward.points)} pts
                          </Badge>
                          <br />
                          <Button
                            size="sm"
                            onClick={() => handleClaimReward(reward)}
                            disabled={!hasEnough || !reward.available}
                            className={`text-xs mt-1 ${
                              hasEnough
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : ""
                            }`}
                          >
                            {hasEnough ? "Claim" : "Need More"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How to Earn (1 col sidebar) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                How to Earn Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earnActivities.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      {a.icon}
                    </div>
                    <span className="text-sm flex-1">{a.label}</span>
                    <Badge variant="outline" className="text-xs font-semibold">
                      +{fmt(a.pts)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Claimed History */}
          {claimedRewards && claimedRewards.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Recently Claimed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {claimedRewards.slice(0, 5).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-gray-700 truncate">{c.rewardTitle}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        -{fmt(c.pointsCost)} pts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Refer a Friend Section */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-1">Refer a Friend, Earn 200 Points</h2>
              <p className="text-gray-600 text-sm mb-4">
                Share your link. When they sign up and verify, you both earn bonus points!
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="w-full p-3 pr-12 border rounded-xl bg-white text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Copy referral link"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
                <Button
                  onClick={copyToClipboard}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shrink-0 rounded-xl"
                  size="lg"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Share Link"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
