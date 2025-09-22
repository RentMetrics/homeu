'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import WorkOSService from '@/lib/workos';

export default function WorkOSCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      setStatus('error');
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setStatus('error');
      return;
    }

    if (state !== 'property-manager-login') {
      setError('Invalid state parameter');
      setStatus('error');
      return;
    }

    handleAuthentication(code);
  }, [searchParams]);

  const handleAuthentication = async (code: string) => {
    try {
      const result = await fetch('/api/auth/workos/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data.user);
      setOrganization(data.organization);
      setStatus('success');

      // Redirect to property manager dashboard after a short delay
      setTimeout(() => {
        window.location.href = `/property-manager/dashboard?org=${data.organization?.id}`;
      }, 2000);

    } catch (error) {
      console.error('Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <h2 className="text-xl font-semibold">Authenticating...</h2>
            <p className="text-gray-600">Please wait while we verify your credentials</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
            <h2 className="text-xl font-semibold text-green-900">Authentication Successful!</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
              {organization && (
                <p className="text-sm text-gray-500">
                  Organization: {organization.name}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Authentication Failed</h2>
            <p className="text-gray-600">{error}</p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.href = '/property-manager/login'}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Return Home
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">WorkOS Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}