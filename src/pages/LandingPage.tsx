import React, { useState } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import {
  LogoIcon,
  SecurityIcon,
  UserIcon,
  ProjectIcon,
  HealthIcon,
  LockIcon,
  GroupIcon,
  CheckIcon,
} from '@/components/icons';

export function LandingPage(): React.JSX.Element {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Animated background elements */}
      <div className="landing-bg-grid" aria-hidden="true"></div>
      <div className="landing-bg-gradient-orb landing-bg-gradient-orb-1" aria-hidden="true"></div>
      <div className="landing-bg-gradient-orb landing-bg-gradient-orb-2" aria-hidden="true"></div>

      {/* Navigation */}
      <nav className="landing-nav" role="navigation" aria-label="Main navigation">
        <div className="landing-nav-content">
          <div className="landing-nav-brand">
            <LogoIcon size={40} className="landing-nav-logo" aria-label="Magic Auth Logo" />
            <span className="landing-nav-brand-text">Magic Auth</span>
          </div>
          <button
            className="btn btn-primary btn-md"
            onClick={() => setIsLoginModalOpen(true)}
            aria-label="Sign in to your account"
          >
            <LockIcon size={16} />
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" role="banner" aria-label="Hero section">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <SecurityIcon size={16} />
            <span>Enterprise-Grade Security</span>
          </div>
          
          <h1 className="landing-hero-title">
            Enterprise Authentication
            <span className="landing-hero-title-gradient"> Management Platform</span>
          </h1>
          
          <p className="landing-hero-subtitle">
            Secure, scalable, and sophisticated access control for modern applications.
            Manage users, projects, and permissions with granular control.
          </p>
          
          <div className="landing-hero-actions">
            <button
              className="btn btn-primary btn-lg landing-hero-cta"
              onClick={() => setIsLoginModalOpen(true)}
            >
              <LockIcon size={20} />
              Get Started
            </button>
          </div>

          {/* Trust indicators */}
          <div className="landing-trust-indicators">
            <div className="landing-trust-item">
              <CheckIcon size={16} />
              <span>WCAG 2.2 AA Compliant</span>
            </div>
            <div className="landing-trust-item">
              <CheckIcon size={16} />
              <span>Real-time Monitoring</span>
            </div>
            <div className="landing-trust-item">
              <CheckIcon size={16} />
              <span>Multi-tenant Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features" aria-label="Key Features">
        <div className="landing-features-content">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Powerful Features</h2>
            <p className="landing-section-subtitle">
              Everything you need for enterprise authentication management
            </p>
          </div>

          <div className="landing-features-grid">
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <UserIcon size={24} />
              </div>
              <h3 className="landing-feature-title">3-Tier User Management</h3>
              <p className="landing-feature-description">
                Hierarchical access control with ROOT, ADMIN, and USER levels.
                Manage permissions with precision and flexibility.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <SecurityIcon size={24} />
              </div>
              <h3 className="landing-feature-title">Role-Based Access Control</h3>
              <p className="landing-feature-description">
                Granular permissions system with custom roles and permission groups.
                Define exactly what each user can do.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <ProjectIcon size={24} />
              </div>
              <h3 className="landing-feature-title">Project Management</h3>
              <p className="landing-feature-description">
                Multi-tenant architecture with project-level isolation.
                Perfect for SaaS applications and enterprise systems.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <GroupIcon size={24} />
              </div>
              <h3 className="landing-feature-title">Group Management</h3>
              <p className="landing-feature-description">
                Organize users into groups for efficient permission assignment.
                Global and project-specific group support.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <HealthIcon size={24} />
              </div>
              <h3 className="landing-feature-title">System Health Monitoring</h3>
              <p className="landing-feature-description">
                Real-time diagnostics and health checks for your authentication system.
                Monitor performance and catch issues early.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <LockIcon size={24} />
              </div>
              <h3 className="landing-feature-title">Secure by Default</h3>
              <p className="landing-feature-description">
                Built with security best practices. Encrypted connections,
                secure session management, and comprehensive audit logs.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Access Levels Section */}
      <section className="landing-access-levels" aria-label="Access Levels">
        <div className="landing-access-levels-content">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Authorized Access Levels</h2>
            <p className="landing-section-subtitle">
              Two powerful access tiers for complete system control
            </p>
          </div>

          <div className="landing-access-levels-grid">
            <article className="landing-access-card landing-access-card-root">
              <div className="landing-access-badge landing-access-badge-root">
                ROOT
              </div>
              <h3 className="landing-access-title">System Administrator</h3>
              <p className="landing-access-description">
                Complete system access with full administrative privileges.
                Manage all users, projects, and system-wide configurations.
              </p>
              <ul className="landing-access-features">
                <li><CheckIcon size={16} /> Full system access</li>
                <li><CheckIcon size={16} /> User management</li>
                <li><CheckIcon size={16} /> System configuration</li>
                <li><CheckIcon size={16} /> Security settings</li>
              </ul>
            </article>

            <article className="landing-access-card landing-access-card-admin">
              <div className="landing-access-badge landing-access-badge-admin">
                ADMIN
              </div>
              <h3 className="landing-access-title">Project Manager</h3>
              <p className="landing-access-description">
                Project-level access for managing users and permissions within
                assigned projects. Perfect for team leads and project managers.
              </p>
              <ul className="landing-access-features">
                <li><CheckIcon size={16} /> Project management</li>
                <li><CheckIcon size={16} /> Team member access</li>
                <li><CheckIcon size={16} /> Permission assignment</li>
                <li><CheckIcon size={16} /> Activity monitoring</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta" aria-label="Call to action">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Ready to Get Started?</h2>
          <p className="landing-cta-subtitle">
            Sign in now to access your Magic Auth Dashboard
          </p>
          <button
            className="btn btn-primary btn-lg landing-cta-button"
            onClick={() => setIsLoginModalOpen(true)}
          >
            <LockIcon size={20} />
            Sign In to Dashboard
          </button>
          <p className="landing-cta-note">
            Admin and ROOT users only · Need access?{' '}
            <a href="mailto:andres@arz.ai" className="landing-cta-link">
              Contact Administrator
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-footer-content">
          <div className="landing-footer-brand">
            <LogoIcon size={32} />
            <span className="landing-footer-brand-text">Magic Auth</span>
          </div>
          <p className="landing-footer-text">
            Enterprise-grade authentication management © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default LandingPage;

