import React from 'react';
import { LoginForm } from '@/components/forms';
import { LogoIcon, SecurityIcon, UserIcon, ProjectIcon, HealthIcon } from '@/components/icons';

export function LoginPage(): React.JSX.Element {
  return (
    <div className="login-page">      
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding" role="banner" aria-label="Magic Auth Branding">
          <div className="brand-content">
            <div className="brand-logo">
              <LogoIcon size={64} className="logo-icon" aria-label="Magic Auth Logo" />
            </div>
            
            <header className="brand-header">
              <h1 className="brand-title">Magic Auth</h1>
              <h2 className="brand-subtitle">Admin Dashboard</h2>
            </header>
            
            <div className="brand-description">
              <p>
                Secure authentication management system for administrators and system operators.
              </p>
              
              <div className="feature-list" role="list" aria-label="Key Features">
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <UserIcon size="small" />
                  </div>
                  <span className="feature-text">3-Tier User Management</span>
                </div>
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <SecurityIcon size="small" />
                  </div>
                  <span className="feature-text">Role-Based Access Control</span>
                </div>
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <ProjectIcon size="small" />
                  </div>
                  <span className="feature-text">Project Management</span>
                </div>
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <HealthIcon size="small" />
                  </div>
                  <span className="feature-text">System Health Monitoring</span>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="brand-footer">
              <h3 className="user-types-title">Access Levels</h3>
              <div className="user-type-list" role="list" aria-label="Available Access Levels">
                <div className="user-type-item user-type-root" role="listitem">
                  <span className="login-user-badge badge-root" aria-label="Root Access Level">ROOT</span>
                  <span className="user-type-label">System Administrator</span>
                </div>
                <div className="user-type-item user-type-admin" role="listitem">
                  <span className="login-user-badge badge-admin" aria-label="Admin Access Level">ADMIN</span>
                  <span className="user-type-label">Project Manager</span>
                </div>
              </div>
          </footer>
        </div>

        {/* Right side - Login form */}
        <main className="login-form-section" role="main" aria-label="Login Form">
          <div className="form-container">
            <header className="form-header-section">
              <h2 className="form-main-title">Welcome Back</h2>
              <p className="form-main-subtitle">
                Sign in to access the Magic Auth Dashboard
              </p>
            </header>
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage; 