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
  CreditCard,
  ShoppingBag,
  Headphones,
  Home,
  Plane,
  Tv,
  Coffee,
  Ticket,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useCallback } from "react";
import { useUserSync } from "@/hooks/useUserSync";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
const fmt = (n: number) => n.toLocaleString("en-US");

// Awardco reward categories — these are live in the HomeU Rewards program
const rewardCategories = [
  {
    id: "prepaid-cards",
    name: "Prepaid Cards",
    description: "Visa & Mastercard virtual prepaid cards",
    icon: CreditCard,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    id: "egift-cards",
    name: "eGift Cards",
    description: "Amazon, Target, Starbucks & hundreds more",
    icon: Gift,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  {
    id: "best-buy",
    name: "Best Buy",
    description: "Electronics, tech, appliances & more",
    icon: Tv,
    color: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600",
  },
  {
    id: "tickets",
    name: "Tickets",
    description: "Concerts, sports & live events",
    icon: Ticket,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-600",
  },
  {
    id: "experiences",
    name: "Experiences",
    description: "Travel, dining & entertainment",
    icon: Plane,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    id: "hotels",
    name: "Hotels",
    description: "Book hotels & travel stays",
    icon: Home,
    color: "from-teal-500 to-cyan-500",
    bgColor: "bg-teal-50 border-teal-200",
    iconColor: "text-teal-600",
  },
  {
    id: "giving",
    name: "Charitable Giving",
    description: "Donate your points to charities",
    icon: Heart,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
  },
];

// Popular specific items from the Awardco HomeU Rewards catalog
const popularItems = [
  {
    name: "Virtual Prepaid Card",
    points: "100+ Points",
    icon: CreditCard,
    bgColor: "bg-gradient-to-br from-slate-100 to-slate-200",
    iconColor: "text-slate-700",
  },
  {
    name: "Amazon Gift Card",
    points: "500+ Points",
    icon: ShoppingBag,
    bgColor: "bg-gradient-to-br from-amber-100 to-amber-200",
    iconColor: "text-amber-700",
  },
  {
    name: "Best Buy",
    points: "500+ Points",
    icon: Tv,
    bgColor: "bg-gradient-to-br from-yellow-100 to-yellow-200",
    iconColor: "text-yellow-700",
  },
  {
    name: "Starbucks Card",
    points: "500+ Points",
    icon: Coffee,
    bgColor: "bg-gradient-to-br from-green-100 to-green-200",
    iconColor: "text-green-700",
  },
  {
    name: "Hotel Booking",
    points: "1,000+ Points",
    icon: Home,
    bgColor: "bg-gradient-to-br from-teal-100 to-teal-200",
    iconColor: "text-teal-700",
  },
  {
    name: "Donate to Charity",
    points: "100+ Points",
    icon: Heart,
    bgColor: "bg-gradient-to-br from-rose-100 to-rose-200",
    iconColor: "text-rose-600",
  },
];

export default function RewardsPage() {
  const [copied, setCopied] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const { user } = useUserSync();

  // No longer fetching Awardco dollar balance — we run on points

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

  const referralLink = `https://www.homeu.co/${user?.firstName?.toLowerCase() || "user"}`;

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

  // Open the Awardco store via SSO in a popup window
  const openRewardsStore = useCallback(() => {
    setStoreLoading(true);
    const width = 1100;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const ssoWindow = window.open(
      "/api/awardco/sso",
      "homeu_rewards_store",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (!ssoWindow) {
      toast.info("Opening Rewards Store...");
      window.location.href = "/api/awardco/sso";
      setStoreLoading(false);
      return;
    }

    const checkWindow = setInterval(() => {
      if (ssoWindow.closed) {
        clearInterval(checkWindow);
        setStoreLoading(false);
        // Store closed - user may have redeemed points
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkWindow);
      setStoreLoading(false);
    }, 30000);
  }, []);

  const getRewardIcon = (iconType: string) => {
    switch (iconType) {
      case "percent":
        return <Percent className="h-5 w-5 text-green-600" />;
      case "gift":
        return <Gift className="h-5 w-5 text-blue-600" />;
      case "star":
        return (
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        );
      case "shield":
        return <Shield className="h-5 w-5 text-purple-600" />;
      default:
        return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "rent":
        return "bg-green-50 border-green-200";
      case "gift_card":
        return "bg-blue-50 border-blue-200";
      case "premium":
        return "bg-yellow-50 border-yellow-200";
      case "credit":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // How to earn points list
  const earnActivities = [
    {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      label: "Complete Profile",
      pts: 50,
    },
    {
      icon: <Shield className="h-4 w-4 text-blue-500" />,
      label: "Verify Identity",
      pts: 100,
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-indigo-500" />,
      label: "On-Time Rent Payment",
      pts: 25,
    },
    {
      icon: <Users className="h-4 w-4 text-pink-500" />,
      label: "Refer a Friend",
      pts: 200,
    },
    {
      icon: <Star className="h-4 w-4 text-yellow-500" />,
      label: "Leave a Review",
      pts: 50,
    },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Rewards
          </h1>
          <p className="text-gray-500 mt-1">
            Earn points, spend on rewards, and access the HomeU Rewards Store
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
              <p className="text-sm text-green-600 font-medium mb-1">
                HomeU Points
              </p>
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

          {/* Points Per Payment */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-sm text-amber-600 font-medium mb-1">
                Earning Rate
              </p>
              <p className="text-4xl font-bold text-amber-700">200</p>
              <p className="text-xs text-amber-600/60 mt-2">
                Points per rent payment
              </p>
            </CardContent>
          </Card>

          {/* Rewards Claimed */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-purple-600 font-medium mb-1">
                Rewards Claimed
              </p>
              <p className="text-4xl font-bold text-purple-700">
                {claimedRewards ? fmt(claimedRewards.length) : "0"}
              </p>
              <p className="text-xs text-purple-600/60 mt-2">
                Lifetime redemptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Spend Points CTA */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold">
                Spend Your Points
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Browse gift cards, prepaid cards, experiences, and more. Your
                points, your choice.
              </p>
            </div>
            <Button
              onClick={openRewardsStore}
              disabled={storeLoading}
              size="lg"
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shrink-0"
            >
              {storeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Open Rewards Store
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Popular Choices Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Popular Choices
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={openRewardsStore}
              className="text-emerald-600 hover:text-emerald-700"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularItems.map((item) => (
              <button
                key={item.name}
                onClick={openRewardsStore}
                className="group text-left"
              >
                <div
                  className={`${item.bgColor} rounded-xl p-6 flex items-center justify-center aspect-square mb-2 transition-all group-hover:shadow-md group-hover:scale-[1.02]`}
                >
                  <item.icon
                    className={`h-10 w-10 ${item.iconColor} transition-transform group-hover:scale-110`}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">{item.points}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Browse by Category */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-emerald-500" />
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={openRewardsStore}
                className={`group flex items-center gap-4 p-4 rounded-xl border ${cat.bgColor} transition-all hover:shadow-md text-left`}
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0 shadow-sm`}
                >
                  <cat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cat.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Rewards (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  HomeU Rewards
                </CardTitle>
                <CardDescription>
                  Redeem your HomeU points for these platform rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!availableRewards ? (
                  <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto" />
                    <p className="text-gray-400 mt-2 text-sm">
                      Loading rewards...
                    </p>
                  </div>
                ) : availableRewards.length === 0 ? (
                  <div className="text-center py-10">
                    <Gift className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      No rewards available right now. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableRewards.map((reward: any) => {
                      const hasEnough =
                        userPoints && userPoints.points >= reward.points;
                      return (
                        <div
                          key={reward.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getCategoryStyle(
                            reward.category
                          )} ${hasEnough ? "hover:shadow-md" : "opacity-70"}`}
                        >
                          <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                            {getRewardIcon(reward.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              {reward.title}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5 truncate">
                              {reward.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              variant="secondary"
                              className="mb-1 text-xs font-semibold"
                            >
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
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold"
                      >
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
                    {claimedRewards
                      .slice(0, 5)
                      .map((c: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="text-sm text-gray-700 truncate">
                            {c.rewardTitle}
                          </span>
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
                <h2 className="text-xl font-bold mb-1">
                  Refer a Friend, Earn 200 Points
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Share your link. When they sign up and verify, you both earn
                  bonus points!
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

    </>
  );
}
