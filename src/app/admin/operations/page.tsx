'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  CreditCard,
  Gift,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Receipt,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Fee constants (matching convex/homeuFees.ts)
const PLATFORM_FEE = 9.99;
const OPERATIONS_FEE = 4.99;
const REWARDS_FUNDING = 2.00;
const CREDIT_REPORTING = 3.00;

export default function OperationsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [projectedResidents, setProjectedResidents] = useState('100');

  const residents = parseInt(projectedResidents) || 0;

  // Revenue projections based on resident count
  const monthlyRevenue = {
    grossFees: residents * PLATFORM_FEE,
    operationsRevenue: residents * OPERATIONS_FEE,
    rewardsFunding: residents * REWARDS_FUNDING,
    creditReporting: residents * CREDIT_REPORTING,
  };

  const annualRevenue = {
    grossFees: monthlyRevenue.grossFees * 12,
    operationsRevenue: monthlyRevenue.operationsRevenue * 12,
    rewardsFunding: monthlyRevenue.rewardsFunding * 12,
    creditReporting: monthlyRevenue.creditReporting * 12,
  };

  // Estimated expenses (editable later)
  const monthlyExpenses = {
    straddleProcessing: residents * 0.50, // ~$0.50 per ACH transaction
    awardcoPlatform: 200, // Awardco monthly platform fee estimate
    convexHosting: 25, // Convex database
    vercelHosting: 20, // Vercel hosting
    clerkAuth: residents > 10000 ? 100 : 0, // Clerk free tier up to 10k
    creditBureauCosts: residents * 2.50, // Wholesale credit reporting cost
    domainEmail: 7.20, // Google Workspace
    miscellaneous: 50,
  };

  const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);
  const monthlyProfit = monthlyRevenue.operationsRevenue - totalMonthlyExpenses;
  const annualProfit = monthlyProfit * 12;
  const profitMargin = monthlyRevenue.grossFees > 0
    ? ((monthlyProfit / monthlyRevenue.grossFees) * 100).toFixed(1)
    : '0';

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-green-600" />
            Operations & Finance
          </h1>
          <p className="text-gray-600 mt-1">Revenue tracking, expense management, and financial projections</p>
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

      {/* Resident Count Input */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-center gap-4">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Active Residents (Projections)</span>
          <Input
            type="number"
            value={projectedResidents}
            onChange={(e) => setProjectedResidents(e.target.value)}
            className="w-32 bg-white"
            min={0}
          />
          <span className="text-xs text-blue-600">Adjust to model different scenarios</span>
        </CardContent>
      </Card>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${fmt(monthlyRevenue.grossFees)}</div>
            <p className="text-xs text-gray-500">{residents} residents x ${PLATFORM_FEE}/mo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Operations Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">${fmt(monthlyRevenue.operationsRevenue)}</div>
            <p className="text-xs text-gray-500">${OPERATIONS_FEE} per resident</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            {monthlyProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${fmt(monthlyProfit)}
            </div>
            <p className="text-xs text-gray-500">{profitMargin}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Projection</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">${fmt(annualProfit)}</div>
            <p className="text-xs text-gray-500">${fmt(annualRevenue.grossFees)} gross</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Revenue Breakdown (Monthly)
            </CardTitle>
            <CardDescription>How the $9.99 platform fee breaks down per resident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual bar */}
            <div className="h-8 rounded-full overflow-hidden flex">
              <div className="bg-green-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: '49.9%' }}>
                ${OPERATIONS_FEE}
              </div>
              <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: '30%' }}>
                ${CREDIT_REPORTING}
              </div>
              <div className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: '20.1%' }}>
                ${REWARDS_FUNDING}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Operations Revenue</p>
                    <p className="text-xs text-gray-500">Platform, payment processing, margin</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${fmt(monthlyRevenue.operationsRevenue)}/mo</p>
                  <p className="text-xs text-gray-500">${OPERATIONS_FEE} x {residents}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Credit Reporting</p>
                    <p className="text-xs text-gray-500">Experian, Equifax, TransUnion</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${fmt(monthlyRevenue.creditReporting)}/mo</p>
                  <p className="text-xs text-gray-500">${CREDIT_REPORTING} x {residents}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Rewards Funding</p>
                    <p className="text-xs text-gray-500">Awardco reward account funding</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${fmt(monthlyRevenue.rewardsFunding)}/mo</p>
                  <p className="text-xs text-gray-500">${REWARDS_FUNDING} x {residents}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
              Expenses (Monthly)
            </CardTitle>
            <CardDescription>Operating costs and vendor expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Credit Bureau (wholesale)', amount: monthlyExpenses.creditBureauCosts, desc: `$2.50 x ${residents} residents`, icon: CreditCard },
                { label: 'Straddle (ACH processing)', amount: monthlyExpenses.straddleProcessing, desc: `~$0.50 x ${residents} transactions`, icon: Receipt },
                { label: 'Awardco Platform', amount: monthlyExpenses.awardcoPlatform, desc: 'Monthly subscription', icon: Gift },
                { label: 'Convex (database)', amount: monthlyExpenses.convexHosting, desc: 'Serverless database', icon: Building2 },
                { label: 'Vercel (hosting)', amount: monthlyExpenses.vercelHosting, desc: 'Web hosting & CDN', icon: Building2 },
                { label: 'Clerk (auth)', amount: monthlyExpenses.clerkAuth, desc: residents > 10000 ? 'Paid tier' : 'Free tier (< 10K users)', icon: Users },
                { label: 'Google Workspace', amount: monthlyExpenses.domainEmail, desc: 'Email & productivity', icon: Receipt },
                { label: 'Miscellaneous', amount: monthlyExpenses.miscellaneous, desc: 'Buffer for misc costs', icon: AlertCircle },
              ].map((expense) => (
                <div key={expense.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <expense.icon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{expense.label}</p>
                      <p className="text-xs text-gray-500">{expense.desc}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">${fmt(expense.amount)}</p>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t-2">
                <p className="font-bold">Total Monthly Expenses</p>
                <p className="font-bold text-red-600">${fmt(totalMonthlyExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Profit & Loss Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Monthly</h3>
              <div className="flex justify-between"><span className="text-gray-600">Revenue</span><span className="font-medium text-green-700">${fmt(monthlyRevenue.grossFees)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Pass-through (rewards + credit)</span><span className="text-gray-500">-${fmt(monthlyRevenue.rewardsFunding + monthlyRevenue.creditReporting)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Net Revenue</span><span className="font-medium">${fmt(monthlyRevenue.operationsRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Expenses</span><span className="text-red-600">-${fmt(totalMonthlyExpenses)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Profit</span><span className={`font-bold ${monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>${fmt(monthlyProfit)}</span></div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Quarterly</h3>
              <div className="flex justify-between"><span className="text-gray-600">Revenue</span><span className="font-medium text-green-700">${fmt(monthlyRevenue.grossFees * 3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Expenses</span><span className="text-red-600">-${fmt(totalMonthlyExpenses * 3)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Profit</span><span className={`font-bold ${monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>${fmt(monthlyProfit * 3)}</span></div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Annual</h3>
              <div className="flex justify-between"><span className="text-gray-600">Revenue</span><span className="font-medium text-green-700">${fmt(annualRevenue.grossFees)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Expenses</span><span className="text-red-600">-${fmt(totalMonthlyExpenses * 12)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Profit</span><span className={`font-bold ${annualProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>${fmt(annualProfit)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Milestones</CardTitle>
          <CardDescription>Revenue at key resident counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[100, 500, 1000, 5000, 10000].map((count) => {
              const gross = count * PLATFORM_FEE * 12;
              const ops = count * OPERATIONS_FEE * 12;
              return (
                <div key={count} className={`p-4 rounded-lg border text-center ${residents === count ? 'border-green-500 bg-green-50' : ''}`}>
                  <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mb-2">residents</p>
                  <p className="text-sm font-semibold text-green-700">${(gross / 1000).toFixed(0)}K/yr gross</p>
                  <p className="text-xs text-gray-500">${(ops / 1000).toFixed(0)}K/yr ops</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
