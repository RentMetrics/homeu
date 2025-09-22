'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Home, 
  CreditCard, 
  Gift, 
  Settings,
  Menu,
  Search,
  Upload,
  UserCheck,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Application', href: '/dashboard/application', icon: FileText },
  { name: 'Properties', href: '/properties', icon: Home },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
  { name: 'Setup', href: '/setup', icon: UserCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface NavigationProps {
  children: React.ReactNode;
}

export function Navigation({ children }: NavigationProps) {
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
          'fixed inset-y-0 left-0 z-40 w-64 bg-black text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center justify-center border-b border-gray-800">
            <Link href="/dashboard" className="text-xl font-bold text-white flex items-center gap-2">
              <Image 
                src="/HomeU.svg" 
                alt="HomeU Logo" 
                width={32} 
                height={32} 
                className="text-white"
              />
              HomeU
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
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
                My Account
              </span>
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