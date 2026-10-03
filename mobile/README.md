# SafeHer Mobile App 🛡️

A comprehensive women's safety mobile application built with React Native and Expo.

## 🌟 Features

### ✅ Completed Features
- **Authentication System**
  - User registration and login
  - Secure token-based authentication
  - Auto-login with stored credentials
  - Google sign-in ready (UI complete)

- **Emergency SOS**
  - Large, highly visible red SOS button
  - Confirmation dialog before triggering alert
  - Integration with backend emergency API
  - Real-time location sharing (ready for integration)

- **Emergency Contacts Management**
  - Add/Edit/Delete emergency contacts
  - View all contacts with avatars and relationship tags
  - Beautiful card-based UI
  - Pull-to-refresh functionality

- **Emergency History**
  - View past SOS alerts
  - Status tracking (Active/Resolved)
  - Location and timestamp information
  - Resolve emergencies from the app

- **User Profile**
  - View profile information
  - Statistics dashboard
  - Settings menu structure
  - Logout functionality

- **Modern UI/UX**
  - Deep Purple & Pink gradient theme
  - Card-based design with shadows
  - Smooth animations and transitions
  - Bottom tab navigation
  - Dark status bar styling

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Backend server running

### Installation

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API URL:**
   - Open `src/utils/constants.js`
   - Update `API_URL` with your backend server address:
   ```javascript
   export const API_URL = 'http://YOUR_LOCAL_IP:3000/api';
   ```

4. **Find your local IP:**
   - **Windows:** `ipconfig` (look for IPv4 Address)
   - **Mac/Linux:** `ifconfig` (look for inet)

5. **Start the backend server:**
   ```bash
   cd ../backend
   npm start
   ```

6. **Start Expo development server:**
   ```bash
   cd ../mobile
   npm start
   ```

7. **Open on your phone:**
   - Scan QR code with Expo Go (Android) or Camera (iOS)
   - Ensure phone and computer are on the same WiFi

## 📱 App Structure

```
mobile/
├── App.js                      # Main app entry point
├── src/
│   ├── navigation/
│   │   ├── AuthNavigator.js   # Login/Signup navigation
│   │   └── MainNavigator.js   # Bottom tab navigation
│   ├── screens/
│   │   ├── LoginScreen.js     # User login
│   │   ├── SignupScreen.js    # User registration
│   │   ├── DashboardScreen.js # Home with SOS button
│   │   ├── ContactsScreen.js  # Emergency contacts CRUD
│   │   ├── HistoryScreen.js   # Emergency alerts history
│   │   └── ProfileScreen.js   # User profile & settings
│   ├── context/
│   │   └── AuthContext.js     # Authentication state management
│   ├── services/
│   │   └── api.js             # API calls & Axios config
│   ├── utils/
│   │   └── constants.js       # Colors, spacing, API URL
│   └── components/            # Reusable components (future)
└── package.json
```

## 🎨 Design System

### Colors
```javascript
Primary: #6D28D9    // Deep Purple
Secondary: #DB2777   // Vibrant Pink
Background: #F9FAFB  // Off-white
Card: #FFFFFF        // White with elevation
SOS: #DC2626         // Emergency Red
```

### Components
- **Cards:** White background with `elevation: 3` shadow
- **Buttons:** Rounded corners (12px), bold text
- **Inputs:** Light gray background, 1px border
- **Spacing:** 8px base unit (xs, sm, md, lg, xl, xxl)
- **Border Radius:** 8, 12, 16, 24, full (9999)

## 🔌 API Integration

The app connects to the following backend endpoints:

### Auth
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Emergency Contacts
- `GET /api/emergency-Contact` - Get all contacts
- `POST /api/emergency-Contact` - Create contact
- `PUT /api/emergency-Contact/:id` - Update contact
- `DELETE /api/emergency-Contact/:id` - Delete contact

### Emergency (SOS)
- `POST /api/emergency/trigger` - Trigger SOS alert
- `PUT /api/emergency/:id/resolve` - Resolve emergency

### Notifications
- `GET /api/notifications/:contactId` - Get alerts for contact

## 🔧 Troubleshooting

### "Connection Failed" Error
1. ✅ Backend server is running on port 3000
2. ✅ `API_URL` in constants.js uses your local IP, not 'localhost'
3. ✅ Phone and computer are on same WiFi network
4. ✅ Firewall allows port 3000

### Navigation Errors
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### AsyncStorage Warnings
- These are safe to ignore or install the correct Expo version:
  ```bash
  npx expo install @react-native-async-storage/async-storage
  ```

## 📦 Dependencies

```json
{
  "expo": "~57.0.26",
  "react": "19.2.3",
  "react-native": "0.86.3",
  "@react-navigation/native": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "axios": "^1.20.0",
  "@react-native-async-storage/async-storage": "^1.x"
}
```

## 🎯 Next Steps for Hackathon

### Phase 1: Core Features ✅ (DONE)
- [x] Authentication (Login/Signup)
- [x] SOS Button with API integration
- [x] Emergency Contacts Management
- [x] History Tracking
- [x] Bottom Tab Navigation
- [x] Modern UI/UX

### Phase 2: Enhanced Safety Features
- [ ] Real-time GPS location tracking
- [ ] Socket.IO integration for live updates
- [ ] Twilio SMS integration
- [ ] Push notifications
- [ ] Background location tracking

### Phase 3: Advanced Features
- [ ] Safe places/routes mapping
- [ ] Fake call feature
- [ ] Voice-activated SOS
- [ ] Shake to alert
- [ ] Safe timer with auto-alert
- [ ] Community safety reports

### Phase 4: Polish
- [ ] Onboarding flow
- [ ] App tutorial
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Analytics integration

## 🧪 Testing

```bash
# Start the app
npm start

# Test on physical device
# Use Expo Go app to scan QR code

# Test authentication
1. Sign up with new account
2. Logout
3. Login with same credentials

# Test contacts
1. Add emergency contact
2. Edit contact details
3. Delete contact

# Test SOS
1. Press SOS button
2. Confirm alert
3. Check backend logs
```

## 📱 Screenshots

*Add screenshots here after app is running*

## 🤝 Team

Built for [Your Hackathon Name] by [Your Team Name]

## 📄 License

MIT License - feel free to use this for your hackathon and beyond!

## 🆘 Support

For issues or questions:
- Check backend logs: `cd backend && npm start`
- Check Expo logs in terminal
- Review API responses in network tab
- Post in hackathon Discord/Slack

---

Made with ❤️ for women's safety
