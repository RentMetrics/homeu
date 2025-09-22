'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Users, ShieldCheck, ArrowRight } from 'lucide-react';
// import WorkOSService from '@/lib/workos';

export default function PropertyManagerLogin() {
  const [organizationId, setOrganizationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleWorkOSLogin = () => {
    setIsLoading(true);
    // Mock WorkOS integration for now
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/auth/workos/callback`,
      response_type: 'code',
      state: 'property-manager-login',
      ...(organizationId && { organization_id: organizationId })
    });
    const authUrl = `https://api.workos.com/sso/authorize?${params.toString()}`;
    window.location.href = authUrl;
  };

  const handleCreateOrganization = () => {
    // Redirect to organization creation flow
    window.location.href = '/property-manager/signup';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Property Manager Portal</h1>
          <p className="text-gray-600">
            Access your property management dashboard powered by WorkOS
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to Your Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Organization ID Input */}
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID (Optional)</Label>
              <Input
                id="organizationId"
                placeholder="Enter your organization ID"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave blank to see all available organizations
              </p>
            </div>

            {/* WorkOS Login Button */}
            <Button
              onClick={handleWorkOSLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                "Redirecting..."
              ) : (
                <>
                  Sign In with WorkOS
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Create Organization Button */}
            <Button
              onClick={handleCreateOrganization}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create New Organization
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium">Team Management</h3>
              <p className="text-sm text-gray-600">Invite and manage property managers</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium">Secure Access</h3>
              <p className="text-sm text-gray-600">Enterprise-grade authentication via WorkOS</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            New to HomeU?{' '}
            <button
              onClick={handleCreateOrganization}
              className="text-blue-600 hover:underline"
            >
              Create your organization
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}