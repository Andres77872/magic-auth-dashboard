import React from 'react';
import { LoginForm } from '@/components/forms';
import { Shield, ShieldCheck, User, FolderKanban, Activity } from 'lucide-react';

export function LoginPage(): React.JSX.Element {
  return (
    <div className="login-page">
      {/* Animated background elements */}
      <div className="login-bg-grid" aria-hidden="true"></div>
      <div className="login-bg-gradient-orb login-bg-gradient-orb-1" aria-hidden="true"></div>
      <div className="login-bg-gradient-orb login-bg-gradient-orb-2" aria-hidden="true"></div>
      
      <div className="login-container">
        {/* Left side - Enhanced Branding */}
        <div className="login-branding" role="banner" aria-label="Magic Auth Branding">
          <div className="brand-content">
            <div className="brand-logo-section">
              <div className="brand-logo-wrapper">
                <Shield size={72} className="logo-icon" aria-label="Magic Auth Logo" />
                <div className="logo-glow" aria-hidden="true"></div>
              </div>
            </div>
            
            <header className="brand-header">
              <h1 className="brand-title">Magic Auth</h1>
              <div className="brand-subtitle-wrapper">
                <ShieldCheck size={16} className="brand-shield-icon" />
                <h2 className="brand-subtitle">Admin Dashboard</h2>
              </div>
            </header>
            
            <div className="brand-description">
              <p className="brand-tagline">
                Enterprise-grade authentication management for secure access control.
              </p>
              
              <div className="feature-list" role="list" aria-label="Key Features">
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <User size={16} />
                  </div>
                  <div className="feature-content">
                    <span className="feature-text">3-Tier User Management</span>
                    <span className="feature-desc">Hierarchical access control</span>
                  </div>
                </div>
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="feature-content">
                    <span className="feature-text">Role-Based Access Control</span>
                    <span className="feature-desc">Granular permissions</span>
                  </div>
                </div>
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <FolderKanban size={16} />
                  </div>
                  <div className="feature-content">
                    <span className="feature-text">Project Management</span>
                    <span className="feature-desc">Multi-tenant support</span>
                  </div>
                </div>
                <div className="feature-item" role="listitem">
                  <div className="feature-icon" aria-hidden="true">
                    <Activity size={16} />
                  </div>
                  <div className="feature-content">
                    <span className="feature-text">System Health Monitoring</span>
                    <span className="feature-desc">Real-time diagnostics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="brand-footer">
              <h3 className="user-types-title">Authorized Access Levels</h3>
              <div className="user-type-list" role="list" aria-label="Available Access Levels">
                <div className="user-type-item user-type-root" role="listitem">
                  <span className="login-user-badge badge-root" aria-label="Root Access Level">ROOT</span>
                  <div className="user-type-details">
                    <span className="user-type-label">System Administrator</span>
                    <span className="user-type-desc">Full system access</span>
                  </div>
                </div>
                <div className="user-type-item user-type-admin" role="listitem">
                  <span className="login-user-badge badge-admin" aria-label="Admin Access Level">ADMIN</span>
                  <div className="user-type-details">
                    <span className="user-type-label">Project Manager</span>
                    <span className="user-type-desc">Project-level access</span>
                  </div>
                </div>
              </div>
          </footer>
        </div>

        {/* Right side - Enhanced Login form */}
        <main className="login-form-section" role="main" aria-label="Login Form">
          <div className="form-container">
            <header className="form-header-section">
              <h2 className="form-main-title">Welcome Back</h2>
              <p className="form-main-subtitle">
                Sign in to access the Magic Auth Dashboard
              </p>
              <div className="form-security-badge" aria-label="Secure connection">
                <ShieldCheck size={16} />
                <span>Secure Connection</span>
              </div>
            </header>
            <LoginForm />
            
            {/* Keyboard shortcuts hint */}
            <div className="login-keyboard-hint" aria-label="Keyboard shortcuts">
              <span className="keyboard-hint-text">Pro tip:</span>
              <kbd className="keyboard-key">Enter</kbd>
              <span className="keyboard-hint-text">to sign in</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage; 