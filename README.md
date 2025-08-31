# 🔋 VOLT - Focus & Productivity App

**A powerful React Native app designed to help users maintain focus by blocking distracting apps and websites during work sessions.**

## 🏆 Hackathon Submission

This app was developed for the **Kiro Hackathon** with a focus on productivity enhancement and digital wellness.

## ✨ Key Features

### 🎯 **Core Functionality**
- **App Blocking**: Block distracting mobile applications during focus sessions
- **Website Blocking**: Block distracting websites and domains
- **Focus Sessions**: Timed focus sessions with customizable durations (15, 25, 45, 60 minutes)
- **Permanent Blocking**: Advanced blocking mode with 2-hour delay for disabling
- **Real-time Notifications**: Countdown notifications during active sessions

### 🔒 **Security & Anti-Bypass**
- **Uninstall Protection**: Prevents app removal during active sessions
- **No Delete Options**: Removed delete buttons to prevent easy bypass
- **Device Admin Integration**: Enhanced protection through Android device policies
- **Secure Storage**: Encrypted storage for sensitive user data

### 🎨 **User Experience**
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Dark/Light Theme**: Adaptive theming for better user experience
- **Haptic Feedback**: Enhanced interaction feedback
- **Progress Tracking**: Visual progress indicators for focus sessions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Android device or emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RONNYKD/volt-app.git
   cd volt-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Android Setup**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

4. **Run the app**
   ```bash
   # For development
   npx react-native run-android
   
   # For release build (recommended for testing)
   npx react-native run-android --mode=release
   ```

## 📱 App Screens & Navigation

### 🏠 **Main Screens**
1. **Focus Screen** - Start and manage focus sessions
2. **Blocks Screen** - Manage blocked apps and websites
3. **Profile Screen** - User settings and app configuration

### 🔐 **Authentication**
- User registration and login
- Secure session management
- Password recovery functionality

## 🛠 Technical Architecture

### **Frontend**
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Zustand** - State management
- **React Navigation** - Screen navigation
- **NativeWind** - Styling system

### **Backend & Storage**
- **Supabase** - Backend-as-a-Service for user data
- **AsyncStorage** - Local data persistence
- **Secure Storage** - Encrypted sensitive data storage

### **Native Modules**
- **App Blocking Service** - Native Android app blocking
- **Website Blocking Service** - Browser monitoring and blocking
- **Uninstall Protection** - Device admin integration
- **Notification Service** - Background notifications

## 🔧 Key Technical Implementations

### **Crash Prevention**
- Fixed MainActivity fragment restoration issues
- Proper app lifecycle management
- Error boundary implementations

### **Security Enhancements**
- Removed bypass mechanisms (delete buttons)
- Implemented permanent blocking with delays
- Secure token storage and encryption

### **Performance Optimizations**
- Efficient state management
- Optimized native module communications
- Background service management

## 📋 Testing Instructions for Judges

### **Basic Functionality Test**
1. **Install and Launch**: Install the app and complete initial setup
2. **Create Account**: Register or login to access features
3. **Start Focus Session**: 
   - Go to Focus tab
   - Select duration (try 1-2 minutes for quick testing)
   - Add apps to block (Instagram, YouTube, etc.)
   - Start session and verify blocking works
4. **Test Blocking**: Try to open blocked apps during session
5. **Session Completion**: Wait for session to complete and verify notifications

### **Advanced Features Test**
1. **Permanent Blocking**: Enable permanent mode and test 2-hour delay
2. **Website Blocking**: Add websites and test browser blocking
3. **App Lifecycle**: Minimize/restore app to verify crash fixes
4. **Uninstall Protection**: Try to uninstall during active session

### **UI/UX Evaluation**
- Navigate through all screens
- Test dark/light theme switching
- Evaluate animation smoothness
- Check responsive design elements

## 🏅 Hackathon Highlights

### **Problem Solved**
Digital distraction is a major productivity killer. VOLT provides a comprehensive solution that goes beyond simple app timers by implementing robust blocking mechanisms that are difficult to bypass.

### **Innovation Points**
1. **Anti-Bypass Design**: Removed easy escape routes users typically exploit
2. **Permanent Blocking Mode**: Serious commitment tool with built-in delays
3. **Crash-Free Experience**: Solved common React Native lifecycle issues
4. **Native Integration**: Deep Android system integration for effective blocking

### **Technical Excellence**
- Clean, maintainable codebase
- Proper error handling and logging
- Comprehensive testing capabilities
- Production-ready architecture

## 📊 App Statistics

- **Lines of Code**: ~15,000+
- **Components**: 25+ reusable UI components
- **Native Modules**: 4 custom Android modules
- **Screens**: 8 main application screens
- **Services**: 10+ background services

## 🔮 Future Enhancements

- iOS version development
- Advanced analytics and insights
- Team/family blocking coordination
- Integration with productivity tools
- Machine learning for usage pattern analysis

## 👨‍💻 Developer

**RONNY KD**
- GitHub: [@RONNYKD](https://github.com/RONNYKD)
- Project: VOLT Focus & Productivity App

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Kiro Hackathon**

*Helping users reclaim their focus and boost productivity through intelligent app blocking technology.*