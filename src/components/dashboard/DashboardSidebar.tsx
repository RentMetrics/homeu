"use client";

import { LayoutDashboard, History, Gift } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rental History", href: "/dashboard/history", icon: History },
  { name: "Rewards", href: "/dashboard/rewards", icon: Gift },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-56 min-h-screen bg-[#0a0e20] text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <div className="relative h-10 w-10 mr-2">
          <Image 
            src="/HomeU.svg" 
            alt="HomeU Logo"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-2xl font-bold">HomeU</span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-8">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-md transition-colors ${
                  isActive ? "bg-[#00bcd4] text-white" : "text-gray-300 hover:bg-[#1a2036] hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 