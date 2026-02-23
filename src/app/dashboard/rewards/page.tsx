"use client";

import { Gift, Award, Copy, Star, Percent, Shield, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { useUserSync } from "@/hooks/useUserSync";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";

export default function RewardsPage() {
  const [copied, setCopied] = useState(false);
  const { user } = useUserSync();

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

  const referralLink = `https://beta.homeu.co/${user?.firstName?.toLowerCase() || 'user'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
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

      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("Failed to claim reward");
      console.error("Claim reward error:", error);
    }
  };

  const getRewardIcon = (iconType: string, category: string) => {
    switch (iconType) {
      case "percent":
        return <Percent className="h-6 w-6 text-green-500" />;
      case "gift":
        return <Gift className="h-6 w-6 text-blue-500" />;
      case "star":
        return <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case "shield":
        return <Shield className="h-6 w-6 text-purple-500" />;
      default:
        return <Star className="h-6 w-6 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "rent":
        return "bg-green-100";
      case "gift_card":
        return "bg-blue-100";
      case "premium":
        return "bg-yellow-100";
      case "credit":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Rewards</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left panel - Total points */}
        <div className="bg-white rounded-lg border border-green-200 p-8 flex flex-col items-center justify-center text-center h-[350px]">
          <h2 className="text-xl font-semibold mb-6">Total points earned</h2>

          <div className="relative w-24 h-24 mb-4">
            <Image
              src="/gift-box.svg"
              alt="Gift box"
              width={96}
              height={96}
              className="object-contain"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
              }}
            />
            {/* Fallback gift box if image fails to load */}
            <div className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden="true">
              🎁
            </div>
          </div>

          <div className="text-5xl font-bold text-green-600 mb-4">
            {userPoints ? `${userPoints.points} pts` : "0 pts"}
          </div>

          {userPoints?.breakdown && (
            <div className="text-xs text-gray-500 mb-4">
              <div>Welcome: {userPoints.breakdown.welcome} pts</div>
              <div>Verification: {userPoints.breakdown.verification} pts</div>
              <div>Profile: {userPoints.breakdown.profileCompletion} pts</div>
            </div>
          )}

          <p className="text-gray-600 text-sm">
            Earn more points, redeem exciting gifts and enjoy your experience
          </p>
        </div>
        
        {/* Right panel - Rewards and referral */}
        <div className="md:col-span-2 space-y-6">
          {/* Rewards section */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-6">Available Rewards</h2>

            {!availableRewards ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading rewards...</p>
              </div>
            ) : availableRewards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No rewards available at the moment.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {availableRewards.map((reward: any) => (
                  <div key={reward.id} className="flex items-center justify-between border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getCategoryColor(reward.category)}`}>
                        {getRewardIcon(reward.icon, reward.category)}
                      </div>
                      <div>
                        <div className="font-semibold">{reward.title}</div>
                        <div className="text-gray-500 text-sm">{reward.description}</div>
                        <div className="text-green-600 text-sm font-medium">{reward.points} Points</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleClaimReward(reward)}
                      disabled={!userPoints || userPoints.points < reward.points || !reward.available}
                      className={`rounded-full px-6 ${
                        !userPoints || userPoints.points < reward.points
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {!userPoints || userPoints.points < reward.points ? "Not Enough Points" : "Claim Now"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Refer a Friend Section */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 shrink-0">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold mb-1">Refer a Friend, Earn Points</h2>
            <p className="text-gray-600 text-sm mb-4">
              Share your referral link with friends. When they sign up and complete verification, you both earn bonus points!
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="w-full p-3 pr-12 border rounded-lg bg-white text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <Button
                onClick={copyToClipboard}
                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Share Link"}
              </Button>
            </div>
            {copied && (
              <p className="mt-2 text-sm text-green-600">Referral link copied to clipboard!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 