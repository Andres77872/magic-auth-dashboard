import React from 'react';
import type { JSX } from 'react';
import { useAuth, usePermissions, useUserType } from '@/hooks';

export function AuthTestComponent(): JSX.Element {
  const auth = useAuth();
  const permissions = usePermissions();
  const userType = useUserType();

  const handleLogin = async () => {
    // Note: This will fail without a running API server
    try {
      const success = await auth.login('test_admin', 'test_password');
      console.log('Login success:', success);
    } catch (error) {
      console.log('Login test failed (expected without API):', error);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    console.log('Logged out');
  };

  return (
    <div style={{
      padding: 'var(--spacing-6)',
      margin: 'var(--spacing-4)',
      backgroundColor: 'var(--color-gray-50)',
      border: '1px solid var(--color-gray-200)',
      borderRadius: 'var(--border-radius-lg)',
    }}>
      <h2 style={{ 
        color: 'var(--color-gray-800)', 
        marginBottom: 'var(--spacing-4)',
        fontSize: 'var(--font-size-xl)'
      }}>
        Authentication Test
      </h2>
      
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          Auth Status
        </h3>
        <div style={{ color: 'var(--color-gray-600)', lineHeight: 'var(--line-height-relaxed)' }}>
          <p><strong>Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Loading:</strong> {auth.isLoading ? 'Yes' : 'No'}</p>
          <p><strong>User Type:</strong> {userType.getUserTypeLabel()}</p>
          <p><strong>Username:</strong> {auth.user?.username || 'None'}</p>
          <p><strong>Email:</strong> {auth.user?.email || 'None'}</p>
          <p><strong>Error:</strong> {auth.state.error || 'None'}</p>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          Actions
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <button 
            onClick={handleLogin} 
            disabled={auth.isLoading}
            style={{
              padding: 'var(--spacing-2) var(--spacing-4)',
              backgroundColor: 'var(--color-primary-600)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              cursor: auth.isLoading ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)',
              opacity: auth.isLoading ? 0.6 : 1,
            }}
          >
            Test Login
          </button>
          <button 
            onClick={handleLogout} 
            disabled={auth.isLoading}
            style={{
              padding: 'var(--spacing-2) var(--spacing-4)',
              backgroundColor: 'var(--color-gray-600)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              cursor: auth.isLoading ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)',
              opacity: auth.isLoading ? 0.6 : 1,
            }}
          >
            Test Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          Permissions Test
        </h3>
        <div style={{ color: 'var(--color-gray-600)', lineHeight: 'var(--line-height-relaxed)' }}>
          <p><strong>Can Create User:</strong> {permissions.canCreateUser ? 'Yes' : 'No'}</p>
          <p><strong>Can Create Admin:</strong> {permissions.canCreateAdmin ? 'Yes' : 'No'}</p>
          <p><strong>Can Create Root:</strong> {permissions.canCreateRoot ? 'Yes' : 'No'}</p>
          <p><strong>Is Admin or Higher:</strong> {userType.isAdminOrHigher ? 'Yes' : 'No'}</p>
          <p><strong>Can View System Health:</strong> {permissions.canViewSystemHealth ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          User Type Checks
        </h3>
        <div style={{ color: 'var(--color-gray-600)', lineHeight: 'var(--line-height-relaxed)' }}>
          <p><strong>Is Root:</strong> {userType.isRoot ? 'Yes' : 'No'}</p>
          <p><strong>Is Admin:</strong> {userType.isAdmin ? 'Yes' : 'No'}</p>
          <p><strong>Is Consumer:</strong> {userType.isConsumer ? 'Yes' : 'No'}</p>
          <p><strong>Badge Color:</strong> 
            <span style={{ 
              color: userType.getUserTypeBadgeColor(),
              fontWeight: 'bold',
              marginLeft: 'var(--spacing-2)'
            }}>
              {userType.getUserTypeLabel()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthTestComponent; 