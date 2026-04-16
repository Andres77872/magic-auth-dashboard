import React, { useState } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  ArrowRight,
  Key,
  Layers,
  Github,
  BookOpen,
  UserPlus,
  FileKey,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import {
  FeatureCard,
  CapabilityItem,
  FlowCard,
} from '@/pages/landing/components';
import {
  features,
  apiCapabilities,
  techStack,
} from '@/pages/landing/landing-page-data';

export function LandingPage(): React.JSX.Element {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
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
            <span className="text-xl font-bold text-foreground">
              Magic Auth
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://auth-v2.arz.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              <BookOpen size={14} />
              API Docs
            </a>
            <a
              href="https://github.com/Andres77872/magic-auth-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <Github size={14} />
              GitHub
            </a>
            <Button onClick={() => setIsLoginModalOpen(true)} size="md">
              <Lock size={16} />
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative z-10 py-20 sm:py-28 lg:py-32"
        role="banner"
        aria-label="Hero section"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
              <Shield size={16} />
              <span>Core Authentication Infrastructure</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Magic Auth{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              The centralized authentication and authorization system powering
              all my projects. Built with enterprise-grade architecture for user
              management, role-based access control, multi-project support, and
              real-time monitoring.
            </p>

            {/* Tech Stack */}
            <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
              {techStack.map((tech) => (
                <Badge key={tech} variant="secondary" size="md">
                  {tech}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                size="xl"
                className="group"
              >
                <Key size={20} />
                Access Dashboard
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Button>
              <a
                href="https://auth-v2.arz.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <BookOpen size={16} />
                API Documentation
              </a>
            </div>

            {/* Quick Links */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <a
                href="https://github.com/Andres77872/magic-auth-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github size={16} />
                Frontend
              </a>
              <span className="text-border">•</span>
              <a
                href="https://github.com/Andres77872/api.auth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github size={16} />
                Backend
              </a>
              <span className="text-border">•</span>
              <a
                href="https://auth-v2.arz.ai/redoc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <BookOpen size={16} />
                ReDoc
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="relative z-10 py-20 sm:py-28"
        aria-label="Key Features"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Core Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Production-ready authentication infrastructure with
              enterprise-grade architecture
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* API Capabilities Section */}
      <section
        className="relative z-10 py-20 sm:py-28"
        aria-label="API Capabilities"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              API Capabilities
            </h2>
            <p className="text-lg text-muted-foreground">
              RESTful API with comprehensive endpoints for all auth operations
            </p>
          </div>

          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <CapabilityItem
                  title="Authentication"
                  items={apiCapabilities.authentication}
                />
                <CapabilityItem
                  title="User Management"
                  items={apiCapabilities.users}
                />
                <CapabilityItem
                  title="Permissions"
                  items={apiCapabilities.permissions}
                />
                <CapabilityItem
                  title="Administration"
                  items={apiCapabilities.admin}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* System Flows Section */}
      <section
        className="relative z-10 py-20 sm:py-28"
        aria-label="System Flows"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              System Architecture
            </h2>
            <p className="text-lg text-muted-foreground">
              How data flows through the authentication system
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Groups-of-Groups Architecture */}
            <FlowCard
              icon={<Layers size={28} />}
              title="Groups-of-Groups Architecture"
              description="Hierarchical model for scalable access management and team organization."
              flowItems={[
                { label: 'User', variant: 'primary' },
                { label: 'User Group', variant: 'secondary' },
                { label: 'Project Group', variant: 'secondary' },
                { label: 'Projects', variant: 'primary' },
              ]}
              note="Users belong to User Groups, which have access to Project Groups containing multiple Projects."
            />

            {/* Permission Assignment Flow */}
            <FlowCard
              icon={<FileKey size={28} />}
              title="Permission Assignment"
              description="Flexible permission inheritance through roles, groups, and direct assignment."
              flowItems={[
                { label: 'Permission', variant: 'primary' },
                { label: 'Permission Group', variant: 'secondary' },
                { label: 'Role / User Group', variant: 'secondary' },
                { label: 'User', variant: 'primary' },
              ]}
              note="Permissions cascade through groups and roles, with direct user overrides supported."
            />

            {/* Authentication Flow */}
            <FlowCard
              icon={<Key size={28} />}
              title="Authentication Flow"
              description="Secure JWT-based authentication with Redis session management."
              flowItems={[
                { label: 'Credentials', variant: 'primary' },
                { label: 'Validation', variant: 'secondary' },
                { label: 'JWT Token', variant: 'secondary' },
                { label: 'Session', variant: 'primary' },
              ]}
              note="Supports login, token refresh, project switching, and automatic session invalidation."
            />

            {/* User Management Flow */}
            <FlowCard
              icon={<UserPlus size={28} />}
              title="User Management"
              description="Complete user lifecycle from registration to access control."
              flowItems={[
                { label: 'Register', variant: 'primary' },
                { label: 'Assign Group', variant: 'secondary' },
                { label: 'Set Role', variant: 'secondary' },
                { label: 'Active', variant: 'primary' },
              ]}
              note="Supports user types (Root, Admin, Consumer), status management, and password workflows."
            />

            {/* Audit Log Flow */}
            <FlowCard
              icon={<ClipboardList size={28} />}
              title="Audit & Activity Tracking"
              description="Comprehensive logging of all system events and user actions."
              flowItems={[
                { label: 'Action', variant: 'primary' },
                { label: 'Event Log', variant: 'secondary' },
                { label: 'Filter/Search', variant: 'secondary' },
                { label: 'Report', variant: 'primary' },
              ]}
              note="Track logins, permission changes, user modifications, and system events."
            />

            {/* Project Context Flow */}
            <FlowCard
              icon={<RefreshCw size={28} />}
              title="Project Context Switching"
              description="Multi-tenant support with seamless project context management."
              flowItems={[
                { label: 'Session', variant: 'primary' },
                { label: 'Switch Request', variant: 'secondary' },
                { label: 'Validate Access', variant: 'secondary' },
                { label: 'New Context', variant: 'primary' },
              ]}
              note="Users can switch between accessible projects without re-authentication."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative z-10 py-20 sm:py-28"
        aria-label="Call to action"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-3xl overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
            <CardContent className="p-8 text-center sm:p-12">
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                Explore the Dashboard
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Sign in to access the full authentication management interface,
                or check out the API documentation and source code
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  size="xl"
                  className="group"
                >
                  <Lock size={20} />
                  Sign In
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Button>
                <a
                  href="https://auth-v2.arz.ai/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="xl">
                    <BookOpen size={20} />
                    View API Docs
                  </Button>
                </a>
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                Open source on GitHub{' '}
                <span className="mx-1 text-border">•</span>
                Need access?{' '}
                <a
                  href="mailto:andres@arz.ai"
                  className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
                >
                  Contact me
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 border-t border-border/50 py-8"
        role="contentinfo"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <a
                href="https://auth-v2.arz.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                API Docs
              </a>
              <a
                href="https://auth-v2.arz.ai/redoc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                ReDoc
              </a>
              <a
                href="https://github.com/Andres77872/magic-auth-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
              >
                <Github size={14} />
                Frontend
              </a>
              <a
                href="https://github.com/Andres77872/api.auth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
              >
                <Github size={14} />
                Backend
              </a>
            </div>
            {/* Bottom row */}
            <div className="flex flex-col items-center justify-between gap-4 sm:w-full sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield size={18} />
                </div>
                <span className="font-semibold text-foreground">
                  Magic Auth
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="https://arz.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  arz.ai
                </a>
                <span className="text-border">•</span>
                <a
                  href="https://arizmendi.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  arizmendi.io
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Andrés Arizmendi — {new Date().getFullYear()}
              </p>
            </div>
          </div>
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
