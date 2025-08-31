package com.volt.appblocking;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
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
    private NotificationManager notificationManager;
    private boolean isServiceRunning = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "VoltPersistentService created");
        
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
        
        // Acquire partial wake lock to keep service running
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VOLT::PersistentService");
        
        isServiceRunning = true;
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "VoltPersistentService started");
        
        // Start as foreground service with persistent notification
        startForeground(NOTIFICATION_ID, createPersistentNotification());
        
        // Acquire wake lock if not already held
        if (!wakeLock.isHeld()) {
            wakeLock.acquire();
        }
        
        // Monitor and restart accessibility service if needed
        startAccessibilityMonitoring();
        
        // Return START_STICKY to ensure service restarts if killed
        return START_STICKY;
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "VoltPersistentService destroyed");
        
        isServiceRunning = false;
        
        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        // Restart service if protection is still active
        if (isProtectionActive()) {
            Log.w(TAG, "Service destroyed while protection active - scheduling restart");
            scheduleServiceRestart();
        }
        
        super.onDestroy();
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
    
    private Notification createPersistentNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("VOLT Protection Active")
            .setContentText("App blocking and uninstall protection are running")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
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