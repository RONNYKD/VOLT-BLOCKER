import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { NativeModules } from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { uninstallProtectionService } from '../../services/protection';
import { appBlockingService } from '../../services/native';
import { useFocusStore } from '../../store/focus-store';

const { VoltUninstallProtection } = NativeModules;

export const ProtectionTestComponent: React.FC = () => {
    const { colors } = useAppTheme();
    const [isLoading, setIsLoading] = useState(false);
    const { startSession, stopSession, completeSession, currentSession } = useFocusStore();

    const testPasswordSetup = async () => {
        try {
            setIsLoading(true);
            const result = await uninstallProtectionService.setupProtectionPassword('test123');
            Alert.alert(
                'Password Setup Test',
                result ? 'SUCCESS: Password setup worked!' : 'FAILED: Password setup failed',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Password Setup Test', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const testDeviceAdminSettings = async () => {
        try {
            setIsLoading(true);
            const result = await VoltUninstallProtection.openDeviceAdminSettings();
            Alert.alert(
                'Device Admin Settings Test',
                result ? 'SUCCESS: Settings opened!' : 'FAILED: Could not open settings',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Device Admin Settings Test', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const testSessionStartNotification = async () => {
        try {
            setIsLoading(true);
            await appBlockingService.showSessionStartNotification();
            Alert.alert('Session Start Notification', 'SUCCESS: Notification should be visible!');
        } catch (error) {
            Alert.alert('Session Start Notification', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const testSessionEndNotification = async () => {
        try {
            setIsLoading(true);
            await appBlockingService.showSessionEndNotification(true);
            Alert.alert('Session End Notification', 'SUCCESS: Notification should be visible!');
        } catch (error) {
            Alert.alert('Session End Notification', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const testFocusSessionNotification = async () => {
        try {
            setIsLoading(true);
            await VoltUninstallProtection.showFocusSessionNotification(25, 1500); // 25 min session, 25 min remaining
            Alert.alert('Focus Session Notification', 'SUCCESS: Persistent notification should be visible!');
        } catch (error) {
            Alert.alert('Focus Session Notification', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const testFullFocusSession = async () => {
        try {
            setIsLoading(true);
            if (currentSession) {
                // Stop current session
                await stopSession();
                Alert.alert('Focus Session Test', 'Current session stopped');
            } else {
                // Start new session
                await startSession(1, ['com.android.chrome']); // 1 minute test session
                Alert.alert('Focus Session Test', 'Test session started! Check for notifications.');
            }
        } catch (error) {
            Alert.alert('Focus Session Test', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const clearNotifications = async () => {
        try {
            setIsLoading(true);
            await VoltUninstallProtection.hideFocusSessionNotification();
            Alert.alert('Clear Notifications', 'SUCCESS: Notifications cleared!');
        } catch (error) {
            Alert.alert('Clear Notifications', 'ERROR: ' + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                🧪 Protection System Tests
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Test all the fixes for the three main issues
            </Text>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Issue 1: Password Setup
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={testPasswordSetup}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Password Setup</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Issue 2: Device Admin Settings
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.secondary }]}
                    onPress={testDeviceAdminSettings}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Open Device Admin Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.secondary, marginTop: 8 }]}
                    onPress={async () => {
                        try {
                            setIsLoading(true);
                            const isEnabled = await VoltUninstallProtection.isDeviceAdminEnabled();
                            Alert.alert(
                                'Device Admin Status Test',
                                isEnabled ? 'SUCCESS: Device admin is ENABLED' : 'INFO: Device admin is DISABLED',
                                [{ text: 'OK' }]
                            );
                        } catch (error) {
                            Alert.alert('Device Admin Status Test', 'ERROR: ' + String(error));
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Check Device Admin Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.success, marginTop: 8 }]}
                    onPress={async () => {
                        try {
                            setIsLoading(true);
                            const result = await VoltUninstallProtection.enableProtection();
                            Alert.alert(
                                'Enable Protection Test',
                                result?.success ? 'SUCCESS: Protection enabled!' : `FAILED: ${result?.message || 'Unknown error'}`,
                                [{ text: 'OK' }]
                            );
                        } catch (error) {
                            Alert.alert('Enable Protection Test', 'ERROR: ' + String(error));
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Enable Protection</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.error, marginTop: 8 }]}
                    onPress={async () => {
                        Alert.prompt(
                            'Disable Protection',
                            'Enter your protection password to disable uninstall protection:',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel'
                                },
                                {
                                    text: 'Disable',
                                    onPress: async (password) => {
                                        if (!password) return;
                                        try {
                                            setIsLoading(true);
                                            const result = await VoltUninstallProtection.disableProtection(password);
                                            
                                            let message = result?.success ? 'SUCCESS: Protection disabled!' : `FAILED: ${result?.message || 'Unknown error'}`;
                                            
                                            if (result?.success && result?.deviceAdminRemoved === false) {
                                                message += '\n\nNote: Device admin must be disabled manually in Android Settings.';
                                            }
                                            
                                            Alert.alert(
                                                'Disable Protection Test',
                                                message,
                                                result?.success && result?.deviceAdminRemoved === false ? [
                                                    { text: 'OK' },
                                                    { 
                                                        text: 'Open Settings', 
                                                        onPress: () => VoltUninstallProtection.openDeviceAdminSettingsForDisable()
                                                    }
                                                ] : [{ text: 'OK' }]
                                            );
                                        } catch (error) {
                                            Alert.alert('Disable Protection Test', 'ERROR: ' + String(error));
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }
                                }
                            ],
                            'secure-text'
                        );
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Disable Protection</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.warning, marginTop: 8 }]}
                    onPress={async () => {
                        Alert.prompt(
                            'Debug Password Hash',
                            'Enter a password to debug the hashing:',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel'
                                },
                                {
                                    text: 'Debug',
                                    onPress: async (password) => {
                                        if (!password) return;
                                        try {
                                            setIsLoading(true);
                                            const result = await VoltUninstallProtection.debugPasswordHash(password);
                                            Alert.alert(
                                                'Password Hash Debug',
                                                `Input: ${result.inputPassword}\n` +
                                                `Input Hash: ${result.inputHash}\n` +
                                                `Stored Hash: ${result.storedHash}\n` +
                                                `Matches: ${result.matches}\n` +
                                                `Input Length: ${result.inputHashLength}\n` +
                                                `Stored Length: ${result.storedHashLength}`,
                                                [{ text: 'OK' }]
                                            );
                                        } catch (error) {
                                            Alert.alert('Debug Hash Test', 'ERROR: ' + String(error));
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }
                                }
                            ],
                            'secure-text'
                        );
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Debug Password Hash</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.warning, marginTop: 8 }]}
                    onPress={async () => {
                        try {
                            setIsLoading(true);
                            const status = await VoltUninstallProtection.getProtectionStatus();
                            const isActive = status?.isActive || false;
                            const deviceAdmin = status?.layers?.deviceAdmin?.enabled || false;
                            const packageMonitor = status?.layers?.packageMonitor?.enabled || false;
                            const passwordAuth = status?.layers?.passwordAuth?.enabled || false;
                            const emergencyOverride = status?.emergencyOverrideActive || false;

                            let message = `Overall Active: ${isActive ? 'YES' : 'NO'}\n` +
                                        `Device Admin: ${deviceAdmin ? 'YES' : 'NO'}\n` +
                                        `Package Monitor: ${packageMonitor ? 'YES' : 'NO'}\n` +
                                        `Password Auth: ${passwordAuth ? 'YES' : 'NO'}\n` +
                                        `Emergency Override: ${emergencyOverride ? 'ACTIVE' : 'INACTIVE'}`;

                            if (emergencyOverride && status?.emergencyOverride) {
                                const remainingHours = status.emergencyOverride.remainingHours || 0;
                                const remainingMinutes = status.emergencyOverride.remainingMinutes || 0;
                                message += `\n\nOverride Time Remaining: ${remainingHours}h ${remainingMinutes % 60}m`;
                            }

                            Alert.alert('Protection Status', message, [{ text: 'OK' }]);
                        } catch (error) {
                            Alert.alert('Protection Status Test', 'ERROR: ' + String(error));
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Check Protection Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.error, marginTop: 8 }]}
                    onPress={async () => {
                        Alert.alert(
                            'Emergency Override Request',
                            'This will start a 5-hour countdown. After 5 hours, you will have a 15-minute window to disable protection without a password.\n\nProtection REMAINS ACTIVE during the 5-hour wait period.\n\nUse this only in emergencies when you cannot access your password.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Request Override',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            setIsLoading(true);
                                            const result = await VoltUninstallProtection.requestEmergencyOverride();
                                            
                                            if (result?.success) {
                                                const availableAt = new Date(result.availableAt).toLocaleString();
                                                Alert.alert(
                                                    'Emergency Override Requested',
                                                    `SUCCESS: Override countdown started!\n\n` +
                                                    `Protection remains ACTIVE for 5 hours.\n` +
                                                    `Override will be available at: ${availableAt}\n\n` +
                                                    `You will then have 15 minutes to disable protection without password.`,
                                                    [{ text: 'OK' }]
                                                );
                                            } else {
                                                Alert.alert('Emergency Override Failed', result?.message || 'Unknown error');
                                            }
                                        } catch (error) {
                                            Alert.alert('Emergency Override Error', String(error));
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }
                                }
                            ]
                        );
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>🚨 Request Emergency Override</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.info, marginTop: 8 }]}
                    onPress={async () => {
                        try {
                            setIsLoading(true);
                            const result = await VoltUninstallProtection.canDisableWithoutPassword();
                            
                            Alert.alert(
                                'Disable Permission Check',
                                `Can Disable Without Password: ${result.canDisable ? 'YES' : 'NO'}\n` +
                                `Override State: ${result.overrideState?.toUpperCase()}\n\n` +
                                `${result.message}`,
                                [{ text: 'OK' }]
                            );
                        } catch (error) {
                            Alert.alert('Permission Check Error', String(error));
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Check Disable Permission</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.secondary, marginTop: 8 }]}
                    onPress={async () => {
                        try {
                            setIsLoading(true);
                            const status = await VoltUninstallProtection.getEmergencyOverrideStatus();
                            
                            if (status?.isActive) {
                                const remainingHours = status.remainingHours || 0;
                                const remainingMinutes = status.remainingMinutes || 0;
                                let message = `STATE: ${status.state?.toUpperCase()}\n\n`;
                                
                                if (status.isPending) {
                                    const availableAt = new Date(status.availableTime).toLocaleString();
                                    message += `Countdown: ${remainingHours}h ${remainingMinutes}m remaining\n` +
                                              `Available At: ${availableAt}\n\n` +
                                              `Protection is STILL ACTIVE during countdown.`;
                                } else if (status.isAvailable) {
                                    const expiresAt = new Date(status.expirationTime).toLocaleString();
                                    message += `Override Window: ${remainingMinutes}m remaining\n` +
                                              `Expires At: ${expiresAt}\n\n` +
                                              `You can now disable protection WITHOUT password!`;
                                } else if (status.isExpired) {
                                    message += `Override has EXPIRED.\n\n` +
                                              `Protection is ACTIVE again.\n` +
                                              `Password required to disable.`;
                                }
                                
                                Alert.alert(
                                    'Emergency Override Status',
                                    message,
                                    [
                                        { text: 'OK' },
                                        {
                                            text: 'Cancel Override',
                                            onPress: async () => {
                                                try {
                                                    const cancelResult = await VoltUninstallProtection.cancelEmergencyOverride();
                                                    Alert.alert(
                                                        'Override Canceled',
                                                        cancelResult?.success ? 'Emergency override canceled. Protection is now active.' : 'Failed to cancel override.'
                                                    );
                                                } catch (error) {
                                                    Alert.alert('Cancel Error', String(error));
                                                }
                                            }
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert(
                                    'Emergency Override Status',
                                    'STATE: NONE\n\nNo emergency override is currently active.',
                                    [{ text: 'OK' }]
                                );
                            }
                        } catch (error) {
                            Alert.alert('Override Status Error', String(error));
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Check Override Status</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Issue 3: Session Notifications
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.success }]}
                    onPress={testSessionStartNotification}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Session Start Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.success, marginTop: 8 }]}
                    onPress={testSessionEndNotification}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Session End Notification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.warning, marginTop: 8 }]}
                    onPress={testFocusSessionNotification}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Test Focus Session Notification</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Full Integration Test
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: currentSession ? colors.error : colors.primary }]}
                    onPress={testFullFocusSession}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {currentSession ? 'Stop Test Session' : 'Start Test Session'}
                    </Text>
                </TouchableOpacity>

                {currentSession && (
                    <Text style={[styles.sessionInfo, { color: colors.textSecondary }]}>
                        Session active: {Math.ceil(currentSession.duration)} minutes
                    </Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Cleanup
                </Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.error }]}
                    onPress={clearNotifications}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Clear All Notifications</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.footer, { color: colors.textSecondary }]}>
                Use these tests to verify all fixes are working correctly.
                Check your notification panel after running tests.
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    sessionInfo: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    footer: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 32,
        lineHeight: 20,
    },
});