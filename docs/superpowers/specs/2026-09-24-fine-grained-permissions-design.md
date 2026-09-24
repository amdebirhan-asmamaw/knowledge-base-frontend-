# Fine-Grained Permissions Architecture Specification

**Status:** Approved  
**Date:** 2026-09-24  
**Scope:** `knowledge-base-backend` & `knowledge-base-frontend-`  
**Paradigm:** Strict 1:1 Fine-Grained RBAC (No Wildcard Fallbacks)

---

## 1. Executive Summary

This specification establishes an explicit, fine-grained Role-Based Access Control (RBAC) architecture across the Knowledge Base platform. All coarse permissions (e.g., bundling categories and sections into `structure:create/update/delete`) are replaced with discrete, single-responsibility permission tokens. Every user-accessible action across API endpoints, data mutation services, and frontend UI controls is strictly 1:1 with its dedicated permission token.

To prevent disruption to existing users, a startup database migration seamlessly expands existing roles in MongoDB and guarantees that administrators retain full authority.

---

## 2. Canonical Permission Taxonomy

The canonical list is maintained in synchronization between:
- `knowledge-base-backend/src/core/permissions.ts`
- `knowledge-base-frontend-/lib/permissions.ts`

### 2.1 Structure Domain (Categories & Sections)
*Replaces coarse `structure:create`, `structure:read`, `structure:update`, `structure:delete`.*
- `structure:read` — View structure hierarchy, categories, and sections
- `structure:category:create` — Create top-level categories
- `structure:category:update` — Edit category name, display order, and slug
- `structure:category:toggle-visibility` — Toggle category active/inactive status
- `structure:category:delete` — Delete category and cascade/check nested sections
- `structure:section:create` — Create sections within a category
- `structure:section:update` — Edit section name, display order, and slug
- `structure:section:toggle-visibility` — Toggle section active/inactive status
- `structure:section:delete` — Delete section and cascade/check nested documents

### 2.2 Content Domain (Documents, Versioning, Collaboration)
*Splits document authoring from version management, ownership, and parsing.*
- `content:create` — Create new documents
- `content:read:own` / `content:read:dept` / `content:read:all` — View document contents (scoped)
- `content:update:own` / `content:update:dept` / `content:update:all` — Edit document title, slug, content (scoped)
- `content:delete:own` / `content:delete:dept` / `content:delete:all` — Delete documents (scoped)
- `content:versions:read` — Access version history and view previous version snapshots
- `content:versions:restore` — Revert document content to a historical version
- `content:manage:ownership` — Transfer document ownership to another employee
- `content:manage:contributors` — Add or remove contributors on a document
- `content:import:file` — Upload and parse Word (.docx) or PDF files into the rich editor
- `content:export` — Copy rich text / print / export documents

### 2.3 Uploads & Media Assets Domain
*Secures upload and asset management endpoints.*
- `uploads:create` — Upload files, attachments, or embedded media
- `uploads:delete` — Delete uploaded files from server storage

### 2.4 Employees & User Management Domain
*Separates profile editing from administrative account operations.*
- `employees:create` — Register new employee accounts
- `employees:read:own` / `employees:read:dept` / `employees:read:all` — View employee accounts (scoped)
- `employees:update:own` / `employees:update:dept` / `employees:update:all` — Edit employee profile data (scoped)
- `employees:delete:own` / `employees:delete:dept` / `employees:delete:all` — Deactivate employee accounts (scoped)
- `employees:password:reset` — Reset employee passwords
- `employees:clients:assign` — Assign clients to employees

### 2.5 Roles & Access Control Domain
- `roles:create` — Create custom roles
- `roles:read` — View role definitions and permission matrices
- `roles:update` — Modify permissions assigned to a role
- `roles:delete` — Delete custom roles
- `roles:assign` — Assign or change an employee's role

### 2.6 Departments Domain
- `departments:create` — Create departments
- `departments:read` — View departments
- `departments:update` — Edit department metadata (name, description, head)
- `departments:delete` — Deactivate / delete departments
- `departments:members:manage` — Add, remove, or transfer members between departments
- `departments:status:toggle` — Reactivate deactivated departments

### 2.7 Policies Domain
- `policies:create` — Create policies
- `policies:read` — View policies
- `policies:update` — Edit policy content and metadata
- `policies:delete` — Soft-delete policies
- `policies:delete:permanent` — Permanently purge policies from database
- `policies:versions:read` — View policy revision history
- `policies:versions:restore` — Restore a previous policy version
- `policies:acceptances:read` — View policy acceptance audit logs

### 2.8 Retained Existing Domains
- `clients`: `clients:create`, `clients:read:*`, `clients:update:*`, `clients:delete:*`
- `observations`: `observations:create`, `observations:read:*`, `observations:update:*`, `observations:delete:*`
- `faq`: `faq:create`, `faq:read`, `faq:update`, `faq:delete`
- `reports`: `reports:create`, `reports:read:*`, `reports:update:*`, `reports:delete:*`
- `meetings`: `meetings:create`, `meetings:read:*`, `meetings:update:*`, `meetings:delete:*`
- `surveys`: `surveys:create`, `surveys:read:*`, `surveys:update:*`, `surveys:delete:*`
- `initiatives`: `initiatives:create`, `initiatives:read:*`, `initiatives:update:*`, `initiatives:delete:*`
- `ai`: `ai:chat`

---

## 3. Backend Architecture & Enforcement

### 3.1 Startup Role Migration & Synchronization
A database migration utility `syncRolePermissions()` will run during backend initialization:
1. **Legacy Permission Expansion**:
   - `structure:create` $\rightarrow$ `['structure:category:create', 'structure:section:create']`
   - `structure:update` $\rightarrow$ `['structure:category:update', 'structure:category:toggle-visibility', 'structure:section:update', 'structure:section:toggle-visibility']`
   - `structure:delete` $\rightarrow$ `['structure:category:delete', 'structure:section:delete']`
2. **Admin Role Assignment**:
   - Finds or initializes the `admin` role and assigns all tokens from `PERMISSIONS`.
3. **Clean Type Imports**:
   - Standard top-level imports only (no inline `req: import('express').Request`).

### 3.2 Endpoint Route Enforcement Matrix
- `POST   /api/documents/categories` $\rightarrow$ `requirePermission('structure:category:create')`
- `PUT    /api/documents/categories/:id` $\rightarrow$ `requirePermission('structure:category:update')` (or `structure:category:toggle-visibility` when only toggling `isActive`)
- `DELETE /api/documents/categories/:id` $\rightarrow$ `requirePermission('structure:category:delete')`
- `POST   /api/documents/sections` $\rightarrow$ `requirePermission('structure:section:create')`
- `PUT    /api/documents/sections/:id` $\rightarrow$ `requirePermission('structure:section:update')` (or `structure:section:toggle-visibility` when only toggling `isActive`)
- `DELETE /api/documents/sections/:id` $\rightarrow$ `requirePermission('structure:section:delete')`
- `POST   /api/documents/parse-file` $\rightarrow$ `requirePermission('content:import:file')`
- `GET    /api/documents/:id/versions` $\rightarrow$ `requirePermission('content:versions:read')`
- `GET    /api/documents/:id/versions/:versionId` $\rightarrow$ `requirePermission('content:versions:read')`
- `POST   /api/documents/:id/versions/:versionId/restore` $\rightarrow$ `requirePermission('content:versions:restore')`
- `PUT    /api/auth/users/:id/reset-password` $\rightarrow$ `requirePermission('employees:password:reset')`
- `PUT    /api/auth/users/:id/assign-clients` $\rightarrow$ `requirePermission('employees:clients:assign')`
- `PUT    /api/auth/users/:id/role` $\rightarrow$ `requirePermission('roles:assign')`
- `POST   /api/departments/:id/members` $\rightarrow$ `requirePermission('departments:members:manage')`
- `DELETE /api/departments/:id/members/:userId` $\rightarrow$ `requirePermission('departments:members:manage')`
- `POST   /api/departments/:id/transfer-members` $\rightarrow$ `requirePermission('departments:members:manage')`
- `POST   /api/departments/:id/activate` $\rightarrow$ `requirePermission('departments:status:toggle')`
- `GET    /api/policies/:id/acceptances` $\rightarrow$ `requirePermission('policies:acceptances:read')`
- `GET    /api/policies/:id/versions` $\rightarrow$ `requirePermission('policies:versions:read')`
- `POST   /api/policies/:id/versions/:versionId/restore` $\rightarrow$ `requirePermission('policies:versions:restore')`
- `DELETE /api/policies/:id/permanent` $\rightarrow$ `requirePermission('policies:delete:permanent')`
- `POST   /api/uploads` $\rightarrow$ `requirePermission('uploads:create')`
- `DELETE /api/uploads/:folder/:filename` $\rightarrow$ `requirePermission('uploads:delete')`

### 3.3 Service Layer Enforcement in `document.service.ts`
- Transferring document ownership (`owner !== doc.owner`) requires `content:manage:ownership`.
- Editing contributors list (`contributors !== doc.contributors`) requires `content:manage:contributors`.
- Restoring version requires `content:versions:restore` in addition to content edit eligibility.

---

## 4. Frontend Architecture & UI Authorization

### 4.1 UI Component Gating
1. **Structure Page (`/admin/structure`)**:
   - `+ Category`: Gated by `structure:category:create`.
   - Category Edit/Rename: Gated by `structure:category:update`.
   - Category Visibility Toggle: Gated by `structure:category:toggle-visibility`.
   - Category Delete: Gated by `structure:category:delete`.
   - `+ Section`: Gated by `structure:section:create`.
   - Section Edit/Rename: Gated by `structure:section:update`.
   - Section Visibility Toggle: Gated by `structure:section:toggle-visibility`.
   - Section Delete: Gated by `structure:section:delete`.
   - `+ Document`: Gated by `content:create`.
2. **Document Viewer (`DocumentView.tsx`)**:
   - Edit Document button: Gated by `content:update:*` or contributor status.
   - Version History button: Gated by `content:versions:read`.
   - Version Restore button: Gated by `content:versions:restore`.
   - Export / Copy / Print: Gated by `content:export` (or read permission).
3. **Document Editor (`DocumentEditor.tsx`)**:
   - Import Word/PDF button: Gated by `content:import:file`.
   - Owner dropdown: Gated by `content:manage:ownership` (displays read-only chip if missing).
   - Contributors picker: Gated by `content:manage:contributors` (displays read-only chip list if missing).
   - Save / Create: Gated by `content:create` (new) or `content:update:*` (existing).
4. **Roles Management (`/admin/roles`)**:
   - Renders updated `PERMISSION_LABELS` dynamically in grouped cards with tier badges (`own`, `dept`, `all`) and capability descriptions.

---

## 5. Verification & Testing Protocol

1. **Static Analysis & Type Checking**:
   - Execute `npx tsc --noEmit` on `knowledge-base-backend` (Must return 0 errors).
   - Execute `npx tsc --noEmit` on `knowledge-base-frontend-` (Must return 0 errors).
2. **Runtime Verification**:
   - Verify role migration accurately populates admin and expands legacy permissions without error.
   - Verify unauthorized actions return HTTP 403 with exact permission name.
   - Verify UI elements hide/disable appropriately when permissions are missing.
