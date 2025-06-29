import React from 'react';
import { LoginForm } from '@/components/forms';

export function LoginPage(): React.JSX.Element {
  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="logo-icon"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15.5c-.5-1-1.5-2-3-2s-2.5 1-3 2"/>
                <path d="M9 17l3-3 3 3"/>
              </svg>
            </div>
            
            <h1 className="brand-title">Magic Auth</h1>
            <h2 className="brand-subtitle">Admin Dashboard</h2>
            
            <div className="brand-description">
              <p>
                Secure authentication management system for administrators and system operators.
              </p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>3-Tier User Management</span>
                </div>
                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Role-Based Access Control</span>
                </div>
                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>Project Management</span>
                </div>
                <div className="feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span>System Health Monitoring</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="brand-footer">
            <div className="user-types">
              <h3>Access Levels</h3>
              <div className="user-type-list">
                <div className="user-type-item root">
                  <span className="user-type-badge">ROOT</span>
                  <span className="user-type-label">System Administrator</span>
                </div>
                <div className="user-type-item admin">
                  <span className="user-type-badge">ADMIN</span>
                  <span className="user-type-label">Project Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="login-form-section">
          <div className="form-container">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 