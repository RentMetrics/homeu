"use client";

import { Gift, Award, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

// Reward options data
const rewardOptions = [
  {
    id: 1,
    title: "7 days of free Superz",
    points: 100,
    icon: "star-gold" // Different badges for each reward
  },
  {
    id: 2,
    title: "7 days of free Superz",
    points: 100,
    icon: "star-silver"
  },
  {
    id: 3,
    title: "7 days of free Superz",
    points: 100,
    icon: "star-bronze"
  }
];

export default function RewardsPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://beta.homeu.co/curtisholder";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Rewards</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left panel - Total points */}
        <div className="bg-white rounded-lg border border-blue-200 p-8 flex flex-col items-center justify-center text-center h-[350px]">
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
          
          <div className="text-5xl font-bold text-blue-500 mb-4">688 pts</div>
          
          <p className="text-gray-600 text-sm">
            Earn more points, redeem exciting gifts and enjoy you experience
          </p>
        </div>
        
        {/* Right panel - Rewards and referral */}
        <div className="md:col-span-2 space-y-6">
          {/* Rewards section */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-6">Rewards</h2>
            
            <div className="space-y-6">
              {rewardOptions.map((reward, index) => (
                <div key={reward.id} className="flex items-center justify-between border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-${index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}-100 flex items-center justify-center`}>
                      {index === 0 ? (
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      ) : index === 1 ? (
                        <Star className="h-6 w-6 text-gray-400 fill-gray-400" />
                      ) : (
                        <Star className="h-6 w-6 text-orange-500 fill-orange-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{reward.title}</div>
                      <div className="text-gray-500 text-sm">{reward.points} Points</div>
                    </div>
                  </div>
                  <Button className="rounded-full px-6 bg-blue-500 hover:bg-blue-600 text-white">
                    Claim Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Referral Code section */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Referral Code</h2>
            <div className="relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full p-3 pr-12 border rounded-lg bg-gray-50"
              />
              <button 
                onClick={copyToClipboard}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Copy to clipboard"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            {copied && (
              <div className="mt-2 text-sm text-green-600">Copied to clipboard!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 