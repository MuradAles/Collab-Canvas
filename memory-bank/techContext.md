# CollabCanvas - Technical Context

## Technology Stack

### Frontend Technologies
- **React 19**: UI framework with latest features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Build tool and dev server for fast development
- **Konva.js**: High-performance 2D canvas rendering
- **React-Konva**: React bindings for Konva.js
- **Tailwind CSS**: Utility-first CSS framework

### Backend Technologies
- **Firebase Authentication**: User management and authentication
- **Cloud Firestore**: Document database for persistent shape data
- **Firebase Realtime Database**: Real-time cursor positions and presence
- **Firebase Hosting**: Static site hosting and CDN

### Development Tools
- **Vitest**: Unit testing framework
- **Testing Library**: Component testing utilities
- **ESLint**: Code linting and formatting
- **jsdom**: DOM simulation for testing

## Development Setup

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: Package manager
- **Firebase CLI**: For deployment and emulators
- **Git**: Version control

### Environment Configuration
```bash
# Required environment variables
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

### Firebase Project Setup
1. **Authentication**: Enable Email/Password and Google sign-in
2. **Firestore**: Create database in production mode
3. **Realtime Database**: Create database for cursors
4. **Hosting**: Configure for static site deployment

## Project Structure

### Source Code Organization
```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Canvas/         # Canvas and shape components
│   ├── Collaboration/  # Cursor and presence components
│   └── Layout/         # Layout components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── services/           # Firebase service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and constants
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

### Key Files and Their Purpose
- **`src/App.tsx`**: Main app component with authentication routing
- **`src/contexts/AuthContext.tsx`**: Authentication state management
- **`src/contexts/CanvasContext.tsx`**: Canvas state and real-time sync
- **`src/services/firebase.ts`**: Firebase configuration and initialization
- **`src/services/canvas.ts`**: Firestore operations for shapes
- **`src/services/presence.ts`**: Realtime Database operations for presence
- **`src/types/index.ts`**: TypeScript type definitions

## Database Schema

### Firestore Collections
**Collection**: `canvas`
**Document**: `global-canvas-v1`
```typescript
interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  lastUpdated: number;
}

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokePosition: 'inside' | 'center' | 'outside';
  cornerRadius: number;
  isLocked: boolean;
  lockedBy: string | null;
  lockedByName: string | null;
}
```

### Realtime Database Structure
**Path**: `/sessions/global-canvas-v1/{userId}`
```typescript
interface CursorData {
  displayName: string;
  cursorColor: string;
  cursorX: number; // Canvas-relative coordinates
  cursorY: number; // Canvas-relative coordinates
  lastSeen: number;
}
```

## Performance Considerations

### Canvas Rendering
- **Konva.js**: Hardware-accelerated 2D rendering
- **React.memo**: Prevents unnecessary re-renders
- **Efficient updates**: Only redraw changed objects
- **Target**: 60 FPS with 500+ shapes

### Real-Time Sync
- **Firestore**: <100ms for shape changes
- **Realtime Database**: <50ms for cursor updates
- **Throttling**: Cursor updates limited to 20-30 FPS
- **Optimistic updates**: Immediate local feedback

### Memory Management
- **Cleanup**: Unsubscribe from listeners on unmount
- **Lock cleanup**: Auto-release locks on disconnect
- **Efficient data structures**: Minimal object creation

## Security Configuration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Realtime Database Rules
```json
{
  "rules": {
    "sessions": {
      "$canvasId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
}
```

## Testing Strategy

### Unit Testing
- **Framework**: Vitest
- **Coverage**: Services, contexts, utilities
- **Mocking**: Firebase services for isolated testing
- **Target**: 80%+ code coverage

### Integration Testing
- **Multi-user scenarios**: Test real-time sync
- **Firebase emulators**: Local testing environment
- **End-to-end flows**: Complete user journeys

### Test Files
- `tests/unit/services/auth.test.ts`: Authentication tests
- `tests/unit/services/canvas.test.ts`: Canvas operations tests
- `tests/unit/contexts/CanvasContext.test.tsx`: Context tests
- `tests/unit/utils/helpers.test.ts`: Utility function tests

## Build and Deployment

### Development
```bash
npm run dev          # Start development server
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Lint code
```

### Production Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Firebase Deployment
```bash
firebase login                    # Login to Firebase
firebase init hosting            # Initialize hosting
firebase deploy --only hosting   # Deploy to Firebase Hosting
firebase deploy --only firestore:rules  # Deploy security rules
firebase deploy --only database  # Deploy database rules
```

## Dependencies

### Production Dependencies
```json
{
  "firebase": "^12.4.0",
  "konva": "^10.0.2",
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-konva": "^19.0.10",
  "tailwindcss": "^4.1.14"
}
```

### Development Dependencies
```json
{
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "eslint": "^9.36.0",
  "jsdom": "^27.0.0",
  "typescript": "~5.9.3",
  "vite": "^7.1.7",
  "vitest": "^3.2.4"
}
```

## Known Technical Constraints

### Browser Support
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Not optimized (desktop-focused)

### Performance Limits
- **Shapes**: 500+ shapes supported
- **Users**: 5+ concurrent users
- **Sync**: <100ms for shape changes
- **Cursors**: <50ms for position updates

### Firebase Limits
- **Firestore**: 1M reads/day (free tier)
- **Realtime Database**: 100 concurrent connections (free tier)
- **Hosting**: 10GB storage (free tier)

## Troubleshooting

### Common Issues
1. **Firebase persistence warnings**: Normal for multiple tabs
2. **TypeScript errors**: Ensure all dependencies installed
3. **Build errors**: Clear cache and rebuild
4. **Test failures**: Ensure jsdom is installed

### Debug Tools
- **Firebase Emulator Suite**: Local development
- **React DevTools**: Component debugging
- **Konva DevTools**: Canvas debugging
- **Browser DevTools**: Performance profiling
