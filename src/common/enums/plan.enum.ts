/**
 * Subscription plan tiers for a Tenant (housing society operator).
 * Controls feature access and capacity limits.
 */
export enum Plan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

/**
 * Maximum number of societies allowed per plan.
 */
export const PLAN_MAX_SOCIETIES: Record<Plan, number> = {
  [Plan.FREE]: 1,
  [Plan.BASIC]: 3,
  [Plan.PREMIUM]: 10,
  [Plan.ENTERPRISE]: 999,
};
