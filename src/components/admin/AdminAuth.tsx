'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminAuthProps {
  children: React.ReactNode;
}

// Define admin email addresses
const ADMIN_EMAILS = [
  'curtisholder91@gmail.com',
  'curtisholder@gmail.com',
  'curtis@homeu.co',
  'cholder@excelsaholding.com',
];

export function AdminAuth({ children }: AdminAuthProps) {
  const { user, isLoaded } = useUser();

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You must be signed in as an administrator to access this area.
            </p>
            <Link href="/sign-in">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is an admin
  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You don't have administrator privileges to access this area.
            </p>
            <p className="text-sm text-gray-500">
              Signed in as: {userEmail}
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and is an admin
  return <>{children}</>;
}