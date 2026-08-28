// Shared permission definitions — keep in sync with backend's src/core/permissions.ts

export const PERMISSIONS = [
  // Clients
  'clients:create',
  'clients:read:own',
  'clients:read:dept',
  'clients:read:all',
  'clients:update:own',
  'clients:update:dept',
  'clients:update:all',
  'clients:delete:own',
  'clients:delete:dept',
  'clients:delete:all',

  // Observations
  'observations:create',
  'observations:read:own',
  'observations:read:dept',
  'observations:read:all',
  'observations:update:own',
  'observations:update:dept',
  'observations:update:all',
  'observations:delete:own',
  'observations:delete:dept',
  'observations:delete:all',

  // Content (Documents)
  'content:create',
  'content:read:own',
  'content:read:dept',
  'content:read:all',
  'content:update:own',
  'content:update:dept',
  'content:update:all',
  'content:delete:own',
  'content:delete:dept',
  'content:delete:all',

  // Structure (Categories & Sections)
  'structure:create',
  'structure:read',
  'structure:update',
  'structure:delete',

  // FAQ
  'faq:create',
  'faq:read',
  'faq:update',
  'faq:delete',

  // Employees
  'employees:create',
  'employees:read:own',
  'employees:read:dept',
  'employees:read:all',
  'employees:update:own',
  'employees:update:dept',
  'employees:update:all',
  'employees:delete:own',
  'employees:delete:dept',
  'employees:delete:all',

  // Departments
  'departments:create',
  'departments:read',
  'departments:update',
  'departments:delete',

  // Reports
  'reports:create',
  'reports:read:own',
  'reports:read:dept',
  'reports:read:all',
  'reports:update:own',
  'reports:update:dept',
  'reports:update:all',
  'reports:delete:own',
  'reports:delete:dept',
  'reports:delete:all',

  // Meetings
  'meetings:create',
  'meetings:read:own',
  'meetings:read:dept',
  'meetings:read:all',
  'meetings:update:own',
  'meetings:update:dept',
  'meetings:update:all',
  'meetings:delete:own',
  'meetings:delete:dept',
  'meetings:delete:all',

  // Surveys
  'surveys:create',
  'surveys:read:own',
  'surveys:read:dept',
  'surveys:read:all',
  'surveys:update:own',
  'surveys:update:dept',
  'surveys:update:all',
  'surveys:delete:own',
  'surveys:delete:dept',
  'surveys:delete:all',

  // AI Assistant
  'ai:chat',

  // Policies
  'policies:create',
  'policies:read',
  'policies:update',
  'policies:delete',

  // Initiatives
  'initiatives:create',
  'initiatives:read:own',
  'initiatives:read:dept',
  'initiatives:read:all',
  'initiatives:update:own',
  'initiatives:update:dept',
  'initiatives:update:all',
  'initiatives:delete:own',
  'initiatives:delete:dept',
  'initiatives:delete:all',

  // Roles
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:delete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type Scope = 'own' | 'dept' | 'all';

/**
 * Checks if a user's permissions grant access for a given domain, action, and target scope.
 * Hierarchy: 'all' > 'dept' > 'own'
 */
export function hasScopePermission(
  userPermissions: string[] | undefined,
  domain: string,
  action: string,
  requiredScope: Scope = 'own'
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;

  if (userPermissions.includes(`${domain}:${action}`)) return true;
  if (userPermissions.includes(`${domain}:${action}:all`)) return true;
  if (requiredScope !== 'all' && userPermissions.includes(`${domain}:${action}:dept`)) return true;
  if (requiredScope === 'own' && userPermissions.includes(`${domain}:${action}:own`)) return true;

  return false;
}

export const PERMISSION_LABELS: Record<Permission, { label: string; description: string; group: string; tier?: Scope }> = {
  // Clients
  'clients:create': { label: 'Create Clients', description: 'Create new client profiles', group: 'Clients' },
  'clients:read:own': { label: 'View Assigned Clients', description: 'View only clients explicitly assigned to you', group: 'Clients', tier: 'own' },
  'clients:read:dept': { label: 'View Dept Clients', description: 'View clients assigned to your department members', group: 'Clients', tier: 'dept' },
  'clients:read:all': { label: 'View All Clients', description: 'View all clients across the organization', group: 'Clients', tier: 'all' },
  'clients:update:own': { label: 'Edit Assigned Clients', description: 'Modify details of assigned clients', group: 'Clients', tier: 'own' },
  'clients:update:dept': { label: 'Edit Dept Clients', description: 'Modify clients belonging to your department', group: 'Clients', tier: 'dept' },
  'clients:update:all': { label: 'Edit All Clients', description: 'Modify any client across the organization', group: 'Clients', tier: 'all' },
  'clients:delete:own': { label: 'Delete Assigned Clients', description: 'Delete assigned client profiles', group: 'Clients', tier: 'own' },
  'clients:delete:dept': { label: 'Delete Dept Clients', description: 'Delete clients belonging to department', group: 'Clients', tier: 'dept' },
  'clients:delete:all': { label: 'Delete All Clients', description: 'Delete any client across the organization', group: 'Clients', tier: 'all' },

  // Observations
  'observations:create': { label: 'Add Observations', description: 'Post observations on clients', group: 'Observations' },
  'observations:read:own': { label: 'View Own Observations', description: 'View your own observations', group: 'Observations', tier: 'own' },
  'observations:read:dept': { label: 'View Dept Observations', description: 'View observations by department colleagues', group: 'Observations', tier: 'dept' },
  'observations:read:all': { label: 'View All Observations', description: 'View all observations across the organization', group: 'Observations', tier: 'all' },
  'observations:update:own': { label: 'Edit Own Observations', description: 'Edit your own observations', group: 'Observations', tier: 'own' },
  'observations:update:dept': { label: 'Edit Dept Observations', description: 'Edit observations by department colleagues', group: 'Observations', tier: 'dept' },
  'observations:update:all': { label: 'Edit All Observations', description: 'Edit any observation across the organization', group: 'Observations', tier: 'all' },
  'observations:delete:own': { label: 'Delete Own Observations', description: 'Delete your own observations', group: 'Observations', tier: 'own' },
  'observations:delete:dept': { label: 'Delete Dept Observations', description: 'Delete observations in your department', group: 'Observations', tier: 'dept' },
  'observations:delete:all': { label: 'Delete All Observations', description: 'Delete any observation across the organization', group: 'Observations', tier: 'all' },

  // Content
  'content:create': { label: 'Create Documents', description: 'Create new documents', group: 'Content' },
  'content:read:own': { label: 'Read Own Documents', description: 'View documents you authored or own', group: 'Content', tier: 'own' },
  'content:read:dept': { label: 'Read Dept Documents', description: 'View documents published to your department', group: 'Content', tier: 'dept' },
  'content:read:all': { label: 'Read All Documents', description: 'View all documents across the organization', group: 'Content', tier: 'all' },
  'content:update:own': { label: 'Edit Own Documents', description: 'Edit documents you created', group: 'Content', tier: 'own' },
  'content:update:dept': { label: 'Edit Dept Documents', description: 'Edit documents in your department', group: 'Content', tier: 'dept' },
  'content:update:all': { label: 'Edit All Documents', description: 'Edit any document across the organization', group: 'Content', tier: 'all' },
  'content:delete:own': { label: 'Delete Own Documents', description: 'Delete documents you created', group: 'Content', tier: 'own' },
  'content:delete:dept': { label: 'Delete Dept Documents', description: 'Delete documents in your department', group: 'Content', tier: 'dept' },
  'content:delete:all': { label: 'Delete All Documents', description: 'Delete any document across the organization', group: 'Content', tier: 'all' },

  // Structure
  'structure:create': { label: 'Create Structure', description: 'Create categories & sections', group: 'Structure' },
  'structure:read': { label: 'View Structure', description: 'View categories & sections', group: 'Structure' },
  'structure:update': { label: 'Edit Structure', description: 'Edit categories & sections', group: 'Structure' },
  'structure:delete': { label: 'Delete Structure', description: 'Delete categories & sections', group: 'Structure' },

  // FAQ
  'faq:create': { label: 'Create FAQs', description: 'Create new FAQ entries', group: 'FAQ' },
  'faq:read': { label: 'View FAQs', description: 'View FAQ entries', group: 'FAQ' },
  'faq:update': { label: 'Edit FAQs', description: 'Edit FAQ entries', group: 'FAQ' },
  'faq:delete': { label: 'Delete FAQs', description: 'Delete FAQ entries', group: 'FAQ' },

  // Employees
  'employees:create': { label: 'Create Employees', description: 'Create new employee accounts', group: 'Employees' },
  'employees:read:own': { label: 'View Own Profile', description: 'View your own employee profile', group: 'Employees', tier: 'own' },
  'employees:read:dept': { label: 'View Dept Employees', description: 'View employees in your department', group: 'Employees', tier: 'dept' },
  'employees:read:all': { label: 'View All Employees', description: 'View all employee accounts organization-wide', group: 'Employees', tier: 'all' },
  'employees:update:own': { label: 'Edit Own Profile', description: 'Edit your own profile', group: 'Employees', tier: 'own' },
  'employees:update:dept': { label: 'Edit Dept Employees', description: 'Edit employee details in your department', group: 'Employees', tier: 'dept' },
  'employees:update:all': { label: 'Edit All Employees', description: 'Edit any employee across the organization', group: 'Employees', tier: 'all' },
  'employees:delete:own': { label: 'Deactivate Own Account', description: 'Deactivate own account', group: 'Employees', tier: 'own' },
  'employees:delete:dept': { label: 'Deactivate Dept Employees', description: 'Deactivate accounts in your department', group: 'Employees', tier: 'dept' },
  'employees:delete:all': { label: 'Deactivate All Employees', description: 'Deactivate any employee account', group: 'Employees', tier: 'all' },

  // Departments
  'departments:create': { label: 'Create Departments', description: 'Create new departments', group: 'Departments' },
  'departments:read': { label: 'View Departments', description: 'View departments', group: 'Departments' },
  'departments:update': { label: 'Edit Departments', description: 'Edit departments', group: 'Departments' },
  'departments:delete': { label: 'Delete Departments', description: 'Delete departments', group: 'Departments' },

  // Reports
  'reports:create': { label: 'Create Reports', description: 'Create new task reports', group: 'Reports' },
  'reports:read:own': { label: 'View Own Reports', description: 'View reports you authored', group: 'Reports', tier: 'own' },
  'reports:read:dept': { label: 'View Dept Reports', description: 'View reports published to your department', group: 'Reports', tier: 'dept' },
  'reports:read:all': { label: 'View All Reports', description: 'View all reports organization-wide', group: 'Reports', tier: 'all' },
  'reports:update:own': { label: 'Edit Own Reports', description: 'Edit reports you authored', group: 'Reports', tier: 'own' },
  'reports:update:dept': { label: 'Edit Dept Reports', description: 'Edit reports belonging to your department', group: 'Reports', tier: 'dept' },
  'reports:update:all': { label: 'Edit All Reports', description: 'Edit any report across the organization', group: 'Reports', tier: 'all' },
  'reports:delete:own': { label: 'Delete Own Reports', description: 'Delete reports you authored', group: 'Reports', tier: 'own' },
  'reports:delete:dept': { label: 'Delete Dept Reports', description: 'Delete reports belonging to your department', group: 'Reports', tier: 'dept' },
  'reports:delete:all': { label: 'Delete All Reports', description: 'Delete any report across the organization', group: 'Reports', tier: 'all' },

  // Meetings
  'meetings:create': { label: 'Create Meetings', description: 'Create meeting minutes', group: 'Meetings' },
  'meetings:read:own': { label: 'View Own Meetings', description: 'View meeting minutes you authored', group: 'Meetings', tier: 'own' },
  'meetings:read:dept': { label: 'View Dept Meetings', description: 'View meeting minutes in your department', group: 'Meetings', tier: 'dept' },
  'meetings:read:all': { label: 'View All Meetings', description: 'View all meeting minutes organization-wide', group: 'Meetings', tier: 'all' },
  'meetings:update:own': { label: 'Edit Own Meetings', description: 'Edit meeting minutes you authored', group: 'Meetings', tier: 'own' },
  'meetings:update:dept': { label: 'Edit Dept Meetings', description: 'Edit meeting minutes in your department', group: 'Meetings', tier: 'dept' },
  'meetings:update:all': { label: 'Edit All Meetings', description: 'Edit any meeting minute across the organization', group: 'Meetings', tier: 'all' },
  'meetings:delete:own': { label: 'Delete Own Meetings', description: 'Delete meeting minutes you authored', group: 'Meetings', tier: 'own' },
  'meetings:delete:dept': { label: 'Delete Dept Meetings', description: 'Delete meeting minutes in your department', group: 'Meetings', tier: 'dept' },
  'meetings:delete:all': { label: 'Delete All Meetings', description: 'Delete any meeting minute across the organization', group: 'Meetings', tier: 'all' },

  // Surveys
  'surveys:create': { label: 'Create Surveys', description: 'Create surveys', group: 'Surveys' },
  'surveys:read:own': { label: 'View Own Surveys', description: 'View surveys you authored and your responses', group: 'Surveys', tier: 'own' },
  'surveys:read:dept': { label: 'View Dept Surveys', description: 'View surveys targeted to your department', group: 'Surveys', tier: 'dept' },
  'surveys:read:all': { label: 'View All Surveys', description: 'View all surveys and aggregate responses organization-wide', group: 'Surveys', tier: 'all' },
  'surveys:update:own': { label: 'Edit Own Surveys', description: 'Edit surveys you authored', group: 'Surveys', tier: 'own' },
  'surveys:update:dept': { label: 'Edit Dept Surveys', description: 'Edit surveys belonging to your department', group: 'Surveys', tier: 'dept' },
  'surveys:update:all': { label: 'Edit All Surveys', description: 'Edit any survey across the organization', group: 'Surveys', tier: 'all' },
  'surveys:delete:own': { label: 'Delete Own Surveys', description: 'Delete surveys you authored', group: 'Surveys', tier: 'own' },
  'surveys:delete:dept': { label: 'Delete Dept Surveys', description: 'Delete surveys belonging to your department', group: 'Surveys', tier: 'dept' },
  'surveys:delete:all': { label: 'Delete All Surveys', description: 'Delete any survey across the organization', group: 'Surveys', tier: 'all' },

  // AI Assistant
  'ai:chat': { label: 'Use AI Assistant', description: 'Access the AI chat assistant', group: 'AI Assistant' },

  // Policies
  'policies:create': { label: 'Create Policies', description: 'Create employment policies', group: 'Policies' },
  'policies:read': { label: 'View Policies', description: 'View employment policies', group: 'Policies' },
  'policies:update': { label: 'Edit Policies', description: 'Edit employment policies', group: 'Policies' },
  'policies:delete': { label: 'Delete Policies', description: 'Delete employment policies', group: 'Policies' },

  // Initiatives
  'initiatives:create': { label: 'Create Initiatives', description: 'Create employee initiatives', group: 'Initiatives' },
  'initiatives:read:own': { label: 'View Own Initiatives', description: 'View initiatives you created', group: 'Initiatives', tier: 'own' },
  'initiatives:read:dept': { label: 'View Dept Initiatives', description: 'View initiatives submitted by your department', group: 'Initiatives', tier: 'dept' },
  'initiatives:read:all': { label: 'View All Initiatives', description: 'View all initiatives organization-wide', group: 'Initiatives', tier: 'all' },
  'initiatives:update:own': { label: 'Edit Own Initiatives', description: 'Edit initiatives you created', group: 'Initiatives', tier: 'own' },
  'initiatives:update:dept': { label: 'Edit Dept Initiatives', description: 'Edit initiatives in your department', group: 'Initiatives', tier: 'dept' },
  'initiatives:update:all': { label: 'Edit All Initiatives', description: 'Edit any initiative organization-wide', group: 'Initiatives', tier: 'all' },
  'initiatives:delete:own': { label: 'Delete Own Initiatives', description: 'Delete initiatives you created', group: 'Initiatives', tier: 'own' },
  'initiatives:delete:dept': { label: 'Delete Dept Initiatives', description: 'Delete initiatives in your department', group: 'Initiatives', tier: 'dept' },
  'initiatives:delete:all': { label: 'Delete All Initiatives', description: 'Delete any initiative organization-wide', group: 'Initiatives', tier: 'all' },

  // Roles
  'roles:create': { label: 'Create Roles', description: 'Create new roles', group: 'Roles' },
  'roles:read': { label: 'View Roles', description: 'View roles', group: 'Roles' },
  'roles:update': { label: 'Edit Roles', description: 'Edit roles and permissions', group: 'Roles' },
  'roles:delete': { label: 'Delete Roles', description: 'Delete roles', group: 'Roles' },
};
