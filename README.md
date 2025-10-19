# CollabCanvas - Real-Time Collaborative Design Tool

A multiplayer canvas application where users can create and manipulate shapes together in real-time, powered by AI. Built with React, TypeScript, Firebase, Konva.js, and OpenAI.

**Status**: MVP Complete + AI Enhancement | Production Ready 🚀

## 🚀 Features

### Core Collaboration
- **Real-Time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Object Locking**: First user to drag a shape locks it, preventing conflicts
- **Multiplayer Cursors**: See where other users are pointing with colored cursors
- **Presence Awareness**: Know who's online and actively collaborating
- **Persistent State**: All changes are saved and persist across sessions

### Canvas & Shapes
- **Multiple Shape Types**: Rectangles, circles, lines, and text shapes
- **Shape Creation**: Click-and-drag to create shapes with instant preview
- **Full Styling**: Customize colors, borders, stroke width, corner radius, and more
- **Properties Panel**: Edit shape properties with live updates
- **Layers Panel**: Manage shape order, z-index, and visibility
- **Text Editing**: Double-click text to edit inline
- **Pan & Zoom**: Navigate a large 5000x5000px canvas with smooth controls
- **Keyboard Shortcuts**: Quick access to tools and commands

### AI-Powered Features 🤖
- **AI Canvas Agent**: Natural language commands to create and manipulate shapes
- **10 AI Tools**: Create, move, delete, resize, rotate, color, align, layer, style, and query shapes
- **Batch Operations**: Create and manipulate multiple shapes at once
- **Contextual Understanding**: AI remembers conversation context for follow-up commands
- **Real-Time Notifications**: See when others use AI commands

### User Experience
- **Light/Dark Themes**: Switch between themes with customizable colors
- **Settings Panel**: Personalize 7 theme colors with live preview
- **Tutorial System**: Built-in keyboard shortcuts guide
- **FPS Counter**: Monitor performance in real-time
- **Authentication**: Secure login with email/password or Google sign-in

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Konva.js** - Canvas rendering for high performance
- **Tailwind CSS** - Styling

### Backend
- **Firebase Authentication** - User management
- **Cloud Firestore** - Shape data persistence
- **Firebase Realtime Database** - Cursor positions and presence
- **Firebase Hosting** - Deployment
- **OpenAI GPT-4o Mini** - AI-powered canvas commands

### Testing
- **Vitest** - Unit testing framework
- **Testing Library** - Component testing

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase account** (free tier works)

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd collab-canvas
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new Firebase project
3. Enable the following services:
   - **Authentication**: Enable Email/Password and Google sign-in
   - **Cloud Firestore**: Create database in production mode
   - **Realtime Database**: Create database

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the Firebase config object

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update `.env` with your Firebase credentials and OpenAI API key:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# OpenAI Configuration (for AI Canvas Agent)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The AI Canvas Agent feature requires an OpenAI API key. You can get one at [platform.openai.com](https://platform.openai.com/api-keys). If you don't provide one, the app will still work but AI features will be disabled.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎨 Using the App

### Basic Canvas Operations
- **Create Shapes**: Select a tool (Rectangle, Circle, Line, or Text) and click-and-drag on the canvas
- **Move Shapes**: Click and drag any shape to move it
- **Edit Properties**: Click a shape to see its properties in the right panel
- **Delete Shapes**: Select a shape and press the Delete key
- **Pan Canvas**: Hold Ctrl (Cmd on Mac) and drag the canvas
- **Zoom**: Use the mouse wheel or zoom controls in the bottom-right

### AI Canvas Agent 🤖
Press **Cmd/Ctrl+K** to open the AI panel, then type natural language commands like:
- "Create 5 blue circles in a row"
- "Move all rectangles to the center"
- "Change the color of the selected shape to red"
- "Arrange all shapes in a grid"
- "Delete all circles"

The AI understands context, so you can have a conversation:
- "Create a red square" → "Make it bigger" → "Move it to the right"

### Theming & Settings
Click the **gear icon** in the navbar to:
- Switch between Light and Dark modes
- Customize 7 theme colors with color pickers or hex codes
- Preview changes in real-time
- Reset to default colors
- Your theme syncs across devices via Firebase

### Keyboard Shortcuts
- **Cmd/Ctrl+K**: Open AI panel
- **R**: Rectangle tool
- **C**: Circle tool
- **L**: Line tool
- **T**: Text tool
- **Delete**: Delete selected shape
- **+/-**: Zoom in/out
- **Ctrl+0**: Reset zoom
- **?**: Show tutorial

## 🧪 Testing

Run unit tests:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

Generate coverage report:

```bash
npm run test:coverage
```

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🚀 Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase in your project:

```bash
firebase init hosting
```

- Select your Firebase project
- Set `dist` as the public directory
- Configure as single-page app: Yes
- Don't overwrite index.html

4. Build and deploy:

```bash
npm run build
firebase deploy --only hosting
```

## 📁 Project Structure

```
collab-canvas/
├── src/
│   ├── components/         # React components
│   │   ├── AI/            # AI Canvas Agent components
│   │   │   ├── AICanvasIntegration.tsx
│   │   │   ├── AICommandsModal.tsx
│   │   │   ├── AIInput.tsx
│   │   │   ├── AIMessage.tsx
│   │   │   ├── AIPanel.tsx
│   │   │   └── AIToast.tsx
│   │   ├── Auth/          # Authentication components
│   │   ├── Canvas/        # Canvas and shape components
│   │   │   ├── shapes/    # Shape renderers
│   │   │   ├── properties/# Property panels
│   │   │   ├── Canvas.tsx
│   │   │   ├── LayersPanel.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── ...
│   │   ├── Collaboration/ # Cursor and presence components
│   │   └── Layout/        # Layout components
│   │       ├── Navbar.tsx
│   │       └── SettingsPanel.tsx
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── CanvasContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── PresenceContext.tsx
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Service integrations
│   │   ├── ai/           # AI service files
│   │   │   ├── openai.ts
│   │   │   ├── toolExecutor.ts
│   │   │   ├── positionParser.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── tools/    # AI tool implementations
│   │   │   └── types/    # AI type definitions
│   │   ├── firebase.ts
│   │   ├── canvas.ts
│   │   ├── presence.ts
│   │   └── aiNotifications.ts
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions and constants
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles with CSS variables
├── memory-bank/           # Project documentation
│   ├── projectbrief.md
│   ├── activeContext.md
│   ├── progress.md
│   └── ...
├── tasks/                 # Task lists and PRDs
├── ai-development/        # AI development logs
├── tests/                 # Test files
├── .env                   # Environment variables (not in git)
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── README.md             # This file
```

## 🎯 Features Completed

### Canvas Features
- ✅ 5000x5000px bounded canvas
- ✅ Pan and zoom navigation
- ✅ 60 FPS performance with 500+ shapes
- ✅ Grid system with toggle
- ✅ FPS counter for performance monitoring

### Shape Management
- ✅ Multiple shape types (rectangles, circles, lines, text)
- ✅ Click-and-drag creation with preview
- ✅ Shape selection and movement
- ✅ Delete shapes with Delete key
- ✅ Full color customization (fill and stroke)
- ✅ Properties panel for detailed editing
- ✅ Layers panel for z-index management
- ✅ Inline text editing with double-click
- ✅ Stroke width and position controls
- ✅ Corner radius for rectangles
- ✅ Rotation and resizing

### Real-Time Collaboration
- ✅ Shape synchronization (<100ms)
- ✅ Object locking on drag
- ✅ Visual lock indicators with user names
- ✅ Conflict-free concurrent editing
- ✅ Auto-release locks on disconnect

### Multiplayer Features
- ✅ Live cursor tracking (<50ms)
- ✅ Unique cursor colors per user
- ✅ Presence awareness (who's online)
- ✅ Canvas-relative cursor coordinates
- ✅ User list with avatars

### AI-Powered Features 🤖
- ✅ Natural language canvas commands
- ✅ 10 AI tools for shape manipulation
- ✅ Conversation memory (contextual commands)
- ✅ Rate limiting (10 cmd/min, 20 shapes/cmd)
- ✅ Real-time AI activity notifications
- ✅ Help panel with command reference
- ✅ Keyboard shortcut (Cmd/Ctrl+K)

### User Experience
- ✅ Light/Dark theme modes
- ✅ Customizable theme colors (7 colors)
- ✅ Settings panel with color pickers
- ✅ Tutorial with keyboard shortcuts
- ✅ Smooth panel animations

### Authentication
- ✅ Email/password registration
- ✅ Google OAuth sign-in
- ✅ Persistent sessions
- ✅ User profiles with display names

## 🔧 Configuration

### Canvas Constants

Key constants can be configured in `src/utils/constants.ts`:

- `CANVAS_WIDTH`: 5000px
- `CANVAS_HEIGHT`: 5000px
- `MIN_ZOOM`: 0.1
- `MAX_ZOOM`: 3
- `CURSOR_UPDATE_THROTTLE`: 50ms (20 FPS)
- `LOCK_TIMEOUT`: 5000ms (5 seconds)

## 🐛 Known Limitations

- **Single Global Canvas**: All users share one canvas (multi-project support planned in Phase 2)
- **No Undo/Redo**: History/versioning not implemented yet
- **Desktop Only**: Not optimized for mobile/tablet devices
- **AI Feature Costs**: OpenAI API usage incurs costs based on usage

## 🚀 Upcoming Features (Phase 2)

- **Projects & Pages System**: Multi-project workspace with permissions
- **Grouping System**: Figma-style shape grouping with hierarchy
- **Endless Canvas**: 100,000 x 100,000 canvas with viewport culling
- **Undo/Redo System**: Full history and versioning support
- **Mobile Optimization**: Responsive design for tablets and mobile devices

## 🤝 Contributing

This project has completed its MVP phase and includes AI-powered features. See the `memory-bank/` directory for comprehensive project documentation, and `tasks/` for development roadmap and Phase 2 planning.

### Current Status
- ✅ MVP Complete (All 9 PRs)
- ✅ AI Canvas Agent Feature Complete
- ✅ Theming System Complete
- ✅ 78 Tests Passing
- 📋 Phase 2 Planning Complete (Projects, Grouping, Endless Canvas)

## 📄 License

[Add your license here]

## 🆘 Troubleshooting

### Firebase Persistence Warnings

If you see warnings about Firebase persistence:
- "Multiple tabs open" - This is normal, persistence works in one tab
- "Not supported" - Your browser doesn't support offline persistence

### AI Features Not Working

If AI commands aren't working:
- Ensure you have set `VITE_OPENAI_API_KEY` in your `.env` file
- Check that you have OpenAI API credits available
- Rate limits: 10 commands/minute, 20 shapes per command
- Check browser console for detailed error messages

### TypeScript Errors

Make sure all dependencies are installed:

```bash
npm install
```

### Build Errors

Clear cache and rebuild:

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Testing Issues

If tests fail to run, ensure jsdom is installed:

```bash
npm install -D jsdom
```

### Performance Issues

If the canvas feels slow:
- Check the FPS counter (should be close to 60 FPS)
- Try reducing the number of shapes on the canvas
- Close other browser tabs
- Disable AI features if not needed (improves performance)

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for real-time collaboration**
