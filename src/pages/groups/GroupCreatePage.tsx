import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupForm } from '@/components/features/groups/GroupForm';
import { useGroups } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { GroupFormData } from '@/types/group.types';

export const GroupCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { createGroup } = useGroups();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: GroupFormData) => {
    setIsSubmitting(true);
    try {
      await createGroup(data);
      // Show success message
      console.log('Group created successfully');
      navigate(ROUTES.GROUPS);
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group-create-page">
      <div className="page-header mb-8">
        <h1>Create New Group</h1>
        <p>Create a new user group to organize and manage user permissions.</p>
      </div>

      <GroupForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}; 