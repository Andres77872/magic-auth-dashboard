import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';

export function RouteProtectionTest(): React.JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { userType, getUserTypeLabel } = useUserType();

  const testRoutes = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard (Admin+)', description: 'Requires ADMIN or ROOT access' },
    { path: ROUTES.SYSTEM, label: 'System (ROOT only)', description: 'Requires ROOT access only' },
    { path: ROUTES.UNAUTHORIZED, label: 'Unauthorized Page', description: 'Access denied page' },
    { path: '/non-existent', label: 'Non-existent Route', description: 'Should show 404 page' },
  ];

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
        🛡️ Route Protection Test
      </h2>
      
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          Current Authentication Status
        </h3>
        <div style={{ 
          backgroundColor: isAuthenticated ? 'var(--color-success-light)' : 'var(--color-warning-light)',
          padding: 'var(--spacing-3)',
          borderRadius: 'var(--border-radius-md)',
          color: 'var(--color-gray-700)',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p><strong>User Type:</strong> {getUserTypeLabel()}</p>
          {userType && <p><strong>Raw Type:</strong> {userType}</p>}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          Route Protection Tests
        </h3>
        <p style={{ 
          color: 'var(--color-gray-600)', 
          marginBottom: 'var(--spacing-4)',
          fontSize: 'var(--font-size-sm)'
        }}>
          Click the buttons below to test route protection. Unauthenticated users should be redirected to login.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gap: 'var(--spacing-3)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
        }}>
          {testRoutes.map(({ path, label, description }) => (
            <div 
              key={path}
              style={{
                border: '1px solid var(--color-gray-300)',
                borderRadius: 'var(--border-radius-md)',
                padding: 'var(--spacing-4)',
                backgroundColor: 'white'
              }}
            >
              <button
                onClick={() => navigate(path)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-2)'
                }}
              >
                Test {label}
              </button>
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-gray-500)',
                margin: 0,
                lineHeight: 'var(--line-height-normal)'
              }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h3 style={{ 
          color: 'var(--color-gray-700)', 
          marginBottom: 'var(--spacing-3)',
          fontSize: 'var(--font-size-lg)'
        }}>
          Authentication Actions
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <button 
              onClick={logout} 
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--color-gray-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Logout (Test Unauthenticated Routes)
            </button>
          ) : (
            <button 
              onClick={() => navigate(ROUTES.LOGIN)}
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Go to Login
            </button>
          )}
        </div>
      </div>

      <div style={{ 
        fontSize: 'var(--font-size-xs)', 
        color: 'var(--color-gray-500)',
        borderTop: '1px solid var(--color-gray-200)',
        paddingTop: 'var(--spacing-4)'
      }}>
        <p><strong>Expected Behavior:</strong></p>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)' }}>
          <li>Unauthenticated users should be redirected to login for protected routes</li>
          <li>ADMIN users can access Dashboard but not System</li>
          <li>ROOT users can access all routes</li>
          <li>CONSUMER users cannot access any dashboard routes</li>
        </ul>
      </div>
    </div>
  );
}

export default RouteProtectionTest; 