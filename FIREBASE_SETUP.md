# Firebase Setup Guide

## ✅ Completed Setup

### Security Rules Deployed

1. **Firestore Rules** (`firestore.rules`)
   - Allows authenticated users to read/write to `canvas` collection
   - All authenticated users can access the global canvas

2. **Realtime Database Rules** (`database.rules.json`)
   - `/locks/{canvasId}/{shapeId}` - For shape locking during drag
   - `/sessions/{canvasId}/{userId}` - For cursor positions and presence (PR #6 & #7)

3. **Firebase Configuration** (`firebase.json`)
   - Links Firestore and Realtime Database rules
   - Configured for Firebase Hosting

4. **Project Link** (`.firebaserc`)
   - Project: `collab-canvas-6a933`
   - Auto-configured for deployments

## 🔐 Current Security Rules

### Firestore (Canvas Data)
```
- Collection: canvas/global-canvas-v1
- Access: All authenticated users can read and write
- Purpose: Store shapes, positions, and lock states
```

### Realtime Database (Cursors & Presence)
```
- Path: locks/{canvasId}/{shapeId}
  - Read/Write: All authenticated users
  - Purpose: Shape locking during drag operations

- Path: sessions/{canvasId}/{userId}
  - Read: All authenticated users
  - Write: Only the user can write their own data
  - Purpose: Cursor positions and presence (PR #6 & #7)
```

## 🚀 How to Test

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open two browser windows:**
   - Window 1: http://localhost:5173
   - Window 2: http://localhost:5173 (incognito/private mode)

3. **Test real-time sync:**
   - Log in with different accounts in each window
   - Create shapes in one window → should appear in the other
   - Drag a shape in one window → should move in the other
   - Try dragging the same shape from both windows → locking should work!

## 🔥 Firebase Commands

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules,database
```

### Deploy Everything (including hosting)
```bash
firebase deploy
```

### View Firebase Console
https://console.firebase.google.com/project/collab-canvas-6a933/overview

## 📝 Files Created

- `firestore.rules` - Firestore security rules
- `database.rules.json` - Realtime Database security rules  
- `firebase.json` - Firebase configuration
- `firestore.indexes.json` - Firestore indexes (empty for now)
- `.firebaserc` - Project link configuration

## 🎯 What's Working Now

✅ User authentication (email/password + Google)
✅ Canvas rendering with pan/zoom
✅ Shape creation (rectangles, circles, text)
✅ Real-time shape synchronization
✅ Object locking on drag
✅ Visual lock indicators
✅ Loading states
✅ Offline persistence

## 🚧 Next Steps (PR #6 & #7)

- [ ] Multiplayer cursors with real-time tracking
- [ ] User presence system (who's online)
- [ ] Cursor positions synced via Realtime Database

## 🐛 Troubleshooting

### "Missing or insufficient permissions" error
- **Solution:** Rules have been deployed! If you still see this:
  1. Refresh your browser
  2. Log out and log back in
  3. Check Firebase Console to verify rules are active

### Can't deploy rules
```bash
# Login to Firebase
firebase login

# List projects
firebase projects:list

# Deploy rules
firebase deploy --only firestore:rules,database
```

### Need to update rules
1. Edit `firestore.rules` or `database.rules.json`
2. Run `firebase deploy --only firestore:rules,database`
3. Changes take effect immediately

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/project/collab-canvas-6a933)
- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)
- [Realtime Database Security Rules](https://firebase.google.com/docs/database/security)

