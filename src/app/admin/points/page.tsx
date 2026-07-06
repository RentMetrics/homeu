'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, Users, Award, DollarSign, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Doc } from '../../../../convex/_generated/dataModel';

export default function AdminPointsPage() {
  const [searchUserId, setSearchUserId] = useState('');

  // Get admin statistics
  const pointStats = useQuery(api.points.getPointStatistics, {});
  const topEarners: Doc<'userPoints'>[] | undefined = useQuery(api.points.getTopEarners, { limit: 10 });

  // Search for specific user
  const searchedUserPoints = useQuery(
    api.points.getUserPoints,
    searchUserId ? { userId: searchUserId } : 'skip'
  );
  const searchedUserTransactions: Doc<'pointTransactions'>[] | undefined = useQuery(
    api.points.getPointTransactions,
    searchUserId ? { userId: searchUserId, limit: 10 } : 'skip'
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500/20 text-purple-400';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400';
      case 'silver': return 'bg-muted text-foreground';
      default: return 'bg-orange-500/20 text-orange-400';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Points Administration</h1>
        <p className="text-muted-foreground">Manage and monitor the HomeU rewards program</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(pointStats?.totalUsers || 0)}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Users className="h-4 w-4 mr-1" />
              Active accounts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(pointStats?.totalPointsEarned || 0)}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              ${((pointStats?.totalPointsEarned || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} value
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Points Redeemed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(pointStats?.totalPointsRedeemed || 0)}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Award className="h-4 w-4 mr-1" />
              ${((pointStats?.totalPointsRedeemed || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} value
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Circulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(pointStats?.totalPointsInCirculation || 0)}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <DollarSign className="h-4 w-4 mr-1" />
              ${((pointStats?.totalPointsInCirculation || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} liability
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      {pointStats?.tierDistribution && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>User distribution across reward tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {pointStats.tierDistribution.bronze}
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 mt-2">Bronze</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {pointStats.tierDistribution.silver}
                </div>
                <Badge className="bg-muted text-foreground mt-2">Silver</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {pointStats.tierDistribution.gold}
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 mt-2">Gold</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {pointStats.tierDistribution.platinum}
                </div>
                <Badge className="bg-purple-500/20 text-purple-400 mt-2">Platinum</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Search */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Lookup</CardTitle>
          <CardDescription>Search for a user by their Clerk ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter user ID (e.g., user_2abc123xyz)"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setSearchUserId('')}>
              Clear
            </Button>
          </div>

          {searchedUserPoints && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="text-2xl font-bold">{searchedUserPoints.currentBalance}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Lifetime Earned</div>
                  <div className="text-2xl font-bold">{searchedUserPoints.totalEarned}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Lifetime Redeemed</div>
                  <div className="text-2xl font-bold">{searchedUserPoints.totalRedeemed}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tier</div>
                  <Badge className={getTierColor(searchedUserPoints.tier)}>
                    {searchedUserPoints.tier.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {searchedUserTransactions && searchedUserTransactions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchedUserTransactions.map((tx) => (
                        <TableRow key={tx._id}>
                          <TableCell>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.type === 'earn' ? 'default' : 'destructive'}>
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Earners
          </CardTitle>
          <CardDescription>Users with the highest point balances</CardDescription>
        </CardHeader>
        <CardContent>
          {!topEarners ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading leaderboard...</p>
            </div>
          ) : topEarners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users with points yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Lifetime Earned</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEarners.map((user, index) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-bold">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.userId.substring(0, 20)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatNumber(user.currentBalance)} pts
                    </TableCell>
                    <TableCell>
                      {formatNumber(user.totalEarned)} pts
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(user.tier)}>
                        {user.tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(user.streakCount ?? 0) > 0 && (
                        <span className="text-orange-600 font-medium">
                          🔥 {user.streakCount}
                        </span>
                      )}
                      {user.streakCount === 0 && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
