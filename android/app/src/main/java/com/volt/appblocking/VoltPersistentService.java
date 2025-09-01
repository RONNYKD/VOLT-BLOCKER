package com.volt.appblocking;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.volt.MainActivity;

/**
 * Persistent foreground service to ensure VOLT keeps running in background
 * This service maintains app blocking and uninstall protection even when app is minimized
 */
public class VoltPersistentService extends Service {
    private static final String TAG = "VoltPersistentService";
    private static final String CHANNEL_ID = "volt_persistent_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final String PREFS_NAME = "volt_service_prefs";
    
    private PowerManager.WakeLock wakeLock;
    private PowerManager.WakeLock partialWakeLock;
    private PowerManager.WakeLock screenWakeLock;
    private NotificationManager notificationManager;
    private boolean isServiceRunning = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "VoltPersistentService created with enhanced persistence");
        
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
        
        // Initialize multiple wake locks for maximum persistence
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        
        // Partial wake lock for background operation
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VOLT::PersistentService");
        
        // Additional partial wake lock for redundancy
        partialWakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VOLT::BackgroundProtection");
        
        // Screen wake lock for critical periods (used sparingly)
        screenWakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "VOLT::CriticalProtection"
        );
        
        isServiceRunning = true;
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "VoltPersistentService started with CRITICAL priority");
        
        // Create CRITICAL priority notification
        createCriticalNotificationChannel();
        Notification notification = createCriticalPersistentNotification();
        
        // Start as foreground service with MAXIMUM priority
        startForeground(NOTIFICATION_ID, notification);
        
        // Acquire multiple wake locks for maximum persistence
        acquireAllWakeLocks();
        
        // Monitor and restart accessibility service if needed
        startAccessibilityMonitoring();
        
        // Start service health monitoring
        startServiceHealthMonitoring();
        
        // Return START_STICKY to ensure service restarts if killed
        return START_STICKY;
    }
    
    private void acquireAllWakeLocks() {
        try {
            // Acquire partial wake lock for background operation
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire();
                Log.d(TAG, "Primary wake lock acquired");
            }
            
            // Acquire secondary partial wake lock for redundancy
            if (partialWakeLock != null && !partialWakeLock.isHeld()) {
                partialWakeLock.acquire();
                Log.d(TAG, "Secondary wake lock acquired");
            }
            
            // Note: Screen wake lock is acquired only during critical operations
            Log.d(TAG, "All wake locks acquired for maximum persistence");
        } catch (Exception e) {
            Log.e(TAG, "Error acquiring wake locks", e);
        }
    }
    
    private void startServiceHealthMonitoring() {
        // Start a background thread to monitor service health
        new Thread(() -> {
            while (isServiceRunning) {
                try {
                    Thread.sleep(30000); // Check every 30 seconds
                    
                    // Verify wake locks are still held
                    if (wakeLock != null && !wakeLock.isHeld()) {
                        Log.w(TAG, "Primary wake lock lost - reacquiring");
                        wakeLock.acquire();
                    }
                    
                    if (partialWakeLock != null && !partialWakeLock.isHeld()) {
                        Log.w(TAG, "Secondary wake lock lost - reacquiring");
                        partialWakeLock.acquire();
                    }
                    
                    // Check if accessibility service is still running
                    if (!VoltAccessibilityService.isServiceRunning()) {
                        Log.w(TAG, "Accessibility service not running - protection compromised");
                    }
                    
                } catch (InterruptedException e) {
                    Log.d(TAG, "Service health monitoring interrupted");
                    break;
                } catch (Exception e) {
                    Log.e(TAG, "Error in service health monitoring", e);
                }
            }
        }).start();
    }
    
    @Override
    public void onDestroy() {
        Log.w(TAG, "VoltPersistentService destroyed - CRITICAL: Protection may be compromised!");
        
        isServiceRunning = false;
        
        // Release all wake locks
        releaseAllWakeLocks();
        
        // CRITICAL: Always restart service if protection is active
        if (isProtectionActive()) {
            Log.e(TAG, "Service destroyed while protection active - IMMEDIATE RESTART REQUIRED");
            scheduleImmediateServiceRestart();
        }
        
        super.onDestroy();
    }
    
    private void releaseAllWakeLocks() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                Log.d(TAG, "Primary wake lock released");
            }
            
            if (partialWakeLock != null && partialWakeLock.isHeld()) {
                partialWakeLock.release();
                Log.d(TAG, "Secondary wake lock released");
            }
            
            if (screenWakeLock != null && screenWakeLock.isHeld()) {
                screenWakeLock.release();
                Log.d(TAG, "Screen wake lock released");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error releasing wake locks", e);
        }
    }
    
    private void scheduleImmediateServiceRestart() {
        try {
            // Method 1: Immediate restart via AlarmManager
            Intent restartIntent = new Intent(this, VoltPersistentService.class);
            PendingIntent pendingIntent = PendingIntent.getService(
                this, 1001, restartIntent, 
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
            );
            
            AlarmManager alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
            alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, 
                SystemClock.elapsedRealtime() + 1000, pendingIntent); // Restart in 1 second
            
            // Method 2: Backup restart via broadcast receiver
            Intent broadcastIntent = new Intent("com.volt.RESTART_PROTECTION_SERVICE");
            sendBroadcast(broadcastIntent);
            
            Log.w(TAG, "Service restart scheduled via multiple methods");
        } catch (Exception e) {
            Log.e(TAG, "CRITICAL: Failed to schedule service restart", e);
        }
    }
    
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d(TAG, "Task removed - ensuring service continues");
        
        // Restart service if protection is active
        if (isProtectionActive()) {
            Log.d(TAG, "Restarting service after task removal");
            scheduleServiceRestart();
        }
        
        super.onTaskRemoved(rootIntent);
    }
    
    private void scheduleServiceRestart() {
        // Use AlarmManager for reliable restart
        android.app.AlarmManager alarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
        Intent restartIntent = new Intent(this, VoltPersistentService.class);
        PendingIntent pendingIntent = PendingIntent.getService(
            this, 0, restartIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        
        // Schedule restart in 5 seconds
        long restartTime = System.currentTimeMillis() + 5000;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, restartTime, pendingIntent);
        } else {
            alarmManager.setExact(android.app.AlarmManager.RTC_WAKEUP, restartTime, pendingIntent);
        }
        
        Log.d(TAG, "Service restart scheduled");
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "VOLT Protection Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps VOLT protection active in background");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    private void createCriticalNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "VOLT Critical Protection",
            NotificationManager.IMPORTANCE_HIGH // HIGH importance for visibility
        );
        channel.setDescription("Critical protection service - DO NOT DISABLE");
        channel.setShowBadge(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.enableLights(true);
        channel.setLightColor(Color.RED);
        channel.enableVibration(false); // Don't annoy user with vibration
        
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    private Notification createCriticalPersistentNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🛡️ VOLT Protection Active")
            .setContentText("Protecting your focus commitment - DO NOT DISABLE")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MAX) // MAXIMUM priority
            .setCategory(NotificationCompat.CATEGORY_SYSTEM) // System category
            .setOngoing(true) // Cannot be dismissed
            .setAutoCancel(false) // Cannot be auto-cancelled
            .setShowWhen(false)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(Color.RED) // Red color for importance
            .build();
    }

    private Notification createPersistentNotification() {
        // Legacy method - now calls critical version
        return createCriticalPersistentNotification();
    }
    
    private void startAccessibilityMonitoring() {
        // Monitor accessibility service and restart if needed
        new Thread(() -> {
            while (isServiceRunning) {
                try {
                    // Check if accessibility service is running
                    if (!VoltAccessibilityService.isServiceRunning()) {
                        Log.w(TAG, "Accessibility service not running, attempting to restart");
                        // Note: Cannot programmatically enable accessibility service
                        // This would require user to re-enable in settings
                    }
                    
                    // Sleep for 30 seconds before next check
                    Thread.sleep(30000);
                } catch (InterruptedException e) {
                    Log.e(TAG, "Accessibility monitoring interrupted", e);
                    break;
                }
            }
        }).start();
    }
    
    private boolean isProtectionActive() {
        SharedPreferences prefs = getSharedPreferences("volt_protection_prefs", Context.MODE_PRIVATE);
        return prefs.getBoolean("protection_active", false);
    }
    
    public static void startPersistentService(Context context) {
        Intent serviceIntent = new Intent(context, VoltPersistentService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
    
    public static void stopPersistentService(Context context) {
        Intent serviceIntent = new Intent(context, VoltPersistentService.class);
        context.stopService(serviceIntent);
    }
}