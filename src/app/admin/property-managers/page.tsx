'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  CreditCard,
  Calendar,
  Plus,
  Link2,
  DollarSign,
  Home,
  X,
  Loader2,
  Copy,
  Send,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PropertyManagersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPM, setExpandedPM] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPM, setNewPM] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    role: 'admin',
    propertyIds: [] as string[],
  });
  const [propertyInput, setPropertyInput] = useState('');

  const [isGeneratingToken, setIsGeneratingToken] = useState<string | null>(null);

  const propertyManagers = useQuery(api.propertyManagers.getAllPropertyManagers, { limit: 100 });
  const searchResults = useQuery(
    api.multifamilyproperties.searchProperties,
    propertyInput.length >= 2 ? { searchQuery: propertyInput, limit: 20 } : "skip"
  );

  const createPropertyManager = useMutation(api.propertyManagers.adminCreatePropertyManager);
  const deactivatePM = useMutation(api.propertyManagers.adminDeactivatePropertyManager);
  const reactivatePM = useMutation(api.propertyManagers.adminReactivatePropertyManager);
  const generateToken = useMutation(api.propertyManagers.generateOnboardingToken);

  // Filter property managers based on search term
  const filteredPMs = propertyManagers?.filter((pm) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pm.firstName?.toLowerCase().includes(searchLower) ||
      pm.lastName?.toLowerCase().includes(searchLower) ||
      pm.email?.toLowerCase().includes(searchLower) ||
      pm.companyName?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const totalPMs = propertyManagers?.length || 0;
  const activePMs = propertyManagers?.filter(pm => pm.isActive).length || 0;
  const onboardedPMs = propertyManagers?.filter(pm => pm.paymentOnboardingComplete).length || 0;
  const totalActiveRenters = propertyManagers?.reduce((sum, pm) => sum + (pm.activeRenterCount || 0), 0) || 0;
  const totalConnectedProperties = propertyManagers?.reduce((sum, pm) => sum + (pm.connectedPropertyCount || 0), 0) || 0;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleAddProperty = (propId?: string) => {
    const idToAdd = propId || propertyInput.trim();
    if (idToAdd && !newPM.propertyIds.includes(idToAdd)) {
      setNewPM(prev => ({
        ...prev,
        propertyIds: [...prev.propertyIds, idToAdd],
      }));
      setPropertyInput('');
    }
  };

  const handleRemoveProperty = (propId: string) => {
    setNewPM(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.filter(id => id !== propId),
    }));
  };

  const handleCreatePM = async () => {
    if (!newPM.firstName || !newPM.lastName || !newPM.email || !newPM.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createPropertyManager({
        firstName: newPM.firstName,
        lastName: newPM.lastName,
        email: newPM.email,
        companyName: newPM.companyName,
        role: newPM.role,
        propertyIds: newPM.propertyIds,
      });
      toast.success('Property manager created successfully');
      setShowAddForm(false);
      setNewPM({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        role: 'admin',
        propertyIds: [],
      });
    } catch (error) {
      toast.error('Failed to create property manager');
      console.error(error);
    }
  };

  const handleDeactivate = async (pmId: any) => {
    try {
      await deactivatePM({ pmId });
      toast.success('Property manager deactivated');
    } catch (error) {
      toast.error('Failed to deactivate property manager');
    }
  };

  const handleReactivate = async (pmId: any) => {
    try {
      await reactivatePM({ pmId });
      toast.success('Property manager reactivated');
    } catch (error) {
      toast.error('Failed to reactivate property manager');
    }
  };

  const handleSendOnboardingLink = async (pmId: any) => {
    setIsGeneratingToken(pmId);
    try {
      const { token } = await generateToken({ pmId });
      const url = `${window.location.origin}/pm-onboarding/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Onboarding link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to generate onboarding link');
      console.error(error);
    } finally {
      setIsGeneratingToken(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Property Managers</h1>
          <p className="text-muted-foreground mt-2">
            Manage property management companies and their representatives
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Property Manager
        </Button>
      </div>

      {/* Add Property Manager Form */}
      {showAddForm && (
        <Card className="border-2 border-blue-500/30 bg-blue-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Property Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newPM.firstName}
                  onChange={(e) => setNewPM(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newPM.lastName}
                  onChange={(e) => setNewPM(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Smith"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPM.email}
                  onChange={(e) => setNewPM(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@propertyco.com"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={newPM.companyName}
                  onChange={(e) => setNewPM(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Property Management Co."
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newPM.role}
                  onChange={(e) => setNewPM(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <Label>Properties Managed</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={propertyInput}
                      onChange={(e) => setPropertyInput(e.target.value)}
                      placeholder="Search by property name or address..."
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProperty(); } }}
                    />
                    {searchResults && searchResults.length > 0 && propertyInput.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((prop: any) => (
                          <div
                            key={prop.propertyId}
                            className="px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm"
                            onClick={() => {
                              handleAddProperty(prop.propertyId);
                            }}
                          >
                            <div className="font-medium">{prop.propertyId}</div>
                            <div className="text-xs text-muted-foreground">{prop.propertyName} - {prop.city}, {prop.state}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="button" onClick={handleAddProperty} variant="outline">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Type at least 2 characters to search properties</p>
                {newPM.propertyIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPM.propertyIds.map(propId => (
                      <Badge key={propId} variant="secondary" className="flex items-center gap-1">
                        {propId}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveProperty(propId)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreatePM}>
                Create Property Manager
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PMs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPMs}</div>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PMs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePMs}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Ready</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardedPMs}</div>
            <p className="text-xs text-muted-foreground">Onboarded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Properties</CardTitle>
            <Link2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConnectedProperties}</div>
            <p className="text-xs text-muted-foreground">Receiving rent via HomeU</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveRenters}</div>
            <p className="text-xs text-muted-foreground">Paying through HomeU</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Property Manager Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Property Managers List */}
          <div className="space-y-4">
            {filteredPMs === undefined ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredPMs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No property managers match your search' : 'No property managers found. Click "Add Property Manager" to create one.'}
              </div>
            ) : (
              filteredPMs.map((pm) => (
                <div key={pm._id} className="border rounded-lg overflow-hidden">
                  {/* Main Row */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedPM(expandedPM === pm._id ? null : pm._id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {pm.firstName?.[0]}{pm.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{pm.firstName} {pm.lastName}</h3>
                          <Badge variant={getRoleBadgeVariant(pm.role)}>
                            {pm.role}
                          </Badge>
                          {!pm.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{pm.companyName}</p>
                        <p className="text-sm text-muted-foreground">{pm.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {pm.totalPropertyCount || 0} Properties
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="text-green-600">{pm.connectedPropertyCount || 0} connected</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{pm.activeRenterCount || 0} Residents</div>
                        <div className="text-sm text-muted-foreground">paying via HomeU</div>
                      </div>
                      <div className="text-right">
                        {pm.paymentOnboardingComplete ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Onboarded
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Onboarded
                          </Badge>
                        )}
                      </div>
                      {expandedPM === pm._id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedPM === pm._id && (
                    <div className="border-t bg-muted p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Contact Info */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Contact Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${pm.email}`} className="text-blue-600 hover:underline">
                                {pm.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Last Login: {formatDate(pm.lastLogin)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Joined: {formatDate(pm.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Organization */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Organization</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Company:</strong> {pm.organization?.companyName || pm.companyName}</div>
                            <div><strong>Admin Email:</strong> {pm.organization?.adminEmail || pm.email}</div>
                            <div>
                              <strong>Status:</strong>{' '}
                              {pm.isActive ? (
                                <Badge variant="default" className="bg-green-500/20 text-green-400">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Settings */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Payment Settings</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Payout Schedule:</strong>{' '}
                              {pm.payoutSchedule || 'Not Set'}
                            </div>
                            <div>
                              <strong>Payout Method:</strong>{' '}
                              {pm.defaultPayoutMethod?.toUpperCase() || 'Not Set'}
                            </div>
                            <div>
                              <strong>Straddle ID:</strong>{' '}
                              {pm.straddleCustomerId ? (
                                <span className="font-mono text-xs">{pm.straddleCustomerId.slice(0, 12)}...</span>
                              ) : (
                                'Not Connected'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Managed Properties with Connection Status */}
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Managed Properties ({pm.propertyDetails?.length || 0})
                        </h4>
                        {pm.propertyDetails && pm.propertyDetails.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pm.propertyDetails.map((property: any, index: number) => (
                              <div
                                key={index}
                                className={`bg-card border rounded-lg p-3 ${
                                  property?.isConnectedToHomeU
                                    ? 'border-green-500/30 bg-green-500/10'
                                    : 'border-border'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{property?.propertyName}</div>
                                    <div className="text-xs text-muted-foreground">{property?.address}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {property?.city}, {property?.state} {property?.zipCode}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {property?.totalUnits} units
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    {property?.isConnectedToHomeU ? (
                                      <Badge variant="default" className="bg-green-500/20 text-green-400 text-xs">
                                        <Link2 className="h-3 w-3 mr-1" />
                                        Connected
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-muted-foreground">
                                        Not Connected
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {property?.isConnectedToHomeU && (
                                  <div className="mt-2 pt-2 border-t border-green-500/30">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-green-400">
                                        {property?.activeResidents} active residents
                                      </span>
                                      <span className="text-green-400 font-medium">
                                        ${property?.totalMonthlyRent?.toLocaleString()}/mo
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No properties assigned</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t flex-wrap">
                        {!pm.paymentOnboardingComplete && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-500 border-blue-500/30"
                            disabled={isGeneratingToken === pm._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendOnboardingLink(pm._id);
                            }}
                          >
                            {isGeneratingToken === pm._id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            Send Onboarding Link
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Edit Properties
                        </Button>
                        <Button size="sm" variant="outline">
                          View Residents
                        </Button>
                        {pm.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivate(pm._id);
                            }}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReactivate(pm._id);
                            }}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
