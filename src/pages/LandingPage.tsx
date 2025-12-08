import React, { useState } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldCheck,
  User,
  FolderKanban,
  Activity,
  Lock,
  Users,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface AccessCardProps {
  badge: string;
  badgeVariant: 'primary' | 'secondary';
  title: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

function AccessCard({ badge, badgeVariant, title, description, features, highlighted }: AccessCardProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        highlighted
          ? 'border-primary/50 bg-gradient-to-b from-primary/5 to-transparent shadow-lg shadow-primary/10'
          : 'border-border/50 bg-card/50 backdrop-blur-sm hover:border-border'
      }`}
    >
      {highlighted && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      <CardContent className="p-6">
        <Badge variant={badgeVariant} size="lg" className="mb-4">
          {badge}
        </Badge>
        <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                <Check size={12} />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function LandingPage(): React.JSX.Element {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const features = [
    {
      icon: <User size={24} />,
      title: '3-Tier User Management',
      description:
        'Hierarchical access control with ROOT, ADMIN, and USER levels. Manage permissions with precision and flexibility.',
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Role-Based Access Control',
      description:
        'Granular permissions system with custom roles and permission groups. Define exactly what each user can do.',
    },
    {
      icon: <FolderKanban size={24} />,
      title: 'Project Management',
      description:
        'Multi-tenant architecture with project-level isolation. Perfect for SaaS applications and enterprise systems.',
    },
    {
      icon: <Users size={24} />,
      title: 'Group Management',
      description:
        'Organize users into groups for efficient permission assignment. Global and project-specific group support.',
    },
    {
      icon: <Activity size={24} />,
      title: 'System Health Monitoring',
      description:
        'Real-time diagnostics and health checks for your authentication system. Monitor performance and catch issues early.',
    },
    {
      icon: <Lock size={24} />,
      title: 'Secure by Default',
      description:
        'Built with security best practices. Encrypted connections, secure session management, and comprehensive audit logs.',
    },
  ];

  const trustIndicators = [
    'WCAG 2.2 AA Compliant',
    'Real-time Monitoring',
    'Multi-tenant Support',
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-md"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield size={24} />
            </div>
            <span className="text-xl font-bold text-foreground">Magic Auth</span>
          </div>
          <Button onClick={() => setIsLoginModalOpen(true)} size="md">
            <Lock size={16} />
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20 sm:py-28 lg:py-32" role="banner" aria-label="Hero section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
              <Sparkles size={16} />
              <span>Enterprise-Grade Security</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Enterprise Authentication{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Secure, scalable, and sophisticated access control for modern applications. Manage users, projects, and
              permissions with granular control.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button onClick={() => setIsLoginModalOpen(true)} size="xl" className="group">
                <Lock size={20} />
                Get Started
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check size={12} />
                  </div>
                  {indicator}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 sm:py-28" aria-label="Key Features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for enterprise authentication management
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Access Levels Section */}
      <section className="relative z-10 py-20 sm:py-28" aria-label="Access Levels">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Authorized Access Levels</h2>
            <p className="text-lg text-muted-foreground">Two powerful access tiers for complete system control</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            <AccessCard
              badge="ROOT"
              badgeVariant="primary"
              title="System Administrator"
              description="Complete system access with full administrative privileges. Manage all users, projects, and system-wide configurations."
              features={['Full system access', 'User management', 'System configuration', 'Security settings']}
              highlighted
            />
            <AccessCard
              badge="ADMIN"
              badgeVariant="secondary"
              title="Project Manager"
              description="Project-level access for managing users and permissions within assigned projects. Perfect for team leads and project managers."
              features={['Project management', 'Team member access', 'Permission assignment', 'Activity monitoring']}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 sm:py-28" aria-label="Call to action">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
            <CardContent className="py-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Ready to Get Started?</h2>
              <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
                Sign in now to access your Magic Auth Dashboard
              </p>
              <Button onClick={() => setIsLoginModalOpen(true)} size="xl" className="group">
                <Lock size={20} />
                Sign In to Dashboard
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="mt-6 text-sm text-muted-foreground">
                Admin and ROOT users only{' '}
                <span className="mx-2 text-border">|</span>
                Need access?{' '}
                <a
                  href="mailto:andres@arz.ai"
                  className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
                >
                  Contact Administrator
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield size={18} />
              </div>
              <span className="font-semibold text-foreground">Magic Auth</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade authentication management - {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

export default LandingPage;

