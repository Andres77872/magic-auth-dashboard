import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GroupForm } from '@/components/features/groups/GroupForm';
import { useGroups } from '@/hooks';
import { groupService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { GroupFormData, UserGroup } from '@/types/group.types';

export const GroupEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { groupHash } = useParams<{ groupHash: string }>();
  const { updateGroup } = useGroups();
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupHash) {
        setError('Group ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await groupService.getGroup(groupHash);
        if (response.success && response.user_group) {
          setGroup(response.user_group);
        } else {
          setError(response.message || 'Failed to fetch group');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [groupHash]);

  const handleSubmit = async (data: GroupFormData) => {
    if (!groupHash) return;

    setIsSubmitting(true);
    try {
      await updateGroup(groupHash, data);
      console.log('Group updated successfully');
      navigate(ROUTES.GROUPS);
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="group-edit-page">
        <div className="page-header mb-8">
          <h1>Edit Group</h1>
        </div>
        <div>Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-edit-page">
        <div className="page-header mb-8">
          <h1>Edit Group</h1>
        </div>
        <div className="danger-text">
          {error || 'Group not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="group-edit-page">
      <div className="page-header mb-8">
        <h1>Edit Group</h1>
        <p>Update the group information and settings.</p>
      </div>

      <GroupForm
        mode="edit"
        initialData={{
          group_name: group.group_name,
          description: group.description
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}; 