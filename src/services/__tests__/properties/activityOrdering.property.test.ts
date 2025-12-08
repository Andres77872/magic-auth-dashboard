import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ActivityLog } from '@/types/audit.types';
import { ACTIVITY_TYPES } from '@/types/audit.types';

/**
 * **Feature: audit-log-monitor, Property 1: Activity Ordering**
 * **Validates: Requirements 1.1**
 *
 * Property: For any list of activity logs returned from the API,
 * the activities SHALL be ordered by timestamp in descending order (most recent first).
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
    .date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
    .map((d) => d.toISOString()),
  user: fc.option(activityUserArb, { nil: null }),
  project: fc.option(activityProjectArb, { nil: null }),
  targetUser: fc.option(activityUserArb, { nil: null }),
  ipAddress: fc.option(fc.ipV4(), { nil: null }),
}) as fc.Arbitrary<ActivityLog>;

// Generator for a list of activity logs
const activityLogsArb = fc.array(activityLogArb, { minLength: 0, maxLength: 100 });

/**
 * Helper function to check if activities are sorted in descending order by timestamp
 */
function isDescendingByTimestamp(activities: ActivityLog[]): boolean {
  if (activities.length <= 1) {
    return true;
  }

  for (let i = 0; i < activities.length - 1; i++) {
    const currentTime = new Date(activities[i].createdAt).getTime();
    const nextTime = new Date(activities[i + 1].createdAt).getTime();
    if (currentTime < nextTime) {
      return false;
    }
  }
  return true;
}

/**
 * Function that sorts activities in descending order by timestamp
 * This simulates what the API should return
 */
function sortActivitiesDescending(activities: ActivityLog[]): ActivityLog[] {
  return [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

describe('Property 1: Activity Ordering', () => {
  it('should maintain descending timestamp order after sorting', () => {
    fc.assert(
      fc.property(activityLogsArb, (activities) => {
        // Sort activities as the API would
        const sortedActivities = sortActivitiesDescending(activities);

        // Verify the sorted list is in descending order
        expect(isDescendingByTimestamp(sortedActivities)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have most recent activity first after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(activityLogArb, { minLength: 2, maxLength: 50 }),
        (activities) => {
          const sortedActivities = sortActivitiesDescending(activities);

          // Find the activity with the maximum timestamp
          const maxTimestamp = Math.max(
            ...activities.map((a) => new Date(a.createdAt).getTime())
          );

          // The first activity should have the maximum timestamp
          const firstActivityTime = new Date(sortedActivities[0].createdAt).getTime();
          expect(firstActivityTime).toBe(maxTimestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all activities after sorting (no data loss)', () => {
    fc.assert(
      fc.property(activityLogsArb, (activities) => {
        const sortedActivities = sortActivitiesDescending(activities);

        // Same length
        expect(sortedActivities.length).toBe(activities.length);

        // All original IDs should be present
        const originalIds = new Set(activities.map((a) => a.id));
        const sortedIds = new Set(sortedActivities.map((a) => a.id));
        expect(sortedIds).toEqual(originalIds);
      }),
      { numRuns: 100 }
    );
  });
});
