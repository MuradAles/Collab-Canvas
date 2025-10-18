# CollabCanvas - Project Brief

## Project Overview
CollabCanvas is a real-time collaborative design tool that allows multiple users to create and manipulate shapes together on a shared canvas. This is an MVP (Minimum Viable Product) focused on establishing a solid multiplayer foundation with basic canvas functionality.

## Core Mission
Build a multiplayer canvas application where users can collaborate in real-time, creating and editing shapes simultaneously without conflicts.

## Key Requirements

### MVP Scope
- **Single Global Canvas**: All authenticated users share one 5000x5000px canvas
- **Real-Time Collaboration**: Multiple users can work simultaneously with <100ms sync
- **Shape Management**: Create, select, move, and delete rectangles
- **Object Locking**: First user to drag locks the object, preventing conflicts
- **Multiplayer Cursors**: See other users' cursors with names and unique colors
- **Presence Awareness**: Know who's online and actively collaborating
- **Authentication**: Email/password and Google OAuth sign-in
- **Persistence**: All changes saved and persist across sessions

### Technical Constraints
- **Performance**: 60 FPS during all interactions
- **Sync Latency**: Shape changes <100ms, cursor updates <50ms
- **Scale**: Support 500+ shapes and 5+ concurrent users
- **Platform**: Desktop-focused (mobile optimization out of scope)

## Success Criteria
1. Two users can edit simultaneously in different browsers
2. Page refresh mid-edit preserves all state
3. Multiple shapes created rapidly sync without visible lag
4. Locking works correctly - only one user can move an object at a time
5. 60 FPS maintained during all interactions
6. Deployed and accessible via public URL

## Phase 2: Advanced Features (In Planning)
- ✅ **Projects & Pages**: Multi-project workspace with permissions
- ✅ **Grouping**: Figma-style shape grouping with hierarchy
- ✅ **Endless Canvas**: 100,000 x 100,000 canvas with viewport culling
- 📋 Comprehensive PRD and task lists created
- 🎯 Implementation starting with Projects & Pages

## Out of Scope
- Undo/redo (future)
- Mobile support (future)
- Project templates (future)
- Version history (future)

## Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Konva.js, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **Deployment**: Firebase Hosting
- **Testing**: Vitest, Testing Library

## Current Status
The project is **MVP COMPLETE** with all 9 PRs finished:
- ✅ Project Setup & Firebase Configuration
- ✅ Authentication System  
- ✅ Basic Canvas Rendering
- ✅ Shape Creation & Manipulation
- ✅ Real-Time Synchronization
- ✅ Multiplayer Cursors
- ✅ User Presence System
- ✅ Testing & Polish
- ✅ Production Deployment

**Status**: Ready for production deployment and Phase 2 planning.
