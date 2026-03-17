'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Megaphone,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  BarChart3,
  MousePointerClick,
  Eye,
  UserPlus,
  ArrowRight,
  Globe,
  Instagram,
  Search,
  Mail,
  MessageSquare,
  Building2,
  GraduationCap,
  Handshake,
  Plus,
  Trash2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CampaignChannel {
  id: string;
  name: string;
  icon: any;
  monthlyBudget: number;
  impressions: number;
  clicks: number;
  signups: number;
  conversions: number;
  costPerAcquisition: number;
  status: 'active' | 'paused' | 'planned';
}

const defaultChannels: CampaignChannel[] = [
  {
    id: 'google-ads',
    name: 'Google Ads',
    icon: Search,
    monthlyBudget: 500,
    impressions: 25000,
    clicks: 750,
    signups: 38,
    conversions: 15,
    costPerAcquisition: 33.33,
    status: 'active',
  },
  {
    id: 'instagram',
    name: 'Instagram / Meta Ads',
    icon: Instagram,
    monthlyBudget: 400,
    impressions: 40000,
    clicks: 1200,
    signups: 45,
    conversions: 18,
    costPerAcquisition: 22.22,
    status: 'active',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: MessageSquare,
    monthlyBudget: 300,
    impressions: 60000,
    clicks: 900,
    signups: 30,
    conversions: 10,
    costPerAcquisition: 30.00,
    status: 'planned',
  },
  {
    id: 'seo',
    name: 'SEO / Organic',
    icon: Globe,
    monthlyBudget: 0,
    impressions: 5000,
    clicks: 250,
    signups: 12,
    conversions: 5,
    costPerAcquisition: 0,
    status: 'active',
  },
  {
    id: 'email',
    name: 'Email Outreach',
    icon: Mail,
    monthlyBudget: 50,
    impressions: 2000,
    clicks: 400,
    signups: 20,
    conversions: 8,
    costPerAcquisition: 6.25,
    status: 'active',
  },
  {
    id: 'referral',
    name: 'Referral Program',
    icon: Users,
    monthlyBudget: 200,
    impressions: 0,
    clicks: 0,
    signups: 15,
    conversions: 12,
    costPerAcquisition: 16.67,
    status: 'active',
  },
  {
    id: 'student-housing',
    name: 'Student Housing Partnerships',
    icon: GraduationCap,
    monthlyBudget: 100,
    impressions: 3000,
    clicks: 200,
    signups: 25,
    conversions: 10,
    costPerAcquisition: 10.00,
    status: 'planned',
  },
  {
    id: 'pm-partnerships',
    name: 'PM Direct Partnerships',
    icon: Handshake,
    monthlyBudget: 0,
    impressions: 0,
    clicks: 0,
    signups: 50,
    conversions: 35,
    costPerAcquisition: 0,
    status: 'planned',
  },
];

export default function MarketingPage() {
  const [channels, setChannels] = useState<CampaignChannel[]>(defaultChannels);
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n: number) => n.toLocaleString('en-US');

  // Aggregates
  const totalBudget = channels.reduce((sum, c) => sum + c.monthlyBudget, 0);
  const totalImpressions = channels.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = channels.reduce((sum, c) => sum + c.clicks, 0);
  const totalSignups = channels.reduce((sum, c) => sum + c.signups, 0);
  const totalConversions = channels.reduce((sum, c) => sum + c.conversions, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
  const avgConversionRate = totalSignups > 0 ? ((totalConversions / totalSignups) * 100).toFixed(1) : '0';
  const blendedCPA = totalConversions > 0 ? totalBudget / totalConversions : 0;

  // LTV calculation ($9.99/mo x avg 12 months tenure)
  const avgTenureMonths = 12;
  const ltv = 9.99 * avgTenureMonths;
  const ltvToCpaRatio = blendedCPA > 0 ? (ltv / blendedCPA).toFixed(1) : 'N/A';

  const updateChannel = (id: string, field: keyof CampaignChannel, value: any) => {
    setChannels(channels.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      // Recalculate CPA
      if (updated.conversions > 0 && updated.monthlyBudget > 0) {
        updated.costPerAcquisition = updated.monthlyBudget / updated.conversions;
      }
      return updated;
    }));
  };

  // Sort by best performing (lowest CPA with conversions)
  const rankedChannels = [...channels]
    .filter(c => c.conversions > 0)
    .sort((a, b) => a.costPerAcquisition - b.costPerAcquisition);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-purple-600" />
            Marketing Analytics
          </h1>
          <p className="text-gray-600 mt-1">Track campaigns, measure performance, and optimize spend</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-quarter">This Quarter</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Monthly Spend</p>
            <p className="text-xl font-bold">${fmtInt(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Impressions</p>
            <p className="text-xl font-bold">{fmtInt(totalImpressions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MousePointerClick className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Clicks (CTR {avgCTR}%)</p>
            <p className="text-xl font-bold">{fmtInt(totalClicks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserPlus className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Signups</p>
            <p className="text-xl font-bold">{fmtInt(totalSignups)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Conversions ({avgConversionRate}%)</p>
            <p className="text-xl font-bold">{fmtInt(totalConversions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Blended CPA</p>
            <p className="text-xl font-bold">${fmt(blendedCPA)}</p>
          </CardContent>
        </Card>
      </div>

      {/* LTV:CPA Card */}
      <Card className={`border-2 ${Number(ltvToCpaRatio) >= 3 ? 'border-green-500 bg-green-50' : Number(ltvToCpaRatio) >= 1.5 ? 'border-amber-500 bg-amber-50' : 'border-red-500 bg-red-50'}`}>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">LTV : CPA Ratio</h3>
            <p className="text-sm text-gray-600">
              Customer Lifetime Value (${fmt(ltv)}) vs Cost Per Acquisition (${fmt(blendedCPA)})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on ${9.99}/mo fee x {avgTenureMonths} month avg tenure. Target: 3:1 or higher.
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{ltvToCpaRatio}x</p>
            <Badge className={Number(ltvToCpaRatio) >= 3 ? 'bg-green-600' : Number(ltvToCpaRatio) >= 1.5 ? 'bg-amber-600' : 'bg-red-600'}>
              {Number(ltvToCpaRatio) >= 3 ? 'Healthy' : Number(ltvToCpaRatio) >= 1.5 ? 'Moderate' : 'Needs Improvement'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Channel Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Channel Ranking (Best CPA)
          </CardTitle>
          <CardDescription>Channels ranked by cost-effectiveness. Lower CPA = better.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankedChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-green-600' : index === 1 ? 'bg-blue-600' : index === 2 ? 'bg-purple-600' : 'bg-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <Icon className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{channel.name}</p>
                    <p className="text-xs text-gray-500">
                      {channel.conversions} conversions from {fmtInt(channel.signups)} signups
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {channel.costPerAcquisition === 0 ? 'Free' : `$${fmt(channel.costPerAcquisition)}`}
                    </p>
                    <p className="text-xs text-gray-500">per acquisition</p>
                  </div>
                  <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
                    {channel.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Channel Details (Editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Campaign Channels
          </CardTitle>
          <CardDescription>Edit budget and metrics to track actual performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-600">Channel</th>
                  <th className="text-left p-2 font-medium text-gray-600">Status</th>
                  <th className="text-right p-2 font-medium text-gray-600">Budget</th>
                  <th className="text-right p-2 font-medium text-gray-600">Impressions</th>
                  <th className="text-right p-2 font-medium text-gray-600">Clicks</th>
                  <th className="text-right p-2 font-medium text-gray-600">Signups</th>
                  <th className="text-right p-2 font-medium text-gray-600">Conversions</th>
                  <th className="text-right p-2 font-medium text-gray-600">CPA</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <tr key={channel.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Select
                          value={channel.status}
                          onValueChange={(v) => updateChannel(channel.id, 'status', v)}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="planned">Planned</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={channel.monthlyBudget}
                          onChange={(e) => updateChannel(channel.id, 'monthlyBudget', Number(e.target.value))}
                          className="h-8 w-24 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={channel.impressions}
                          onChange={(e) => updateChannel(channel.id, 'impressions', Number(e.target.value))}
                          className="h-8 w-24 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={channel.clicks}
                          onChange={(e) => updateChannel(channel.id, 'clicks', Number(e.target.value))}
                          className="h-8 w-24 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={channel.signups}
                          onChange={(e) => updateChannel(channel.id, 'signups', Number(e.target.value))}
                          className="h-8 w-20 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={channel.conversions}
                          onChange={(e) => updateChannel(channel.id, 'conversions', Number(e.target.value))}
                          className="h-8 w-20 text-right text-sm"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
                        {channel.costPerAcquisition === 0 ? 'Free' : `$${fmt(channel.costPerAcquisition)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="p-2" colSpan={2}>Totals</td>
                  <td className="p-2 text-right">${fmtInt(totalBudget)}</td>
                  <td className="p-2 text-right">{fmtInt(totalImpressions)}</td>
                  <td className="p-2 text-right">{fmtInt(totalClicks)}</td>
                  <td className="p-2 text-right">{fmtInt(totalSignups)}</td>
                  <td className="p-2 text-right">{fmtInt(totalConversions)}</td>
                  <td className="p-2 text-right">${fmt(blendedCPA)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Target Markets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Target Markets
          </CardTitle>
          <CardDescription>Key segments to focus marketing efforts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Student Housing</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                College students need credit history. Credit reporting is the primary value prop.
              </p>
              <div className="space-y-1 text-xs text-blue-600">
                <p>Channels: University partnerships, Instagram, TikTok</p>
                <p>Messaging: "Build credit while paying rent"</p>
                <p>Target CPA: &lt;$15</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Multifamily Complexes</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Partner with PMs to offer HomeU as an amenity. Bulk resident onboarding.
              </p>
              <div className="space-y-1 text-xs text-green-600">
                <p>Channels: PM outreach, industry events, LinkedIn</p>
                <p>Messaging: "Reduce late payments, happier residents"</p>
                <p>Target CPA: $0 (PM pays nothing, residents opt-in)</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Young Professionals</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Value rewards and convenience. Credit reporting + rewards double value prop.
              </p>
              <div className="space-y-1 text-xs text-purple-600">
                <p>Channels: Google Ads, referral program, SEO</p>
                <p>Messaging: "Earn rewards every time you pay rent"</p>
                <p>Target CPA: &lt;$25</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
