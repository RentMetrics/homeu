'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  Upload,
  Settings,
  Menu,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Properties', href: '/admin/properties', icon: Building2 },
  { name: 'Property Managers', href: '/admin/property-managers', icon: UserCheck },
  { name: 'Bulk Upload', href: '/admin/bulk-upload', icon: Upload },
  { name: 'Data Management', href: '/admin/data', icon: FileSpreadsheet },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminNavigationProps {
  children: React.ReactNode;
}

export function AdminNavigation({ children }: AdminNavigationProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center justify-center border-b border-gray-800">
            <Link href="/admin" className="text-xl font-bold text-white flex items-center gap-2">
              <Image
                src="/HomeU.svg"
                alt="HomeU Logo"
                width={32}
                height={32}
                className="text-white"
              />
              <span>HomeU Admin</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    pathname === item.href
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      pathname === item.href
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-white'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/" />
              <span className="ml-3 text-sm font-medium text-gray-300">
                Admin Account
              </span>
            </div>
            <div className="mt-2">
              <Link
                href="/dashboard"
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                ← Back to User Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        'lg:pl-64 transition-all duration-200 ease-in-out',
        isSidebarOpen ? 'pl-64' : 'pl-0'
      )}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}