# VOLT Uninstall Protection System

## Overview

The VOLT Uninstall Protection System is a comprehensive multi-layer security feature designed to prevent impulsive app uninstallation during focus sessions. This helps users stay committed to their digital wellness goals by adding friction to the uninstall process.

## Architecture

### React Native Layer
- **ProtectionSetupWizard.tsx**: Guided setup wizard for configuring uninstall protection
- **UninstallProtectionScreen.tsx**: Main settings screen for managing protection
- **UninstallProtectionTest.tsx**: Developer testing component

### Native Android Layer
- **VoltUninstallProtectionModule.java**: Main React Native bridge module
- **VoltDeviceAdminReceiver.java**: Device administrator receiver for handling admin events
- **VoltPackageMonitorService.java**: Background service monitoring package events
- **VoltPasswordOverlayActivity.java**: Full-screen overlay for password authentication
- **VoltUninstallProtectionPackage.java**: React Native package registration

## Protection Layers

### 1. Device Administrator Layer
- **Purpose**: Primary protection against uninstall attempts
- **Implementation**: Uses Android Device Policy Manager
- **Features**:
  - Prevents unauthorized app removal
  - Shows warning message when user tries to disable admin
  - Detects admin disable attempts

### 2. Package Monitor Layer
- **Purpose**: Real-time monitoring of package removal events
- **Implementation**: Background foreground service with broadcast receivers
- **Features**:
  - Monitors `ACTION_PACKAGE_REMOVED` events
  - Triggers password overlay on uninstall attempts
  - Logs security events

### 3. Password Authentication Layer
- **Purpose**: User authentication before allowing uninstall
- **Implementation**: Full-screen overlay activity
- **Features**:
  - SHA-256 password hashing
  - Failed attempt tracking (max 3 attempts)
  - Final confirmation dialog

### 4. Emergency Override Layer
- **Purpose**: Safety mechanism for genuine emergencies
- **Implementation**: 24-hour cooling-off period
- **Features**:
  - Request emergency override
  - 24-hour waiting period
  - Token-based verification

## Setup Process

### 1. Password Configuration
```typescript
await VoltUninstallProtectionModule.setProtectionPassword('userPassword');
```

### 2. Device Admin Permission
```typescript
const success = await VoltUninstallProtectionModule.requestDeviceAdminPermission();
```

### 3. Enable Protection
```typescript
const result = await VoltUninstallProtectionModule.enableProtection();
```

## API Methods

### Core Protection
- `enableProtection()`: Enable all protection layers
- `disableProtection()`: Disable protection (requires authentication)
- `isProtectionActive()`: Check if protection is currently active

### Setup & Permissions
- `checkPermissions()`: Check all required permissions
- `requestDeviceAdminPermission()`: Request device admin privileges
- `setupProtectionLayers()`: Guided setup process

### Password Management
- `setProtectionPassword(password)`: Set protection password
- `verifyProtectionPassword(password)`: Verify password
- `hasProtectionPassword()`: Check if password is set

### Status & Monitoring
- `getProtectionStatus()`: Get detailed protection status
- `runHealthCheck()`: Comprehensive health check
- `verifyProtectionIntegrity()`: Check system integrity

### Emergency Override
- `requestEmergencyOverride()`: Request emergency disable
- `processEmergencyOverride(token)`: Process override after cooling-off

## Security Features

### Password Security
- SHA-256 hashing with salt
- Secure storage in SharedPreferences
- Failed attempt tracking
- No plaintext storage

### Admin Protection
- Device administrator privileges required
- Warning messages on disable attempts
- Automatic re-enabling capabilities
- Admin status monitoring

### Service Protection
- Foreground service for reliability
- Automatic restart on termination
- Broadcast receiver monitoring
- System event logging

## User Experience

### Setup Wizard
1. **Introduction**: Explains protection benefits
2. **Password Setup**: Secure password configuration
3. **Device Admin**: Request administrator privileges
4. **Completion**: Final setup confirmation

### Protection Active
- Persistent notification showing protection status
- Real-time monitoring of uninstall attempts
- Immediate password challenge on attempts
- Clear user feedback and warnings

### Disable Process
1. Password authentication required
2. Final confirmation dialog
3. Clear warning about consequences
4. Option to cancel at any step

## Testing

### Manual Testing
1. Enable uninstall protection
2. Try to uninstall VOLT from Android settings
3. Verify password overlay appears
4. Test correct/incorrect password scenarios
5. Verify final confirmation process

### Automated Testing
Use `UninstallProtectionTest.tsx` component:
- Device admin status checks
- Permission verification
- Password operations testing
- Protection toggle testing
- Health check validation

## Configuration

### AndroidManifest.xml
```xml
<!-- Device Admin Receiver -->
<receiver android:name=".uninstallprotection.VoltDeviceAdminReceiver"
          android:permission="android.permission.BIND_DEVICE_ADMIN"
          android:exported="true">
    <meta-data android:name="android.app.device_admin"
               android:resource="@xml/device_admin_policy" />
    <intent-filter>
        <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
        <action android:name="android.app.action.DEVICE_ADMIN_DISABLED" />
        <action android:name="android.app.action.DEVICE_ADMIN_DISABLE_REQUESTED" />
    </intent-filter>
</receiver>
```

### Device Admin Policy
```xml
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <limit-password />
    </uses-policies>
</device-admin>
```

## Limitations

### Android Limitations
- Requires user to manually enable device admin
- Can be disabled by determined users
- Root access can bypass protection
- Factory reset removes protection

### App Limitations
- Only works on Android platform
- Requires specific permissions
- May impact battery life slightly
- Needs foreground service notification

## Best Practices

### For Users
- Choose a strong, memorable password
- Don't share protection password
- Use emergency override only when necessary
- Keep protection enabled during focus sessions

### For Developers
- Regular health checks
- Monitor protection integrity
- Handle edge cases gracefully
- Provide clear user feedback
- Test on multiple Android versions

## Troubleshooting

### Common Issues
1. **Device admin not working**: Check permissions and re-enable
2. **Password overlay not showing**: Verify overlay permissions
3. **Service not running**: Check foreground service status
4. **Protection bypassed**: Verify all layers are active

### Debug Tools
- Use `UninstallProtectionTest.tsx` for comprehensive testing
- Check Android logs for service status
- Monitor SharedPreferences for state
- Verify broadcast receivers are registered

## Future Enhancements

### Planned Features
- Biometric authentication support
- Remote disable capabilities
- Advanced threat detection
- Integration with focus session state
- Cloud backup of protection settings

### Security Improvements
- Hardware security module integration
- Advanced anti-tampering measures
- Machine learning threat detection
- Behavioral analysis integration

## Support

For issues or questions about the uninstall protection system:
1. Check the troubleshooting section
2. Use the test component for debugging
3. Review Android logs for errors
4. Verify all permissions are granted
5. Test on different Android versions

---

**Note**: This protection system is designed to help users maintain their digital wellness commitments. It should not be considered a security feature for protecting sensitive data, but rather a tool for behavioral change and habit formation.