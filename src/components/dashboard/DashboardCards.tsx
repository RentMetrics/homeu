import { TrendingUp, CreditCard, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Credit Score Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Credit Score</h3>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">720</div>
          <p className="text-xs text-muted-foreground">
            +15 points this month
          </p>
          <Button variant="link" className="px-0 mt-2">
            View Details
          </Button>
        </div>
      </div>

      {/* Next Payment Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Next Payment</h3>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">$1,200</div>
          <p className="text-xs text-muted-foreground">
            Due in 5 days
          </p>
          <Button variant="link" className="px-0 mt-2">
            Pay Now
          </Button>
        </div>
      </div>

      {/* Rewards Points Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Rewards Points</h3>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">2,500</div>
          <p className="text-xs text-muted-foreground">
            +100 points this month
          </p>
          <Button variant="link" className="px-0 mt-2">
            View Rewards
          </Button>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Recent Activity</h3>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Rent Payment</span>
              <span className="text-muted-foreground"> - 2 days ago</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Credit Score Update</span>
              <span className="text-muted-foreground"> - 5 days ago</span>
            </div>
          </div>
          <Button variant="link" className="px-0 mt-2">
            View All
          </Button>
        </div>
      </div>
    </div>
  );
} 