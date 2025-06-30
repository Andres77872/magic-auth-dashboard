import React, { useState, useCallback, useMemo } from 'react';
import type { User } from '@/types/auth.types';
import type { Role, UserRoleAssignment, PermissionConflict } from '@/types/rbac.types';
import type { ProjectDetails } from '@/types/project.types';

interface AssignmentWorkflowProps {
  projectHash: string;
  currentProject: ProjectDetails;
  users: User[];
  roles: Role[];
  selectedUsers: string[];
  selectedUser: string | null;
  onUserSelection: (userHashes: string[]) => void;
  onSingleUserSelection: (userHash: string | null) => void;
  assignmentHook: any; // Will be properly typed later
  effectivePermissionsHook: any; // Will be properly typed later
  loading: boolean;
}

type WorkflowStep = 'select-users' | 'select-roles' | 'review' | 'assign' | 'complete';

interface AssignmentPlan {
  user_hash: string;
  username: string;
  role_ids: number[];
  role_names: string[];
  reason?: string;
}

export default function AssignmentWorkflow({
  projectHash,
  currentProject,
  users,
  roles,
  selectedUsers,
  selectedUser,
  onUserSelection,
  onSingleUserSelection,
  assignmentHook,
  effectivePermissionsHook,
  loading
}: AssignmentWorkflowProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select-users');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [assignmentPlans, setAssignmentPlans] = useState<AssignmentPlan[]>([]);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [validationResults, setValidationResults] = useState<Map<string, any>>(new Map());
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState<any[]>([]);

  // Step definitions
  const steps: Array<{ id: WorkflowStep; title: string; description: string }> = [
    {
      id: 'select-users',
      title: 'Select Users',
      description: 'Choose users to assign roles to'
    },
    {
      id: 'select-roles',
      title: 'Select Roles',
      description: 'Choose roles to assign to selected users'
    },
    {
      id: 'review',
      title: 'Review & Validate',
      description: 'Review assignments and resolve any conflicts'
    },
    {
      id: 'assign',
      title: 'Execute Assignment',
      description: 'Perform the role assignments'
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Assignment completed successfully'
    }
  ];

  // Filter available users
  const availableUsers = useMemo(() => {
    return users.filter(user => 
      user.user_type !== 'root' && // Exclude root users from assignment
      user.user_hash // Ensure user has a hash
    );
  }, [users]);

  // Filter available roles
  const availableRoles = useMemo(() => {
    return roles.filter(role => role.is_active);
  }, [roles]);

  // Generate assignment plans when users and roles are selected
  const generateAssignmentPlans = useCallback(() => {
    const plans: AssignmentPlan[] = selectedUsers.map(userHash => {
      const user = availableUsers.find(u => u.user_hash === userHash);
      const roleNames = selectedRoles
        .map(roleId => availableRoles.find(r => r.id === roleId)?.group_name)
        .filter(Boolean) as string[];

      return {
        user_hash: userHash,
        username: user?.username || 'Unknown User',
        role_ids: selectedRoles,
        role_names: roleNames,
        reason: assignmentReason
      };
    });

    setAssignmentPlans(plans);
  }, [selectedUsers, selectedRoles, availableUsers, availableRoles, assignmentReason]);

  // Validate assignments for conflicts
  const validateAssignments = useCallback(async () => {
    const results = new Map();

    for (const plan of assignmentPlans) {
      try {
        const validation = await assignmentHook.validateAssignment(plan.user_hash, plan.role_ids);
        results.set(plan.user_hash, validation);
      } catch (error) {
        results.set(plan.user_hash, { 
          is_valid: false, 
          conflicts: [], 
          warnings: [`Validation failed: ${error}`],
          recommendations: []
        });
      }
    }

    setValidationResults(results);
  }, [assignmentPlans, assignmentHook]);

  // Execute assignments
  const executeAssignments = useCallback(async () => {
    setIsAssigning(true);
    const results: any[] = [];

    try {
      for (const plan of assignmentPlans) {
        try {
          for (const roleId of plan.role_ids) {
            const result = await assignmentHook.assignUserToRole(
              plan.user_hash, 
              roleId, 
              plan.reason
            );
            results.push({ 
              user_hash: plan.user_hash, 
              role_id: roleId, 
              success: true, 
              result 
            });
          }
        } catch (error) {
          results.push({ 
            user_hash: plan.user_hash, 
            role_ids: plan.role_ids, 
            success: false, 
            error: error instanceof Error ? error.message : 'Assignment failed'
          });
        }
      }

      setAssignmentResults(results);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Assignment execution failed:', error);
    } finally {
      setIsAssigning(false);
    }
  }, [assignmentPlans, assignmentHook]);

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id;
      
      if (nextStep === 'review') {
        generateAssignmentPlans();
      }
      
      setCurrentStep(nextStep);
    }
  }, [currentStep, steps, generateAssignmentPlans]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  }, [currentStep, steps]);

  const resetWorkflow = useCallback(() => {
    setCurrentStep('select-users');
    setSelectedRoles([]);
    setAssignmentPlans([]);
    setAssignmentReason('');
    setValidationResults(new Map());
    setAssignmentResults([]);
    onUserSelection([]);
  }, [onUserSelection]);

  // Check if current step can proceed
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'select-users':
        return selectedUsers.length > 0;
      case 'select-roles':
        return selectedRoles.length > 0;
      case 'review':
        return assignmentPlans.length > 0 && 
               Array.from(validationResults.values()).every(v => v.is_valid);
      case 'assign':
        return true;
      case 'complete':
        return false;
      default:
        return false;
    }
  }, [currentStep, selectedUsers, selectedRoles, assignmentPlans, validationResults]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-users':
        return (
          <div className="step-content">
            <h3>Select Users for Role Assignment</h3>
            <div className="user-selection">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="search-input"
                />
              </div>
              <div className="user-list">
                {availableUsers.map(user => (
                  <div
                    key={user.user_hash}
                    className={`user-item ${selectedUsers.includes(user.user_hash) ? 'selected' : ''}`}
                    onClick={() => {
                      const newSelection = selectedUsers.includes(user.user_hash)
                        ? selectedUsers.filter(h => h !== user.user_hash)
                        : [...selectedUsers, user.user_hash];
                      onUserSelection(newSelection);
                    }}
                  >
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                      <div className="user-type">{user.user_type}</div>
                    </div>
                    <div className="user-current-roles">
                      {assignmentHook.getAssignmentsByUser(user.user_hash).length} roles
                    </div>
                  </div>
                ))}
              </div>
              <div className="selection-summary">
                Selected: {selectedUsers.length} user(s)
              </div>
            </div>
          </div>
        );

      case 'select-roles':
        return (
          <div className="step-content">
            <h3>Select Roles to Assign</h3>
            <div className="role-selection">
              <div className="role-list">
                {availableRoles.map(role => (
                  <div
                    key={role.id}
                    className={`role-item ${selectedRoles.includes(role.id) ? 'selected' : ''}`}
                    onClick={() => {
                      const newSelection = selectedRoles.includes(role.id)
                        ? selectedRoles.filter(id => id !== role.id)
                        : [...selectedRoles, role.id];
                      setSelectedRoles(newSelection);
                    }}
                  >
                    <div className="role-info">
                      <div className="role-name">{role.group_name}</div>
                      <div className="role-description">{role.description}</div>
                      <div className="role-priority">Priority: {role.priority}</div>
                    </div>
                    <div className="role-permissions">
                      {role.permissions?.length || 0} permissions
                    </div>
                  </div>
                ))}
              </div>
              <div className="assignment-reason">
                <label htmlFor="reason">Assignment Reason (Optional):</label>
                <textarea
                  id="reason"
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="Provide a reason for this assignment..."
                  className="reason-input"
                />
              </div>
              <div className="selection-summary">
                Selected: {selectedRoles.length} role(s) for {selectedUsers.length} user(s)
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="step-content">
            <h3>Review Assignment Plan</h3>
            <div className="assignment-review">
              {assignmentPlans.map(plan => {
                const validation = validationResults.get(plan.user_hash);
                return (
                  <div key={plan.user_hash} className="assignment-plan">
                    <div className="plan-header">
                      <h4>{plan.username}</h4>
                      <div className={`validation-status ${validation?.is_valid ? 'valid' : 'invalid'}`}>
                        {validation?.is_valid ? '✅ Valid' : '❌ Conflicts'}
                      </div>
                    </div>
                    <div className="plan-details">
                      <div className="roles-to-assign">
                        <strong>Roles to assign:</strong> {plan.role_names.join(', ')}
                      </div>
                      {plan.reason && (
                        <div className="assignment-reason">
                          <strong>Reason:</strong> {plan.reason}
                        </div>
                      )}
                      {validation && !validation.is_valid && (
                        <div className="conflicts">
                          <strong>Conflicts:</strong>
                          <ul>
                            {validation.conflicts.map((conflict: PermissionConflict, index: number) => (
                              <li key={index} className={`conflict-${conflict.severity}`}>
                                {conflict.permission_name}: {conflict.resolution}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validation?.warnings?.length > 0 && (
                        <div className="warnings">
                          <strong>Warnings:</strong>
                          <ul>
                            {validation.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <button
                className="validate-btn"
                onClick={validateAssignments}
                disabled={loading}
              >
                🔍 Re-validate Assignments
              </button>
            </div>
          </div>
        );

      case 'assign':
        return (
          <div className="step-content">
            <h3>Execute Assignments</h3>
            <div className="assignment-execution">
              <div className="execution-summary">
                <p>Ready to assign {selectedRoles.length} role(s) to {selectedUsers.length} user(s)</p>
                <p>This action cannot be undone. Please confirm to proceed.</p>
              </div>
              <button
                className="execute-btn"
                onClick={executeAssignments}
                disabled={isAssigning}
              >
                {isAssigning ? '⏳ Assigning...' : '🚀 Execute Assignments'}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="step-content">
            <h3>Assignment Complete</h3>
            <div className="assignment-results">
              <div className="results-summary">
                <div className="success-count">
                  ✅ {assignmentResults.filter(r => r.success).length} successful assignments
                </div>
                <div className="error-count">
                  ❌ {assignmentResults.filter(r => !r.success).length} failed assignments
                </div>
              </div>
              <div className="results-details">
                {assignmentResults.map((result, index) => (
                  <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                    <div className="result-user">
                      User: {availableUsers.find(u => u.user_hash === result.user_hash)?.username}
                    </div>
                    <div className="result-details">
                      {result.success 
                        ? `✅ Role assigned successfully`
                        : `❌ ${result.error}`
                      }
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="reset-btn"
                onClick={resetWorkflow}
              >
                🔄 Start New Assignment
              </button>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="assignment-workflow">
      {/* Step Progress Indicator */}
      <div className="step-progress">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-indicator ${
              currentStep === step.id ? 'current' : 
              steps.findIndex(s => s.id === currentStep) > index ? 'completed' : 'pending'
            }`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="workflow-content">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="workflow-navigation">
        <button
          className="nav-btn secondary"
          onClick={goToPreviousStep}
          disabled={currentStep === 'select-users' || currentStep === 'complete'}
        >
          ← Previous
        </button>
        <button
          className="nav-btn primary"
          onClick={goToNextStep}
          disabled={!canProceed || currentStep === 'complete' || currentStep === 'assign'}
        >
          Next →
        </button>
      </div>
    </div>
  );
} 