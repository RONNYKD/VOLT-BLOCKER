package com.volt.appblocking;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;

public class VoltWebsiteBlockingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "VoltWebsiteBlocking";
    private final ReactApplicationContext reactContext;
    private VoltWebsiteBlockingManager websiteBlockingManager;

    public VoltWebsiteBlockingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.websiteBlockingManager = VoltWebsiteBlockingManager.getInstance(reactContext);
    }

    @Override
    public String getName() {
        return "VoltWebsiteBlocking";
    }

    // ============ WEBSITE MANAGEMENT METHODS ============

    @ReactMethod
    public void addBlockedWebsite(String domain, String url, String title, Promise promise) {
        try {
            Log.d(TAG, "Adding blocked website: " + domain);
            
            boolean success = websiteBlockingManager.addBlockedWebsite(domain, url, title);
            
            if (success) {
                Log.d(TAG, "Successfully added blocked website: " + domain);
            }
            
            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error adding blocked website", e);
            promise.reject("ADD_BLOCKED_WEBSITE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeBlockedWebsite(String domain, Promise promise) {
        try {
            Log.d(TAG, "Removing blocked website: " + domain);
            
            boolean success = websiteBlockingManager.removeBlockedWebsite(domain);
            
            if (success) {
                Log.d(TAG, "Successfully removed blocked website: " + domain);
            }
            
            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error removing blocked website", e);
            promise.reject("REMOVE_BLOCKED_WEBSITE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void updateBlockedWebsites(ReadableArray websites, Promise promise) {
        try {
            Log.d(TAG, "Updating blocked websites list with " + websites.size() + " websites");
            
            List<VoltWebsiteBlockingManager.BlockedWebsite> websiteList = new ArrayList<>();
            
            for (int i = 0; i < websites.size(); i++) {
                ReadableMap websiteMap = websites.getMap(i);
                String domain = websiteMap.getString("domain");
                String url = websiteMap.getString("url");
                String title = websiteMap.hasKey("title") ? websiteMap.getString("title") : domain;
                boolean isBlocked = websiteMap.hasKey("isBlocked") ? websiteMap.getBoolean("isBlocked") : true;
                
                VoltWebsiteBlockingManager.BlockedWebsite website = 
                    new VoltWebsiteBlockingManager.BlockedWebsite(domain, url, title, isBlocked);
                websiteList.add(website);
            }
            
            boolean success = websiteBlockingManager.updateBlockedWebsites(websiteList);
            
            Log.d(TAG, "Updated blocked websites: " + success);
            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error updating blocked websites", e);
            promise.reject("UPDATE_BLOCKED_WEBSITES_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getBlockedWebsites(Promise promise) {
        try {
            Log.d(TAG, "Getting blocked websites");
            
            Set<VoltWebsiteBlockingManager.BlockedWebsite> blockedWebsites = 
                websiteBlockingManager.getBlockedWebsites();
            
            WritableArray websitesArray = Arguments.createArray();
            
            for (VoltWebsiteBlockingManager.BlockedWebsite website : blockedWebsites) {
                WritableMap websiteMap = Arguments.createMap();
                websiteMap.putString("domain", website.getDomain());
                websiteMap.putString("url", website.getUrl());
                websiteMap.putString("title", website.getTitle());
                websiteMap.putBoolean("isBlocked", website.isBlocked());
                websitesArray.pushMap(websiteMap);
            }
            
            Log.d(TAG, "Found " + blockedWebsites.size() + " blocked websites");
            promise.resolve(websitesArray);
        } catch (Exception e) {
            Log.e(TAG, "Error getting blocked websites", e);
            promise.reject("GET_BLOCKED_WEBSITES_ERROR", e.getMessage());
        }
    }

    // ============ WEBSITE BLOCKING CONTROL METHODS ============

    @ReactMethod
    public void startWebsiteBlocking(Promise promise) {
        try {
            Log.d(TAG, "Starting website blocking");
            
            boolean success = websiteBlockingManager.startWebsiteBlocking();
            
            if (success) {
                Log.d(TAG, "Website blocking started successfully");
            }
            
            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error starting website blocking", e);
            promise.reject("START_WEBSITE_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopWebsiteBlocking(Promise promise) {
        try {
            Log.d(TAG, "Stopping website blocking");
            
            boolean success = websiteBlockingManager.stopWebsiteBlocking();
            
            if (success) {
                Log.d(TAG, "Website blocking stopped successfully");
            }
            
            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping website blocking", e);
            promise.reject("STOP_WEBSITE_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isWebsiteBlockingActive(Promise promise) {
        try {
            boolean isActive = websiteBlockingManager.isWebsiteBlockingActive();
            
            Log.d(TAG, "Website blocking active: " + isActive);
            promise.resolve(isActive);
        } catch (Exception e) {
            Log.e(TAG, "Error checking website blocking status", e);
            promise.reject("WEBSITE_BLOCKING_STATUS_ERROR", e.getMessage());
        }
    }

    // ============ BROWSER MONITORING METHODS ============

    @ReactMethod
    public void getSupportedBrowsers(Promise promise) {
        try {
            Log.d(TAG, "Getting supported browsers");
            
            List<VoltBrowserMonitor.BrowserInfo> browsers = VoltBrowserMonitor.getSupportedBrowsers(reactContext);
            WritableArray browsersArray = Arguments.createArray();
            
            for (VoltBrowserMonitor.BrowserInfo browser : browsers) {
                WritableMap browserMap = Arguments.createMap();
                browserMap.putString("packageName", browser.getPackageName());
                browserMap.putString("appName", browser.getAppName());
                browserMap.putString("urlExtractionMethod", browser.getUrlExtractionMethod());
                browserMap.putBoolean("isSupported", browser.isSupported());
                browsersArray.pushMap(browserMap);
            }
            
            Log.d(TAG, "Found " + browsers.size() + " supported browsers");
            promise.resolve(browsersArray);
        } catch (Exception e) {
            Log.e(TAG, "Error getting supported browsers", e);
            promise.reject("GET_SUPPORTED_BROWSERS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getCurrentBrowserUrl(Promise promise) {
        try {
            Log.d(TAG, "Getting current browser URL");
            
            // This will be implemented in Phase 2
            String currentUrl = null; // Will be implemented with browser monitoring
            
            Log.d(TAG, "Current browser URL: " + currentUrl);
            promise.resolve(currentUrl);
        } catch (Exception e) {
            Log.e(TAG, "Error getting current browser URL", e);
            promise.reject("GET_CURRENT_BROWSER_URL_ERROR", e.getMessage());
        }
    }
}