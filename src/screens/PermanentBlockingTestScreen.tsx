/**
 * Permanent Blocking Test Screen
 * Step-by-step testing of the complete permanent blocking feature
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { appBlockingService } from '../services/native/AppBlockingService';
import type { DisableStatus, PermanentBlockingResult, DisableBlockingResult } from '../services/native/AppBlockingService';

interface TestResult {
    step: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    data?: any;
}

const PermanentBlockingTestScreen: React.FC = () => {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPermanentActive, setIsPermanentActive] = useState(false);
    const [disableStatus, setDisableStatus] = useState<DisableStatus | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Auto-refresh disable status every 10 seconds when there's a pending request
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (autoRefresh && disableStatus?.isPending) {
            interval = setInterval(async () => {
                await checkDisableStatus();
            }, 10000); // Refresh every 10 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, disableStatus?.isPending]);

    const addTestResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
        const result: TestResult = { step, status, message, data };
        setTestResults(prev => [...prev, result]);
        console.log(`Test ${step}:`, status, message, data);
    };

    const clearResults = () => {
        setTestResults([]);
    };

    // ============ TEST METHODS ============

    const testServiceAvailability = async () => {
        addTestResult('Service Check', 'pending', 'Checking if native service is available...');

        try {
            const isAvailable = appBlockingService.isAvailable();
            if (isAvailable) {
                addTestResult('Service Check', 'success', 'Native service is available ✅');
                await appBlockingService.initialize();
                addTestResult('Service Init', 'success', 'Service initialized successfully ✅');
            } else {
                addTestResult('Service Check', 'error', 'Native service not available ❌');
            }
        } catch (error) {
            addTestResult('Service Check', 'error', `Service check failed: ${error}`);
        }
    };

    const checkPermissions = async () => {
        addTestResult('Permission Check', 'pending', 'Checking required permissions...');

        try {
            const [hasUsageStats, hasAccessibility] = await Promise.all([
                appBlockingService.hasUsageStatsPermission(),
                appBlockingService.hasAccessibilityPermission()
            ]);

            const permissionStatus = {
                usageStats: hasUsageStats,
                accessibility: hasAccessibility,
                bothGranted: hasUsageStats && hasAccessibility
            };

            if (permissionStatus.bothGranted) {
                addTestResult('Permission Check', 'success', '✅ All permissions granted - blocking should work!', permissionStatus);
            } else {
                addTestResult('Permission Check', 'error', `❌ Missing permissions - blocking won't work! Usage: ${hasUsageStats ? '✅' : '❌'}, Accessibility: ${hasAccessibility ? '✅' : '❌'}`, permissionStatus);
            }

            return permissionStatus;
        } catch (error) {
            addTestResult('Permission Check', 'error', `Permission check failed: ${error}`);
            return { usageStats: false, accessibility: false, bothGranted: false };
        }
    };

    const requestPermissions = async () => {
        addTestResult('Request Permissions', 'pending', 'Requesting missing permissions...');

        try {
            // Check current status first
            const [hasUsageStats, hasAccessibility] = await Promise.all([
                appBlockingService.hasUsageStatsPermission(),
                appBlockingService.hasAccessibilityPermission()
            ]);

            // Request Usage Stats permission if missing
            if (!hasUsageStats) {
                addTestResult('Usage Stats', 'pending', 'Opening Usage Stats settings...');
                await appBlockingService.requestUsageStatsPermission();
                addTestResult('Usage Stats', 'success', 'Usage Stats settings opened - please grant permission manually');
            }

            // Request Accessibility permission if missing
            if (!hasAccessibility) {
                addTestResult('Accessibility', 'pending', 'Opening Accessibility settings...');
                await appBlockingService.requestAccessibilityPermission();
                addTestResult('Accessibility', 'success', 'Accessibility settings opened - please enable VOLT service manually');
            }

            if (hasUsageStats && hasAccessibility) {
                addTestResult('Request Permissions', 'success', '✅ All permissions already granted!');
            } else {
                addTestResult('Request Permissions', 'success', '⚠️ Settings opened - please grant permissions manually, then test again');
            }

        } catch (error) {
            addTestResult('Request Permissions', 'error', `Permission request failed: ${error}`);
        }
    };

    const testActualBlocking = async () => {
        addTestResult('Test Blocking', 'pending', 'Testing actual app blocking functionality...');

        try {
            // First check permissions
            const permissions = await checkPermissions();
            if (!permissions.bothGranted) {
                addTestResult('Test Blocking', 'error', '❌ Cannot test blocking - permissions missing. Grant permissions first!');
                return;
            }

            // Try to start blocking some common apps
            const testApps = ['com.android.chrome', 'com.google.android.youtube'];
            addTestResult('Start Blocking', 'pending', `Starting blocking for test apps: ${testApps.join(', ')}`);

            const success = await appBlockingService.startBlocking(testApps);
            if (success) {
                addTestResult('Start Blocking', 'success', '✅ Blocking started successfully!');

                // Check if blocking is active
                const isBlocking = await appBlockingService.isBlocking();
                addTestResult('Blocking Status', isBlocking ? 'success' : 'error',
                    `Blocking active: ${isBlocking ? 'YES ✅' : 'NO ❌'}`);

                if (isBlocking) {
                    addTestResult('Test Blocking', 'success', '🎉 App blocking is working! Try opening Chrome or YouTube - they should be blocked.');
                } else {
                    addTestResult('Test Blocking', 'error', '❌ Blocking started but not active - check accessibility service');
                }
            } else {
                addTestResult('Start Blocking', 'error', '❌ Failed to start blocking');
                addTestResult('Test Blocking', 'error', '❌ App blocking test failed');
            }

        } catch (error) {
            addTestResult('Test Blocking', 'error', `Blocking test failed: ${error}`);
        }
    };

    const checkPermanentBlockingStatus = async () => {
        addTestResult('Status Check', 'pending', 'Checking permanent blocking status...');

        try {
            const isActive = await appBlockingService.isPermanentBlockingActive();
            setIsPermanentActive(isActive);
            addTestResult('Status Check', 'success', `Permanent blocking active: ${isActive ? 'YES' : 'NO'}`, { isActive });
        } catch (error) {
            addTestResult('Status Check', 'error', `Status check failed: ${error}`);
        }
    };

    const enablePermanentBlocking = async () => {
        addTestResult('Enable Permanent', 'pending', 'Enabling permanent blocking mode...');

        try {
            const result: PermanentBlockingResult = await appBlockingService.enablePermanentBlocking();
            if (result.success) {
                setIsPermanentActive(true);
                addTestResult('Enable Permanent', 'success', result.message, result);
            } else {
                addTestResult('Enable Permanent', 'error', result.message, result);
            }
        } catch (error) {
            addTestResult('Enable Permanent', 'error', `Enable failed: ${error}`);
        }
    };

    const disablePermanentBlocking = async () => {
        addTestResult('Disable Permanent', 'pending', 'Disabling permanent blocking mode...');

        try {
            const result: PermanentBlockingResult = await appBlockingService.disablePermanentBlocking();
            if (result.success) {
                setIsPermanentActive(false);
                setDisableStatus(null);
                addTestResult('Disable Permanent', 'success', result.message, result);
            } else {
                addTestResult('Disable Permanent', 'error', result.message, result);
            }
        } catch (error) {
            addTestResult('Disable Permanent', 'error', `Disable failed: ${error}`);
        }
    };

    const testStopBlockingWhenPermanent = async () => {
        addTestResult('Test Stop Blocking', 'pending', 'Testing stopBlocking() when permanent mode is active...');

        try {
            const success = await appBlockingService.stopBlocking();
            // This should fail if permanent blocking is active and no 2-hour delay has passed
            addTestResult('Test Stop Blocking', success ? 'error' : 'success',
                success ? 'ERROR: stopBlocking() succeeded when it should have failed!' : 'SUCCESS: stopBlocking() was properly blocked ✅');
        } catch (error: any) {
            // This is expected when permanent blocking is active
            if (error.message?.includes('PERMANENT_BLOCKING_ACTIVE') || error.message?.includes('DISABLE_REQUEST_PENDING')) {
                addTestResult('Test Stop Blocking', 'success', `SUCCESS: Properly blocked with error: ${error.message} ✅`);
            } else {
                addTestResult('Test Stop Blocking', 'error', `Unexpected error: ${error.message}`);
            }
        }
    };

    const requestDisableBlocking = async () => {
        addTestResult('Request Disable', 'pending', 'Requesting disable with 2-hour delay...');

        try {
            const result: DisableBlockingResult = await appBlockingService.requestDisableBlocking();
            if (result.success) {
                addTestResult('Request Disable', 'success', result.message, result);
                await checkDisableStatus(); // Update status immediately
                setAutoRefresh(true); // Start auto-refresh
            } else {
                addTestResult('Request Disable', 'error', result.message, result);
            }
        } catch (error) {
            addTestResult('Request Disable', 'error', `Request failed: ${error}`);
        }
    };

    const cancelDisableRequest = async () => {
        addTestResult('Cancel Request', 'pending', 'Canceling disable request...');

        try {
            const result: DisableBlockingResult = await appBlockingService.cancelDisableRequest();
            if (result.success) {
                addTestResult('Cancel Request', 'success', result.message, result);
                await checkDisableStatus(); // Update status immediately
                setAutoRefresh(false); // Stop auto-refresh
            } else {
                addTestResult('Cancel Request', 'error', result.message, result);
            }
        } catch (error) {
            addTestResult('Cancel Request', 'error', `Cancel failed: ${error}`);
        }
    };

    const checkDisableStatus = async () => {
        try {
            const status: DisableStatus = await appBlockingService.getDisableStatus();
            setDisableStatus(status);

            // Don't add to test results for auto-refresh calls
            if (!autoRefresh) {
                addTestResult('Check Status', 'success', `Status: ${status.status}`, status);
            }

            return status;
        } catch (error) {
            if (!autoRefresh) {
                addTestResult('Check Status', 'error', `Status check failed: ${error}`);
            }
            return null;
        }
    };

    const confirmDisableBlocking = async () => {
        addTestResult('Confirm Disable', 'pending', 'Confirming disable blocking...');

        try {
            const result: DisableBlockingResult = await appBlockingService.confirmDisableBlocking();
            if (result.success) {
                addTestResult('Confirm Disable', 'success', result.message, result);
                setIsPermanentActive(false);
                setDisableStatus(null);
                setAutoRefresh(false);
            } else {
                addTestResult('Confirm Disable', 'error', result.message, result);
            }
        } catch (error: any) {
            if (error.message?.includes('DISABLE_NOT_READY')) {
                addTestResult('Confirm Disable', 'success', `SUCCESS: Properly blocked - ${error.message} ✅`);
            } else {
                addTestResult('Confirm Disable', 'error', `Confirm failed: ${error.message}`);
            }
        }
    };

    // ============ COMPLETE TEST SEQUENCES ============

    const runBasicTests = async () => {
        setIsLoading(true);
        clearResults();

        try {
            await testServiceAvailability();
            await new Promise(resolve => setTimeout(resolve, 500));

            await checkPermanentBlockingStatus();
            await new Promise(resolve => setTimeout(resolve, 500));

            await checkDisableStatus();
        } finally {
            setIsLoading(false);
        }
    };

    const runFullTestSequence = async () => {
        setIsLoading(true);
        clearResults();

        try {
            // Step 1: Basic checks
            await testServiceAvailability();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 2: Enable permanent blocking
            await enablePermanentBlocking();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Test that stopBlocking is blocked
            await testStopBlockingWhenPermanent();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 4: Request disable with 2-hour delay
            await requestDisableBlocking();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 5: Test that stopBlocking is still blocked during waiting period
            await testStopBlockingWhenPermanent();

            addTestResult('Full Test', 'success', '🎉 Full test sequence completed! Now wait 2 hours or test cancel/confirm functions.');

        } finally {
            setIsLoading(false);
        }
    };

    // ============ RENDER HELPERS ============

    const renderTestResult = (result: TestResult, index: number) => {
        const statusColor = result.status === 'success' ? '#4CAF50' :
            result.status === 'error' ? '#F44336' : '#FF9800';

        return (
            <View key={index} style={[styles.testResult, { borderLeftColor: statusColor }]}>
                <Text style={styles.testStep}>{result.step}</Text>
                <Text style={[styles.testMessage, { color: statusColor }]}>{result.message}</Text>
                {result.data && (
                    <Text style={styles.testData}>{JSON.stringify(result.data, null, 2)}</Text>
                )}
            </View>
        );
    };

    const renderDisableStatus = () => {
        if (!disableStatus) return null;

        return (
            <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>🕐 Disable Request Status</Text>
                <Text style={styles.statusText}>Status: {disableStatus.status}</Text>
                <Text style={styles.statusText}>Pending: {disableStatus.isPending ? 'YES' : 'NO'}</Text>
                <Text style={styles.statusText}>Can Disable Now: {disableStatus.canDisableNow ? 'YES' : 'NO'}</Text>
                <Text style={styles.statusText}>Remaining: {appBlockingService.formatRemainingTime(disableStatus.remainingMinutes)}</Text>
                {disableStatus.remainingTimeDisplay && (
                    <Text style={styles.statusText}>Display: {disableStatus.remainingTimeDisplay}</Text>
                )}
                {autoRefresh && (
                    <Text style={styles.autoRefreshText}>🔄 Auto-refreshing every 10 seconds...</Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.title}>🧪 Permanent Blocking Test Lab</Text>

                {/* Status Cards */}
                <View style={styles.statusContainer}>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusTitle}>🔒 Permanent Blocking</Text>
                        <Text style={[styles.statusValue, { color: isPermanentActive ? '#F44336' : '#4CAF50' }]}>
                            {isPermanentActive ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                    </View>
                </View>

                {renderDisableStatus()}

                {/* Test Buttons */}
                <View style={styles.buttonContainer}>
                    <Text style={styles.sectionTitle}>🚀 Quick Tests</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={runBasicTests}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Run Basic Tests</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={runFullTestSequence}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonText, styles.primaryButtonText]}>Run Full Test Sequence</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonContainer}>
                    <Text style={styles.sectionTitle}>🔧 Individual Tests</Text>

                    <TouchableOpacity style={styles.smallButton} onPress={checkPermissions}>
                        <Text style={styles.smallButtonText}>Check Permissions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.smallButton, styles.warningButton]} onPress={requestPermissions}>
                        <Text style={styles.smallButtonText}>Request Permissions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.smallButton, styles.successButton]} onPress={testActualBlocking}>
                        <Text style={styles.smallButtonText}>Test App Blocking</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallButton} onPress={checkPermanentBlockingStatus}>
                        <Text style={styles.smallButtonText}>Check Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallButton, !isPermanentActive && styles.successButton]}
                        onPress={enablePermanentBlocking}
                        disabled={isPermanentActive}
                    >
                        <Text style={styles.smallButtonText}>Enable Permanent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallButton, styles.dangerButton]}
                        onPress={disablePermanentBlocking}
                    >
                        <Text style={styles.smallButtonText}>Disable Permanent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallButton} onPress={testStopBlockingWhenPermanent}>
                        <Text style={styles.smallButtonText}>Test Stop Blocking</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallButton, styles.warningButton]}
                        onPress={requestDisableBlocking}
                    >
                        <Text style={styles.smallButtonText}>Request Disable (2h)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallButton} onPress={cancelDisableRequest}>
                        <Text style={styles.smallButtonText}>Cancel Request</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallButton} onPress={checkDisableStatus}>
                        <Text style={styles.smallButtonText}>Check Disable Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallButton, styles.successButton]}
                        onPress={confirmDisableBlocking}
                    >
                        <Text style={styles.smallButtonText}>Confirm Disable</Text>
                    </TouchableOpacity>
                </View>

                {/* Test Results */}
                <View style={styles.resultsContainer}>
                    <View style={styles.resultsHeader}>
                        <Text style={styles.sectionTitle}>📋 Test Results</Text>
                        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    {testResults.length === 0 ? (
                        <Text style={styles.noResults}>No test results yet. Run some tests!</Text>
                    ) : (
                        testResults.map(renderTestResult)
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    statusContainer: {
        marginBottom: 16,
    },
    statusCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    statusValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusText: {
        fontSize: 14,
        marginBottom: 4,
        color: '#666',
    },
    autoRefreshText: {
        fontSize: 12,
        color: '#2196F3',
        fontStyle: 'italic',
        marginTop: 8,
    },
    buttonContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryButtonText: {
        color: 'white',
    },
    smallButton: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 6,
        marginBottom: 6,
        alignItems: 'center',
    },
    successButton: {
        backgroundColor: '#4CAF50',
    },
    dangerButton: {
        backgroundColor: '#F44336',
    },
    warningButton: {
        backgroundColor: '#FF9800',
    },
    smallButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    resultsContainer: {
        marginTop: 20,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clearButton: {
        backgroundColor: '#757575',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    clearButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    noResults: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        padding: 20,
    },
    testResult: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderLeftWidth: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    testStep: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    testMessage: {
        fontSize: 13,
        marginBottom: 4,
    },
    testData: {
        fontSize: 11,
        fontFamily: 'monospace',
        backgroundColor: '#f8f8f8',
        padding: 8,
        borderRadius: 4,
        color: '#666',
    },
});

export default PermanentBlockingTestScreen;