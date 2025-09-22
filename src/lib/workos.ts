import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export interface PropertyManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'viewer';
  properties: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface PropertyManagerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: 'admin' | 'manager' | 'viewer';
  invitedBy: string;
}

export interface RenterApplication {
  id: string;
  renterId: string;
  propertyId: string;
  propertyManagerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  documentsHash: string; // IPFS hash of application documents
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export class WorkOSService {
  /**
   * Create a new organization for a property management company
   */
  static async createOrganization(
    companyName: string,
    adminEmail: string,
    adminName: string
  ): Promise<{ organizationId: string; inviteUrl: string }> {
    try {
      // Create organization
      const organization = await workos.organizations.createOrganization({
        name: companyName,
        domains: [], // Can add company domains if needed
      });

      // Create admin user invitation
      const invitation = await workos.userManagement.createInvitation({
        email: adminEmail,
        organizationId: organization.id,
        inviterUserId: 'system', // System-generated invitation
        roleSlug: 'admin',
      });

      return {
        organizationId: organization.id,
        inviteUrl: invitation.acceptUrl || ''
      };
    } catch (error) {
      console.error('WorkOS organization creation error:', error);
      throw new Error('Failed to create property management organization');
    }
  }

  /**
   * Invite a property manager to an organization
   */
  static async invitePropertyManager(
    invitation: PropertyManagerInvitation,
    organizationId: string
  ): Promise<string> {
    try {
      const workosInvitation = await workos.userManagement.createInvitation({
        email: invitation.email,
        organizationId: organizationId,
        inviterUserId: invitation.invitedBy,
        roleSlug: invitation.role,
      });

      return workosInvitation.acceptUrl || '';
    } catch (error) {
      console.error('WorkOS invitation error:', error);
      throw new Error('Failed to invite property manager');
    }
  }

  /**
   * Authenticate property manager login
   */
  static async authenticateUser(code: string): Promise<{
    user: any;
    organization: any;
    accessToken: string;
  }> {
    try {
      const { user, organization, accessToken } = await workos.userManagement.authenticateWithCode({
        code,
        clientId: process.env.WORKOS_CLIENT_ID!,
      });

      return { user, organization, accessToken };
    } catch (error) {
      console.error('WorkOS authentication error:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  /**
   * Get property manager profile
   */
  static async getPropertyManager(userId: string): Promise<PropertyManager | null> {
    try {
      const user = await workos.userManagement.getUser(userId);

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.organizationId || '',
        organizationId: user.organizationId || '',
        role: this.mapWorkOSRole(user.role || 'viewer'),
        properties: [], // Will be populated from Convex
        createdAt: user.createdAt,
        lastLogin: user.updatedAt
      };
    } catch (error) {
      console.error('WorkOS get user error:', error);
      return null;
    }
  }

  /**
   * Create authorization URL for property manager login
   */
  static getAuthorizationUrl(organizationId?: string): string {
    const params = new URLSearchParams({
      client_id: process.env.WORKOS_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/workos/callback`,
      response_type: 'code',
      state: 'property-manager-login',
      ...(organizationId && { organization_id: organizationId })
    });

    return `https://api.workos.com/sso/authorize?${params.toString()}`;
  }

  /**
   * List organization members
   */
  static async getOrganizationMembers(organizationId: string): Promise<PropertyManager[]> {
    try {
      const response = await workos.userManagement.listUsers({
        organizationId: organizationId,
        limit: 100
      });

      return response.data.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: organizationId,
        organizationId: organizationId,
        role: this.mapWorkOSRole(user.role || 'viewer'),
        properties: [],
        createdAt: user.createdAt,
        lastLogin: user.updatedAt
      }));
    } catch (error) {
      console.error('WorkOS list users error:', error);
      return [];
    }
  }

  /**
   * Update property manager role
   */
  static async updatePropertyManagerRole(
    userId: string,
    organizationId: string,
    role: 'admin' | 'manager' | 'viewer'
  ): Promise<void> {
    try {
      await workos.userManagement.updateUser({
        userId: userId,
        role: role
      });
    } catch (error) {
      console.error('WorkOS update role error:', error);
      throw new Error('Failed to update property manager role');
    }
  }

  /**
   * Remove property manager from organization
   */
  static async removePropertyManager(userId: string): Promise<void> {
    try {
      await workos.userManagement.deleteUser(userId);
    } catch (error) {
      console.error('WorkOS delete user error:', error);
      throw new Error('Failed to remove property manager');
    }
  }

  /**
   * Map WorkOS roles to application roles
   */
  private static mapWorkOSRole(workosRole: string): 'admin' | 'manager' | 'viewer' {
    switch (workosRole.toLowerCase()) {
      case 'admin':
        return 'admin';
      case 'manager':
        return 'manager';
      default:
        return 'viewer';
    }
  }

  /**
   * Generate organization dashboard URL
   */
  static getDashboardUrl(organizationId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL}/property-manager/dashboard?org=${organizationId}`;
  }

  /**
   * Validate WorkOS webhook
   */
  static validateWebhook(payload: string, signature: string): boolean {
    try {
      return workos.webhooks.verifyEvent({
        payload,
        sigHeader: signature,
        secret: process.env.WORKOS_WEBHOOK_SECRET!
      });
    } catch (error) {
      console.error('WorkOS webhook validation error:', error);
      return false;
    }
  }
}

export default WorkOSService;