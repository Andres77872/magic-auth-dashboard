import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/routes';
import { RouteProtectionTest } from '@/components/RouteProtectionTest';

export function LoginPage(): React.JSX.Element {
  return (
    <div className="login-page" style={{ padding: 'var(--spacing-4)' }}>
      <div className="container">
        <div style={{ 
          textAlign: 'center',
          marginBottom: 'var(--spacing-8)',
          padding: 'var(--spacing-8)',
          backgroundColor: 'white',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h1 style={{ 
            color: 'var(--color-primary-600)',
            marginBottom: 'var(--spacing-4)' 
          }}>
            Magic Auth Dashboard
          </h1>
          <p style={{ color: 'var(--color-gray-600)' }}>
            This is a placeholder for the login page implementation.
          </p>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Login functionality will be implemented in <strong>Milestone 2.3: Login Page Implementation</strong>
          </p>
          
          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <Link 
              to={ROUTES.DASHBOARD} 
              className="btn btn-primary"
              style={{
                display: 'inline-block',
                padding: 'var(--spacing-3) var(--spacing-6)',
                backgroundColor: 'var(--color-primary-600)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 'var(--border-radius-md)',
                transition: 'background-color var(--transition-fast)'
              }}
            >
              Go to Dashboard (For Testing Route Protection)
            </Link>
          </div>
        </div>

        {/* Route Protection Test Component */}
        <RouteProtectionTest />
      </div>
    </div>
  );
}

export default LoginPage; 