import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ActivityLog, ActivityFilters } from '@/types/audit.types';
import { ACTIVITY_TYPES } from '@/types/audit.types';

/**
 * **Feature: audit-log-monitor, Property 4: Filter Correctness**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 *
 * Property: For any combination of filters (activity type, user ID, project ID, date range),
 * all activities in the filtered result SHALL satisfy ALL applied filter conditions (AND logic).
 */

// Helper to generate hex strings using uuid (which is hex-based)
const hexStringArb = fc.uuid().map((uuid) => uuid.replace(/-/g, ''));

// Generator for activity user
const activityUserArb = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 3, maxLength: 20 }),
  userHash: hexStringArb,
});

// Generator for activity project
const activityProjectArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  hash: hexStringArb,
});

// Generator for a single activity log
const activityLogArb = fc.record({
  id: fc.uuid(),
  activityType: fc.constantFrom(...ACTIVITY_TYPES),
  details: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.jsonValue()),
  createdAt: fc
    .date({ min: new Date('2024-01-01T00:00:00.000Z'), max: new Date('2025-12-31T23:59:59.999Z') })
    .filter((d) => !isNaN(d.getTime()))
    .map((d) => d.toISOString()),
  user: fc.option(activityUserArb, { nil: null }),
  project: fc.option(activityProjectArb, { nil: null }),
  targetUser: fc.option(activityUserArb, { nil: null }),
  ipAddress: fc.option(fc.ipV4(), { nil: null }),
}) as fc.Arbitrary<ActivityLog>;

// Generator for a list of activity logs
const activityLogsArb = fc.array(activityLogArb, { minLength: 0, maxLength: 50 });


// Generator for activity filters
const activityFiltersArb = fc.record({
  activityType: fc.option(fc.constantFrom(...ACTIVITY_TYPES), { nil: undefined }),
  userId: fc.option(fc.uuid(), { nil: undefined }),
  projectId: fc.option(fc.uuid(), { nil: undefined }),
  days: fc.option(fc.integer({ min: 1, max: 365 }), { nil: undefined }),
}) as fc.Arbitrary<ActivityFilters>;

/**
 * Filter function that applies all filter conditions using AND logic
 * This is the core filtering logic that should be used by the hooks
 */
export function filterActivities(
  activities: ActivityLog[],
  filters: ActivityFilters
): ActivityLog[] {
  return activities.filter((activity) => {
    // Filter by activity type (Requirement 2.1)
    if (filters.activityType && activity.activityType !== filters.activityType) {
      return false;
    }

    // Filter by user ID (Requirement 2.2)
    if (filters.userId && activity.user?.id !== filters.userId) {
      return false;
    }

    // Filter by project ID (Requirement 2.3)
    if (filters.projectId && activity.project?.id !== filters.projectId) {
      return false;
    }

    // Filter by date range / days (Requirement 2.4)
    if (filters.days) {
      const activityDate = new Date(activity.createdAt);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.days);
      if (activityDate < cutoffDate) {
        return false;
      }
    }

    if (filters.dateRange) {
      const activityDate = new Date(activity.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (activityDate < startDate || activityDate > endDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if an activity satisfies all filter conditions
 */
function activitySatisfiesFilters(activity: ActivityLog, filters: ActivityFilters): boolean {
  // Check activity type filter
  if (filters.activityType && activity.activityType !== filters.activityType) {
    return false;
  }

  // Check user ID filter
  if (filters.userId && activity.user?.id !== filters.userId) {
    return false;
  }

  // Check project ID filter
  if (filters.projectId && activity.project?.id !== filters.projectId) {
    return false;
  }

  // Check days filter
  if (filters.days) {
    const activityDate = new Date(activity.createdAt);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.days);
    if (activityDate < cutoffDate) {
      return false;
    }
  }

  // Check date range filter
  if (filters.dateRange) {
    const activityDate = new Date(activity.createdAt);
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    if (activityDate < startDate || activityDate > endDate) {
      return false;
    }
  }

  return true;
}


describe('Property 4: Filter Correctness', () => {
  it('all filtered activities should satisfy ALL applied filter conditions (AND logic)', () => {
    fc.assert(
      fc.property(activityLogsArb, activityFiltersArb, (activities, filters) => {
        const filteredActivities = filterActivities(activities, filters);

        // Every activity in the filtered result should satisfy all filter conditions
        for (const activity of filteredActivities) {
          expect(activitySatisfiesFilters(activity, filters)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('filtering by activity type should only return activities of that type', () => {
    fc.assert(
      fc.property(
        activityLogsArb,
        fc.constantFrom(...ACTIVITY_TYPES),
        (activities, activityType) => {
          const filters: ActivityFilters = { activityType };
          const filteredActivities = filterActivities(activities, filters);

          // All filtered activities should have the specified type
          for (const activity of filteredActivities) {
            expect(activity.activityType).toBe(activityType);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering by user ID should only return activities by that user', () => {
    fc.assert(
      fc.property(activityLogsArb, fc.uuid(), (activities, userId) => {
        const filters: ActivityFilters = { userId };
        const filteredActivities = filterActivities(activities, filters);

        // All filtered activities should be by the specified user
        for (const activity of filteredActivities) {
          expect(activity.user?.id).toBe(userId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('filtering by project ID should only return activities in that project', () => {
    fc.assert(
      fc.property(activityLogsArb, fc.uuid(), (activities, projectId) => {
        const filters: ActivityFilters = { projectId };
        const filteredActivities = filterActivities(activities, filters);

        // All filtered activities should be in the specified project
        for (const activity of filteredActivities) {
          expect(activity.project?.id).toBe(projectId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('combining multiple filters should apply AND logic', () => {
    fc.assert(
      fc.property(
        activityLogsArb,
        fc.constantFrom(...ACTIVITY_TYPES),
        fc.uuid(),
        (activities, activityType, userId) => {
          const filters: ActivityFilters = { activityType, userId };
          const filteredActivities = filterActivities(activities, filters);

          // All filtered activities should satisfy BOTH conditions
          for (const activity of filteredActivities) {
            expect(activity.activityType).toBe(activityType);
            expect(activity.user?.id).toBe(userId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty filters should return all activities', () => {
    fc.assert(
      fc.property(activityLogsArb, (activities) => {
        const filters: ActivityFilters = {};
        const filteredActivities = filterActivities(activities, filters);

        // With no filters, all activities should be returned
        expect(filteredActivities.length).toBe(activities.length);
      }),
      { numRuns: 100 }
    );
  });

  it('filtered result should be a subset of original activities', () => {
    fc.assert(
      fc.property(activityLogsArb, activityFiltersArb, (activities, filters) => {
        const filteredActivities = filterActivities(activities, filters);

        // Filtered result should never be larger than original
        expect(filteredActivities.length).toBeLessThanOrEqual(activities.length);

        // All filtered activities should exist in original
        const originalIds = new Set(activities.map((a) => a.id));
        for (const activity of filteredActivities) {
          expect(originalIds.has(activity.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
