package com.volt.uninstallprotection;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import androidx.annotation.NonNull;

public class VoltUninstallProtectionModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "VoltUninstallProtection";
    
    public VoltUninstallProtectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.d(TAG, "VoltUninstallProtectionModule initialized");
    }

    @Override
    @NonNull
    public String getName() {
        return "VoltUninstallProtection";
    }

    @ReactMethod
    public void test(Promise promise) {
        promise.resolve("VoltUninstallProtection module is working!");
    }
}