import { getAuthUserId } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type OrgPublicFields = {
    _id: string;
    name: string;
    slug: string;
    logoUrl: string;
    aiProvider: 'deepseek' | 'claude' | 'openai';
    aiModel: string;
    programEndDate: Date;
    status: 'active' | 'ended' | 'archived';
};

export type ActiveMembership = {
    _id: string;
    role: 'admin' | 'participant';
    organization: OrgPublicFields;
};

// ----------------------------------------------------------------
// getCurrentUserId
// ----------------------------------------------------------------

/**
 * Returns the current user's _id string from the NextAuth session,
 * or null if there is no active session.
 */
export async function getCurrentUserId(): Promise<string | null> {
    return getAuthUserId();
}

// ----------------------------------------------------------------
// getActiveMemberships
// ----------------------------------------------------------------

/**
 * Returns all active memberships for a user, with the organization populated.
 * Only includes memberships where both Membership.status and Organization.status
 * are "active".
 */
export async function getActiveMemberships(userId: string): Promise<ActiveMembership[]> {
    await connectDB();

    const memberships = await Membership.find({ userId, status: 'active' }).populate({
        path: 'organizationId',
        model: Organization,
        match: { status: 'active' },
        select: 'name slug logoUrl aiProvider aiModel programEndDate status',
    });

    // populate with match: returns null for non-matching docs — filter those out
    return memberships
        .filter(m => m.organizationId != null)
        .map(m => {
            const org = m.organizationId as unknown as InstanceType<typeof Organization>;
            return {
                _id: m._id.toString(),
                role: m.role,
                organization: {
                    _id: (org._id as object).toString(),
                    name: org.name,
                    slug: org.slug,
                    logoUrl: org.logoUrl,
                    aiProvider: org.aiProvider,
                    aiModel: org.aiModel,
                    programEndDate: org.programEndDate,
                    status: org.status,
                },
            };
        });
}

// ----------------------------------------------------------------
// requireActiveMembership
// ----------------------------------------------------------------

/**
 * Verifies the user has an active membership in the given organization (by slug).
 * Returns the membership if found, null if not.
 * Does NOT throw — callers decide what to do with null (typically 403).
 */
export async function requireActiveMembership(
    userId: string,
    organizationSlug: string
): Promise<{ membership: ActiveMembership } | null> {
    const memberships = await getActiveMemberships(userId);
    const found = memberships.find(m => m.organization.slug === organizationSlug);
    return found ? { membership: found } : null;
}

// ----------------------------------------------------------------
// requireMembership
// ----------------------------------------------------------------

/**
 * Verifies the user has an active membership via their NextAuth session.
 * Throws an error if not authenticated or not authorized.
 */
export async function requireMembership(
    organizationSlug: string,
    session: any
): Promise<ActiveMembership> {
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error('UNAUTHORIZED');
    }
    
    const result = await requireActiveMembership(userId, organizationSlug);
    if (!result) {
        throw new Error('FORBIDDEN');
    }
    
    return result.membership;
}
