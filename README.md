# CollabCanvas - Real-Time Collaborative Design Tool

A multiplayer canvas application where users can create and manipulate shapes together in real-time. Built with React, TypeScript, Firebase, and Konva.js.

## 🚀 Features

- **Real-Time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Shape Creation**: Click-and-drag to create rectangles on the canvas
- **Object Locking**: First user to drag a shape locks it, preventing conflicts
- **Multiplayer Cursors**: See where other users are pointing with colored cursors
- **Presence Awareness**: Know who's online and actively collaborating
- **Pan & Zoom**: Navigate a large 5000x5000px canvas with smooth controls
- **Persistent State**: All changes are saved and persist across sessions
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

Update `.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

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
│   │   ├── Auth/          # Authentication components
│   │   ├── Canvas/        # Canvas and shape components
│   │   ├── Collaboration/ # Cursor and presence components
│   │   └── Layout/        # Layout components (Navbar)
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Firebase service integrations
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions and constants
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── tests/                 # Test files
│   ├── setup.ts          # Test configuration
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── public/                # Static assets
├── .env                   # Environment variables (not in git)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🎯 MVP Features

### Canvas Features
- ✅ 5000x5000px bounded canvas
- ✅ Pan and zoom navigation
- ✅ 60 FPS performance target

### Shape Management
- ✅ Rectangle creation via click-and-drag
- ✅ Shape selection and movement
- ✅ Delete shapes with Delete/Backspace key
- ✅ Fixed gray fill color (#cccccc)

### Real-Time Collaboration
- ✅ Shape synchronization (<100ms)
- ✅ Object locking on drag
- ✅ Visual lock indicators
- ✅ Conflict-free concurrent editing

### Multiplayer Features
- ✅ Live cursor tracking (<50ms)
- ✅ Unique cursor colors per user
- ✅ Presence awareness (who's online)
- ✅ Canvas-relative cursor coordinates

### Authentication
- ✅ Email/password registration
- ✅ Google OAuth sign-in
- ✅ Persistent sessions

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

- **Single Global Canvas**: All users share one canvas (multi-project support coming in Phase 2)
- **Rectangles Only**: Only rectangle shapes supported in MVP
- **No Undo/Redo**: History/versioning not implemented yet
- **Desktop Only**: Not optimized for mobile/tablet devices
- **No Shape Styling**: Fixed gray color only

## 🤝 Contributing

This is an MVP project. See `PRD.md` and `tasks.md` for development roadmap and task breakdown.

## 📄 License

[Add your license here]

## 🆘 Troubleshooting

### Firebase Persistence Warnings

If you see warnings about Firebase persistence:
- "Multiple tabs open" - This is normal, persistence works in one tab
- "Not supported" - Your browser doesn't support offline persistence

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

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for real-time collaboration**
