import React from 'react';
import { LoginForm } from '@/components/forms';
import { LogoIcon, SecurityIcon, UserIcon, ProjectIcon, HealthIcon } from '@/components/icons';

export function LoginPage(): React.JSX.Element {
  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <LogoIcon size={64} className="logo-icon" />
            </div>
            
            <div className="brand-header">
              <h1 className="brand-title">Magic Auth</h1>
              <h2 className="brand-subtitle">Admin Dashboard</h2>
            </div>
            
            <div className="brand-description">
              <p>
                Secure authentication management system for administrators and system operators.
              </p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <div className="feature-icon">
                    <UserIcon size="small" />
                  </div>
                  <span className="feature-text">3-Tier User Management</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <SecurityIcon size="small" />
                  </div>
                  <span className="feature-text">Role-Based Access Control</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <ProjectIcon size="small" />
                  </div>
                  <span className="feature-text">Project Management</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <HealthIcon size="small" />
                  </div>
                  <span className="feature-text">System Health Monitoring</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="brand-footer">
              <h3 className="user-types-title">Access Levels</h3>
              <div className="user-type-list">
                <div className="user-type-item user-type-root">
                  <span className="login-user-badge badge-root">ROOT</span>
                  <span className="user-type-label">System Administrator</span>
                </div>
                <div className="user-type-item user-type-admin">
                  <span className="login-user-badge badge-admin">ADMIN</span>
                  <span className="user-type-label">Project Manager</span>
                </div>
              </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="login-form-section">
          <div className="form-container">
            <div className="form-header-section">
              <h2 className="form-main-title">Welcome Back</h2>
              <p className="form-main-subtitle">
                Sign in to access the Magic Auth Dashboard
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 