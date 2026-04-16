import React from 'react';
import {
  User,
  ShieldCheck,
  FolderKanban,
  Users,
  Activity,
  Lock,
} from 'lucide-react';

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface ApiCapabilities {
  authentication: string[];
  users: string[];
  permissions: string[];
  admin: string[];
}

export const features: Feature[] = [
  {
    icon: <User size={24} />,
    title: 'User Management',
    description:
      'Complete user lifecycle with hierarchical access levels (Root, Admin, User). Profile management, status control, and secure password handling.',
  },
  {
    icon: <ShieldCheck size={24} />,
    title: 'Role-Based Access Control',
    description:
      'Granular RBAC with permission groups and roles. Define custom permissions and assign them to users or groups for precise access control.',
  },
  {
    icon: <FolderKanban size={24} />,
    title: 'Multi-Project Support',
    description:
      'Multi-tenant architecture with project isolation. Users can belong to multiple projects with different permissions in each context.',
  },
  {
    icon: <Users size={24} />,
    title: 'Groups Architecture',
    description:
      'Groups-of-Groups model: User Groups → Project Groups → Projects. Scalable team management with inherited permissions.',
  },
  {
    icon: <Activity size={24} />,
    title: 'Audit & Monitoring',
    description:
      'Comprehensive audit logs and activity tracking. Monitor user actions, system health, and cache performance in real-time.',
  },
  {
    icon: <Lock size={24} />,
    title: 'JWT Authentication',
    description:
      'Secure session management with JWT tokens and Redis-backed storage. Token refresh, project switching, and automatic invalidation.',
  },
];

export const apiCapabilities: ApiCapabilities = {
  authentication: [
    'Login with username/email',
    'User registration with group assignment',
    'Session validation & token refresh',
    'Project context switching',
  ],
  users: [
    'Profile management (self-service)',
    'User search with filters',
    'Status management (activate/deactivate)',
    'Password reset workflows',
  ],
  permissions: [
    'Permission groups with categories',
    'Role-based permission assignment',
    'User group bulk assignments',
    'Permission inheritance resolution',
  ],
  admin: [
    'Dashboard statistics',
    'Bulk operations (users, roles)',
    'Cache management',
    'System health monitoring',
  ],
};

export const techStack = ['React', 'TypeScript', 'FastAPI', 'MySQL', 'Redis'];
