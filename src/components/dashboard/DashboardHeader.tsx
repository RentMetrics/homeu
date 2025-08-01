"use client";

import { Bell, ShoppingBag, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Search Bar */}
        <div className="relative w-1/3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:border-gray-400"
          />
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ShoppingBag className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Bell className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
} 