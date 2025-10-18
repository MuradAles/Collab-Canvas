# Tasks: Projects & Pages System

## Relevant Files

### New Files to Create
- `src/components/Projects/ProjectsHome.tsx` - Homepage with project grid
- `src/components/Projects/ProjectCard.tsx` - Individual project card component
- `src/components/Projects/ProjectModal.tsx` - Create/edit project modal
- `src/components/Projects/InviteModal.tsx` - Generate invite links modal
- `src/components/Projects/MembersList.tsx` - Project members management
- `src/components/Projects/PageSelector.tsx` - Page dropdown selector
- `src/contexts/ProjectContext.tsx` - Project state management
- `src/services/projects.ts` - Project CRUD operations
- `src/services/invites.ts` - Invite code generation and validation
- `src/hooks/useProjectPermissions.ts` - Permission checking hook

### Files to Modify
- `src/App.tsx` - Add routing for projects homepage
- `src/components/Layout/Navbar.tsx` - Add project/page dropdowns
- `src/contexts/AuthContext.tsx` - Add user projects list
- `src/contexts/CanvasContext.tsx` - Update to work with project pages
- `src/services/canvas.ts` - Update paths to project/page structure
- `src/services/ai/openai.ts` - Scope AI to current page
- `src/types/index.ts` - Add Project, Page, InviteCode types
- `firestore.rules` - Add security rules for projects

### Test Files
- `tests/unit/services/projects.test.ts` - Project operations tests
- `tests/unit/services/invites.test.ts` - Invite system tests
- `tests/unit/hooks/useProjectPermissions.test.ts` - Permission hook tests

---

## Tasks

- [ ] **1.0 Database Schema & Types**
  - [ ] 1.1 Update `src/types/index.ts` with new interfaces (Project, ProjectMember, Page, InviteCode)
  - [ ] 1.2 Add CANVAS_BOUNDS constant to `src/utils/constants.ts` (for future endless canvas)
  - [ ] 1.3 Design Firestore schema structure (projects collection, pages subcollection, invites collection)
  - [ ] 1.4 Update `firestore.rules` with security rules for projects, pages, and invites
  - [ ] 1.5 Create migration plan for existing canvas data (fresh start, ignore old data)

- [ ] **2.0 Project Service Layer**
  - [ ] 2.1 Create `src/services/projects.ts` with CRUD functions
  - [ ] 2.2 Implement `createProject(name, description, ownerId)` function
  - [ ] 2.3 Implement `getProject(projectId)` function
  - [ ] 2.4 Implement `getUserProjects(userId)` function
  - [ ] 2.5 Implement `updateProject(projectId, updates)` function
  - [ ] 2.6 Implement `deleteProject(projectId)` function
  - [ ] 2.7 Implement `addMember(projectId, userId, role)` function
  - [ ] 2.8 Implement `removeMember(projectId, userId)` function
  - [ ] 2.9 Implement `updateMemberRole(projectId, userId, newRole)` function
  - [ ] 2.10 Add error handling and type safety
  - [ ] 2.11 Write unit tests for project service

- [ ] **3.0 Page Management**
  - [ ] 3.1 Add page functions to `src/services/projects.ts`
  - [ ] 3.2 Implement `createPage(projectId, name)` function with default "Page 1"
  - [ ] 3.3 Implement `getPages(projectId)` function
  - [ ] 3.4 Implement `renamePage(projectId, pageId, newName)` function
  - [ ] 3.5 Implement `deletePage(projectId, pageId)` function with safeguards (can't delete last page)
  - [ ] 3.6 Implement page ordering logic
  - [ ] 3.7 Update canvas service to use project/page paths
  - [ ] 3.8 Write unit tests for page operations

- [ ] **4.0 Invite System**
  - [ ] 4.1 Create `src/services/invites.ts` for invite code logic
  - [ ] 4.2 Implement `generateInviteCode()` function (10 random characters, URL-safe)
  - [ ] 4.3 Implement `createInvite(projectId, permission, expiresIn)` function
  - [ ] 4.4 Implement `validateInviteCode(code)` function (check exists, not expired)
  - [ ] 4.5 Implement `joinProject(inviteCode, userId)` function
  - [ ] 4.6 Implement invite expiration calculation (1h, 12h, 24h, 7d, 30d, never)
  - [ ] 4.7 Add Firestore cleanup for expired invites (scheduled or on-demand)
  - [ ] 4.8 Write unit tests for invite system

- [ ] **5.0 Project Context**
  - [ ] 5.1 Create `src/contexts/ProjectContext.tsx` for project state
  - [ ] 5.2 Define ProjectContext interface (currentProject, currentPage, userRole, projects list)
  - [ ] 5.3 Implement project provider with Firebase listeners
  - [ ] 5.4 Add `selectProject(projectId)` function
  - [ ] 5.5 Add `selectPage(pageId)` function
  - [ ] 5.6 Subscribe to real-time project updates (members, metadata)
  - [ ] 5.7 Create `useProject()` hook for consuming context
  - [ ] 5.8 Handle project switching (cleanup listeners)

- [ ] **6.0 Permission System**
  - [ ] 6.1 Create `src/hooks/useProjectPermissions.ts` hook
  - [ ] 6.2 Implement `canView()` check (all roles)
  - [ ] 6.3 Implement `canEdit()` check (edit + admin roles)
  - [ ] 6.4 Implement `canInvite()` check (admin only)
  - [ ] 6.5 Implement `canManageMembers()` check (admin only)
  - [ ] 6.6 Implement `isOwner()` check
  - [ ] 6.7 Add permission-based UI rendering helpers
  - [ ] 6.8 Write unit tests for permission checks

- [ ] **7.0 Projects Homepage**
  - [ ] 7.1 Create `src/components/Projects/ProjectsHome.tsx` component
  - [ ] 7.2 Implement project grid layout (3-4 cards per row)
  - [ ] 7.3 Add "New Project" button prominently
  - [ ] 7.4 Fetch user's projects from Firestore on mount
  - [ ] 7.5 Add loading skeleton while fetching projects
  - [ ] 7.6 Handle empty state ("No projects yet, create your first!")
  - [ ] 7.7 Add special "Global Canvas" card with distinct styling
  - [ ] 7.8 Implement project card click → navigate to project

- [ ] **8.0 Project Card Component**
  - [ ] 8.1 Create `src/components/Projects/ProjectCard.tsx` component
  - [ ] 8.2 Display project thumbnail (placeholder image or actual canvas preview)
  - [ ] 8.3 Display project name, member count, last updated date
  - [ ] 8.4 Add hover effects and click interaction
  - [ ] 8.5 Show user's role badge (View/Edit/Admin/Owner)
  - [ ] 8.6 Add context menu for admin actions (rename, delete, settings)
  - [ ] 8.7 Style Global Canvas card differently

- [ ] **9.0 Project Creation Modal**
  - [ ] 9.1 Create `src/components/Projects/ProjectModal.tsx` component
  - [ ] 9.2 Add form with project name input (optional, max 100 chars)
  - [ ] 9.3 Add description textarea (optional, max 500 chars)
  - [ ] 9.4 Implement "Create Project" button with loading state
  - [ ] 9.5 Default project name to "Untitled Project" if empty
  - [ ] 9.6 Create default "Page 1" when project is created
  - [ ] 9.7 Add current user as owner with admin role
  - [ ] 9.8 Redirect to new project after creation
  - [ ] 9.9 Handle errors and show user-friendly messages

- [ ] **10.0 Invite Modal**
  - [ ] 10.1 Create `src/components/Projects/InviteModal.tsx` component
  - [ ] 10.2 Add permission selector (radio buttons: View/Edit/Admin)
  - [ ] 10.3 Add expiration selector (radio buttons: 1h, 12h, 24h, 7d, 30d, never)
  - [ ] 10.4 Implement "Generate Link" button
  - [ ] 10.5 Display generated link in copyable text field
  - [ ] 10.6 Add "Copy Link" button with clipboard API
  - [ ] 10.7 Add "Copy Code" button (just the 10-char code)
  - [ ] 10.8 Show success toast when copied
  - [ ] 10.9 Store invite in Firestore when generated
  - [ ] 10.10 Handle errors gracefully

- [ ] **11.0 Join Project Flow**
  - [ ] 11.1 Create `/join/:inviteCode` route in App.tsx
  - [ ] 11.2 Create JoinProject component to handle invite links
  - [ ] 11.3 Validate invite code when user arrives (check exists, not expired)
  - [ ] 11.4 If not logged in, redirect to login with return URL
  - [ ] 11.5 After login, automatically join project with invite code
  - [ ] 11.6 Add user to project members with specified role
  - [ ] 11.7 Redirect user to project after successful join
  - [ ] 11.8 Handle invalid/expired codes with error message
  - [ ] 11.9 Handle already-member case (redirect to project)

- [ ] **12.0 Members List Component**
  - [ ] 12.1 Create `src/components/Projects/MembersList.tsx` component
  - [ ] 12.2 Display list of project members with avatars, names, emails
  - [ ] 12.3 Show each member's role badge
  - [ ] 12.4 Show "last seen" timestamp
  - [ ] 12.5 Add role dropdown for admins (change member permissions)
  - [ ] 12.6 Add "Kick Member" button for admins (with confirmation)
  - [ ] 12.7 Prevent owner from being kicked
  - [ ] 12.8 Real-time updates when members join/leave
  - [ ] 12.9 Only show management controls to admins

- [ ] **13.0 Page Selector**
  - [ ] 13.1 Create `src/components/Projects/PageSelector.tsx` component
  - [ ] 13.2 Implement dropdown showing list of pages
  - [ ] 13.3 Add "Add Page" button in dropdown
  - [ ] 13.4 Implement page selection (updates ProjectContext)
  - [ ] 13.5 Add right-click context menu on pages (Rename, Delete)
  - [ ] 13.6 Implement rename page inline edit or modal
  - [ ] 13.7 Implement delete page with confirmation
  - [ ] 13.8 Prevent deleting last page (show error)
  - [ ] 13.9 Add scrollable list if many pages (max height)
  - [ ] 13.10 Show current page with checkmark or highlight

- [ ] **14.0 Navbar Integration**
  - [ ] 14.1 Update `src/components/Layout/Navbar.tsx` with new layout
  - [ ] 14.2 Add Project dropdown selector (left side after logo)
  - [ ] 14.3 Add Page dropdown selector (next to Project dropdown)
  - [ ] 14.4 Project dropdown shows user's projects + Global Canvas + "New Project"
  - [ ] 14.5 Page dropdown only shows if project is selected
  - [ ] 14.6 Update navbar to work without project (on homepage)
  - [ ] 14.7 Add search functionality to project dropdown (if many projects)
  - [ ] 14.8 Style dropdowns consistently with existing UI

- [ ] **15.0 Canvas Context Updates**
  - [ ] 15.1 Update `src/contexts/CanvasContext.tsx` to accept project/page IDs
  - [ ] 15.2 Change Firestore path from `canvas/global-canvas-v1` to `projects/{projectId}/pages/{pageId}`
  - [ ] 15.3 Update shape listeners to use new path
  - [ ] 15.4 Clear shapes when switching pages
  - [ ] 15.5 Handle loading state when switching pages
  - [ ] 15.6 Update all shape operations to work with new structure
  - [ ] 15.7 Test real-time sync still works correctly

- [ ] **16.0 Global Canvas Setup**
  - [ ] 16.1 Create special "global-canvas" project in Firestore (manual or automatic)
  - [ ] 16.2 Set project as accessible to all authenticated users
  - [ ] 16.3 Give all users "edit" permission (no admins)
  - [ ] 16.4 Prevent deletion of Global Canvas project
  - [ ] 16.5 Display Global Canvas card on homepage (always first)
  - [ ] 16.6 Style differently to indicate special status
  - [ ] 16.7 Update security rules to allow all auth users to edit

- [ ] **17.0 AI Context Scoping**
  - [ ] 17.1 Update `src/services/ai/openai.ts` to use current page shapes only
  - [ ] 17.2 Clear AI conversation history when switching pages
  - [ ] 17.3 Update AI system prompt with page context
  - [ ] 17.4 Test AI commands only affect current page shapes
  - [ ] 17.5 Update AIPanel to show current page name

- [ ] **18.0 Routing & Navigation**
  - [ ] 18.1 Update `src/App.tsx` with new routes
  - [ ] 18.2 Add route for projects homepage: `/`
  - [ ] 18.3 Add route for project canvas: `/project/:projectId/page/:pageId`
  - [ ] 18.4 Add route for join invite: `/join/:inviteCode`
  - [ ] 18.5 Add route for Global Canvas: `/global`
  - [ ] 18.6 Implement navigation guards (check permissions)
  - [ ] 18.7 Handle 404 for invalid project/page IDs
  - [ ] 18.8 Preserve URL state on page refresh

- [ ] **19.0 Testing & Bug Fixes**
  - [ ] 19.1 Test project creation flow end-to-end
  - [ ] 19.2 Test invite generation and joining
  - [ ] 19.3 Test all three permission levels (View, Edit, Admin)
  - [ ] 19.4 Test page creation, renaming, deletion
  - [ ] 19.5 Test member management (add, remove, change role)
  - [ ] 19.6 Test Global Canvas access
  - [ ] 19.7 Test multi-user collaboration in project
  - [ ] 19.8 Test AI commands scoped to page
  - [ ] 19.9 Test edge cases (expired invites, invalid codes, last page deletion)
  - [ ] 19.10 Fix any bugs discovered during testing

- [ ] **20.0 Polish & Documentation**
  - [ ] 20.1 Add loading skeletons for all async operations
  - [ ] 20.2 Add empty states for projects, pages, members
  - [ ] 20.3 Improve error messages and user feedback
  - [ ] 20.4 Add tooltips for permission-based features
  - [ ] 20.5 Add keyboard shortcuts for common actions (N for new project)
  - [ ] 20.6 Update tutorial with projects/pages navigation
  - [ ] 20.7 Add JSDoc comments to all new functions
  - [ ] 20.8 Update README with new features
  - [ ] 20.9 Create user guide for projects and invites
  - [ ] 20.10 Test accessibility (keyboard nav, screen readers)

---

## Estimated Timeline
- **Total Time**: 15-20 hours
- **Phase 1** (Tasks 1-6): Database & Core Services - 4-5 hours
- **Phase 2** (Tasks 7-12): UI Components - 5-6 hours
- **Phase 3** (Tasks 13-18): Integration & Navigation - 4-5 hours
- **Phase 4** (Tasks 19-20): Testing & Polish - 2-4 hours

## Dependencies
- Tasks 1-4 must be completed first (foundation)
- Tasks 5-6 depend on tasks 1-4
- Tasks 7-17 can be done in parallel after foundation
- Task 18 depends on all UI components being ready
- Tasks 19-20 are final steps

## Notes
- Start with fresh Global Canvas (ignore existing canvas data)
- Prioritize core functionality over polish
- Test with multiple users throughout development
- Monitor Firestore reads/writes (stay within quotas)

