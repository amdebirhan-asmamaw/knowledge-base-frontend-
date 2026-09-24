# Fine-Grained Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an explicit 1:1 fine-grained permission model across all domains in backend and frontend, with complete UI gating and seamless startup role migration.

**Architecture:** Decompose all coarse structure and content permissions into discrete single-responsibility tokens in canonical permission catalogs. Enforce them in backend Express routes and Mongoose service layers via `requirePermission`, and enforce them in frontend Next.js React components via `useAuth().hasPermission`. An automatic startup migration synchronizes legacy MongoDB roles.

**Tech Stack:** Node.js, Express, TypeScript, Mongoose, Next.js 16, React 19, Tailwind CSS, Lucide icons, Sonner toasts.

## Global Constraints

- **Strict 1:1 Permission Mapping:** No wildcard fallbacks. Every single capability is checked by its exact permission string.
- **No Dynamic / Inline Imports:** Always use standard top-level imports (e.g. `import { Request, Response, NextFunction } from 'express'`). Never use `req: import('express').Request`.
- **Zero Type Errors:** `npx tsc --noEmit` must pass with 0 errors in both `knowledge-base-backend` and `knowledge-base-frontend-`.
- **Database Safety:** Migration must be idempotent and non-destructive to existing user roles.

---

### Task 1: Update Canonical Permission Dictionaries

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/core/permissions.ts`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/lib/permissions.ts`

**Interfaces:**
- Produces: Updated `PERMISSIONS` array and `PERMISSION_LABELS` metadata containing all new granular tokens for structure, content, uploads, employees, roles, departments, and policies.

- [ ] **Step 1: Update backend permissions.ts**
Add all discrete tokens to `PERMISSIONS` array and update `DEFAULT_ADMIN_PERMISSIONS` and `DEFAULT_EMPLOYEE_PERMISSIONS`:
```typescript
// Structure (Categories & Sections)
'structure:read',
'structure:category:create',
'structure:category:update',
'structure:category:toggle-visibility',
'structure:category:delete',
'structure:section:create',
'structure:section:update',
'structure:section:toggle-visibility',
'structure:section:delete',

// Content (Documents)
'content:create',
'content:read:own', 'content:read:dept', 'content:read:all',
'content:update:own', 'content:update:dept', 'content:update:all',
'content:delete:own', 'content:delete:dept', 'content:delete:all',
'content:versions:read',
'content:versions:restore',
'content:manage:ownership',
'content:manage:contributors',
'content:import:file',
'content:export',

// Uploads
'uploads:create',
'uploads:delete',

// Employees
'employees:password:reset',
'employees:clients:assign',

// Roles
'roles:assign',

// Departments
'departments:members:manage',
'departments:status:toggle',

// Policies
'policies:delete:permanent',
'policies:versions:read',
'policies:versions:restore',
'policies:acceptances:read',
```

- [ ] **Step 2: Update frontend permissions.ts**
Sync `PERMISSIONS` and add matching entries to `PERMISSION_LABELS` with descriptive labels, explanations, and groupings.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in both backend and frontend directories.
Expected: PASS (0 errors)

- [ ] **Step 4: Commit changes**
```bash
git add src/core/permissions.ts
git commit -m "feat(auth): define canonical fine-grained permissions catalog"
```

---

### Task 2: Implement Backend Database Role Migration

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/roles/role.migration.ts`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/core/config/database.ts:20-25`

**Interfaces:**
- Produces: `syncRolePermissions(): Promise<void>` which expands legacy permissions and ensures the admin role holds all canonical permissions.

- [ ] **Step 1: Write role.migration.ts**
Implement idempotent role migration function:
```typescript
import { Role } from './role.model';
import { PERMISSIONS } from '../../core/permissions';
import { logger } from '../../core/utils/logger';

export const syncRolePermissions = async (): Promise<void> => {
  try {
    const roles = await Role.find();
    for (const role of roles) {
      let perms = new Set<string>(role.permissions);

      // Expand legacy structure permissions
      if (perms.has('structure:create')) {
        perms.add('structure:category:create');
        perms.add('structure:section:create');
      }
      if (perms.has('structure:update')) {
        perms.add('structure:category:update');
        perms.add('structure:category:toggle-visibility');
        perms.add('structure:section:update');
        perms.add('structure:section:toggle-visibility');
      }
      if (perms.has('structure:delete')) {
        perms.add('structure:category:delete');
        perms.add('structure:section:delete');
      }

      // If this is an admin role, ensure all permissions are granted
      if (role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'superadmin') {
        PERMISSIONS.forEach((p) => perms.add(p));
      }

      role.permissions = Array.from(perms);
      await role.save();
    }
    logger.info('✅ Role permissions synchronized successfully');
  } catch (err) {
    logger.error('Error synchronizing role permissions:', err);
  }
};
```

- [ ] **Step 2: Connect migration into database.ts startup**
Modify `connectDatabase` to execute `await syncRolePermissions()` immediately after `mongoose.connect`.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in backend.
Expected: PASS (0 errors)

- [ ] **Step 4: Commit changes**
```bash
git add src/modules/roles/role.migration.ts src/core/config/database.ts
git commit -m "feat(roles): add startup permission synchronization migration"
```

---

### Task 3: Enforce Fine-Grained Permissions in Backend Document & Structure

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/documents/document.routes.ts`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/documents/document.service.ts`

**Interfaces:**
- Consumes: `requirePermission` from `../../core/middleware/auth.middleware`
- Enforces:
  - `structure:category:create`, `structure:category:update`, `structure:category:delete`
  - `structure:section:create`, `structure:section:update`, `structure:section:delete`
  - `content:versions:read`, `content:versions:restore`
  - `content:import:file`
  - `content:manage:ownership`, `content:manage:contributors`

- [ ] **Step 1: Update document.routes.ts**
Replace coarse middleware with fine-grained tokens:
```typescript
documentRouter.post('/categories', ...auth, requirePermission('structure:category:create'), validate(createCategorySchema), ctrl.createCategory);
documentRouter.put('/categories/:id', ...auth, requirePermission('structure:category:update'), validate(updateCategorySchema), ctrl.updateCategory);
documentRouter.delete('/categories/:id', ...auth, requirePermission('structure:category:delete'), ctrl.deleteCategory);

documentRouter.post('/sections', ...auth, requirePermission('structure:section:create'), validate(createSectionSchema), ctrl.createSection);
documentRouter.put('/sections/:id', ...auth, requirePermission('structure:section:update'), validate(updateSectionSchema), ctrl.updateSection);
documentRouter.delete('/sections/:id', ...auth, requirePermission('structure:section:delete'), ctrl.deleteSection);

documentRouter.get('/documents/:id/versions', ...auth, requirePermission('content:versions:read'), ctrl.listDocumentVersions);
documentRouter.get('/documents/:id/versions/:versionId', ...auth, requirePermission('content:versions:read'), ctrl.getDocumentVersion);
documentRouter.post('/documents/:id/versions/:versionId/restore', ...auth, requirePermission('content:versions:restore'), validate(restoreVersionSchema), ctrl.restoreDocumentVersion);

documentRouter.post('/parse-file', ...auth, requirePermission('content:import:file'), upload.single('file'), parseFile);
```

- [ ] **Step 2: Update document.service.ts for ownership and contributors**
In `updateDocument`, guard ownership and contributor changes:
```typescript
if (ownerChanged && !auth.permissions.includes('content:manage:ownership') && !isManager) {
  throw new AppError('You do not have permission to transfer document ownership', StatusCodes.FORBIDDEN);
}
if (contributorsChanged && !auth.permissions.includes('content:manage:contributors') && !isManager) {
  throw new AppError('You do not have permission to manage document contributors', StatusCodes.FORBIDDEN);
}
```
In `restoreVersion`, check:
```typescript
if (!auth.permissions.includes('content:versions:restore')) {
  throw new AppError('You do not have permission to restore document versions', StatusCodes.FORBIDDEN);
}
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in backend.
Expected: PASS (0 errors)

- [ ] **Step 4: Commit changes**
```bash
git add src/modules/documents/document.routes.ts src/modules/documents/document.service.ts
git commit -m "feat(documents): enforce fine-grained structure, versioning, and collaborator permissions"
```

---

### Task 4: Enforce Fine-Grained Permissions in Backend Other Modules

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/uploads/uploads.routes.ts`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/auth/users.routes.ts`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/departments/department.routes.ts`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-backend/src/modules/policies/policy.routes.ts`

- [ ] **Step 1: Enforce in uploads.routes.ts**
Add `requirePermission('uploads:create')` to upload endpoints and `requirePermission('uploads:delete')` to delete endpoints.

- [ ] **Step 2: Enforce in users.routes.ts**
- `PUT /:id/reset-password`: `requirePermission('employees:password:reset')`
- `PUT /:id/assign-clients`: `requirePermission('employees:clients:assign')`
- `PUT /:id/role`: `requirePermission('roles:assign')`

- [ ] **Step 3: Enforce in department.routes.ts**
- Member management endpoints: `requirePermission('departments:members:manage')`
- Reactivate endpoint: `requirePermission('departments:status:toggle')`

- [ ] **Step 4: Enforce in policy.routes.ts**
- Acceptances endpoint: `requirePermission('policies:acceptances:read')`
- Versions read endpoint: `requirePermission('policies:versions:read')`
- Version restore endpoint: `requirePermission('policies:versions:restore')`
- Permanent delete endpoint: `requirePermission('policies:delete:permanent')`

- [ ] **Step 5: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in backend.
Expected: PASS (0 errors)

- [ ] **Step 6: Commit changes**
```bash
git add src/modules/uploads/uploads.routes.ts src/modules/auth/users.routes.ts src/modules/departments/department.routes.ts src/modules/policies/policy.routes.ts
git commit -m "feat(auth): enforce dedicated granular permissions across uploads, users, departments, and policies"
```

---

### Task 5: Enforce Fine-Grained UI Controls in Structure Page

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/app/admin/structure/page.tsx`

- [ ] **Step 1: Gate category actions**
- Replace coarse `canCreateStructure`, `canUpdateStructure`, `canDeleteStructure` with:
  - `canCreateCategory = hasPermission('structure:category:create')`
  - `canUpdateCategory = hasPermission('structure:category:update')`
  - `canToggleCategoryVisibility = hasPermission('structure:category:toggle-visibility')`
  - `canDeleteCategory = hasPermission('structure:category:delete')`
- Apply to `+ Category` button, rename modal trigger, visibility switch, and delete button.

- [ ] **Step 2: Gate section actions**
- Define:
  - `canCreateSection = hasPermission('structure:section:create')`
  - `canUpdateSection = hasPermission('structure:section:update')`
  - `canToggleSectionVisibility = hasPermission('structure:section:toggle-visibility')`
  - `canDeleteSection = hasPermission('structure:section:delete')`
- Apply to `+ Section` button, rename modal trigger, visibility switch, and delete button.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in frontend.
Expected: PASS (0 errors)

- [ ] **Step 4: Commit changes**
```bash
git add app/admin/structure/page.tsx
git commit -m "feat(structure): gate category and section actions on discrete permissions"
```

---

### Task 6: Enforce Fine-Grained UI Controls in Document Viewer & Editor

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/DocumentView.tsx`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/DocumentEditor.tsx`

- [ ] **Step 1: Update DocumentView.tsx**
- "Edit Document" button: only visible if user can edit content (`content:update:*` or contributor).
- "Version History" button: only visible if `hasPermission('content:versions:read')`.
- "Restore Version" button in drawer: only visible if `hasPermission('content:versions:restore')`.
- "Copy / Print": only enabled if `hasPermission('content:export')` (or read permission).

- [ ] **Step 2: Update DocumentEditor.tsx**
- Import File (.docx / .pdf) button: only rendered if `hasPermission('content:import:file')`.
- Owner selector dropdown: only rendered as interactive if `hasPermission('content:manage:ownership')`; otherwise renders read-only `UserChip`.
- Contributor add/remove picker: only editable if `hasPermission('content:manage:contributors')`; otherwise renders read-only chip list.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in frontend.
Expected: PASS (0 errors)

- [ ] **Step 4: Commit changes**
```bash
git add components/DocumentView.tsx components/DocumentEditor.tsx
git commit -m "feat(documents): gate version history, file import, ownership, and contributors on fine-grained permissions"
```

---

### Task 7: Full System Verification & Code Review

**Files:** All modified files across backend and frontend.

- [ ] **Step 1: Run Backend Typecheck & Build**
Command: `npm run build` or `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-backend`
Expected: 0 errors.

- [ ] **Step 2: Run Frontend Typecheck & Build**
Command: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`
Expected: 0 errors.

- [ ] **Step 3: Final Code Review against Guidelines**
Verify:
1. No inline dynamic type annotations (e.g. `req: import('express').Request`).
2. Exact synchronization between backend and frontend permission dictionaries.
3. Clean error responses with exact permission requirements.
