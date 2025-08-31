package com.volt.appblocking;

import android.util.Log;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Utility class for URL pattern matching and domain-based website blocking
 * Handles various URL formats and provides intelligent domain matching
 */
public class VoltUrlMatcher {
    private static final String TAG = "VoltUrlMatcher";
    
    // Common URL patterns
    private static final Pattern HTTP_PATTERN = Pattern.compile("^https?://", Pattern.CASE_INSENSITIVE);
    private static final Pattern WWW_PATTERN = Pattern.compile("^www\\.", Pattern.CASE_INSENSITIVE);
    private static final Pattern DOMAIN_PATTERN = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\\.[a-zA-Z]{2,}$");

    /**
     * Check if a URL is blocked based on a set of blocked domains
     * @param url The URL to check
     * @param blockedDomains Set of blocked domain names
     * @return true if the URL should be blocked, false otherwise
     */
    public static boolean isUrlBlocked(String url, Set<String> blockedDomains) {
        if (url == null || url.trim().isEmpty() || blockedDomains == null || blockedDomains.isEmpty()) {
            return false;
        }

        try {
            String domain = extractDomain(url);
            if (domain == null || domain.isEmpty()) {
                return false;
            }

            // Check if the domain or any parent domain is blocked
            for (String blockedDomain : blockedDomains) {
                if (matchesDomain(domain, blockedDomain)) {
                    Log.d(TAG, "URL blocked: " + url + " (matches domain: " + blockedDomain + ")");
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            Log.e(TAG, "Error checking if URL is blocked: " + url, e);
            return false;
        }
    }

    /**
     * Extract domain from a URL string
     * @param url The URL string
     * @return The domain name, or null if extraction fails
     */
    public static String extractDomain(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }

        try {
            // Normalize the URL first
            String normalizedUrl = normalizeUrl(url);
            
            // Parse the URL
            URL urlObj = new URL(normalizedUrl);
            String host = urlObj.getHost();
            
            if (host == null || host.isEmpty()) {
                return null;
            }

            // Remove www. prefix if present
            String domain = removeWwwPrefix(host.toLowerCase());
            
            Log.d(TAG, "Extracted domain: " + domain + " from URL: " + url);
            return domain;
        } catch (MalformedURLException e) {
            Log.w(TAG, "Failed to extract domain from URL: " + url, e);
            
            // Try fallback extraction for malformed URLs
            return extractDomainFallback(url);
        } catch (Exception e) {
            Log.e(TAG, "Error extracting domain from URL: " + url, e);
            return null;
        }
    }

    /**
     * Check if a domain matches a blocked domain pattern
     * Supports exact matches and subdomain matching
     * @param domain The domain to check
     * @param blockedDomain The blocked domain pattern
     * @return true if the domain matches the blocked pattern
     */
    public static boolean matchesDomain(String domain, String blockedDomain) {
        if (domain == null || blockedDomain == null) {
            return false;
        }

        String normalizedDomain = normalizeDomain(domain);
        String normalizedBlockedDomain = normalizeDomain(blockedDomain);

        // Exact match
        if (normalizedDomain.equals(normalizedBlockedDomain)) {
            return true;
        }

        // Subdomain match (e.g., m.facebook.com matches facebook.com)
        if (normalizedDomain.endsWith("." + normalizedBlockedDomain)) {
            return true;
        }

        // Parent domain match (e.g., facebook.com matches m.facebook.com if blocked domain is m.facebook.com)
        if (normalizedBlockedDomain.endsWith("." + normalizedDomain)) {
            return true;
        }

        return false;
    }

    /**
     * Normalize a URL string for consistent processing
     * @param url The URL to normalize
     * @return The normalized URL
     */
    public static String normalizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "";
        }

        String normalized = url.trim();

        // Add protocol if missing
        if (!HTTP_PATTERN.matcher(normalized).find()) {
            normalized = "https://" + normalized;
        }

        return normalized;
    }

    /**
     * Normalize a domain string for consistent matching
     * @param domain The domain to normalize
     * @return The normalized domain
     */
    public static String normalizeDomain(String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            return "";
        }

        String normalized = domain.trim().toLowerCase();
        
        // Remove www. prefix
        normalized = removeWwwPrefix(normalized);
        
        // Remove trailing dots
        while (normalized.endsWith(".")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    /**
     * Remove www. prefix from a domain
     * @param domain The domain string
     * @return Domain without www. prefix
     */
    private static String removeWwwPrefix(String domain) {
        if (domain == null) {
            return null;
        }
        
        if (WWW_PATTERN.matcher(domain).find()) {
            return domain.substring(4); // Remove "www."
        }
        
        return domain;
    }

    /**
     * Fallback method to extract domain from malformed URLs
     * @param url The URL string
     * @return The extracted domain, or null if extraction fails
     */
    private static String extractDomainFallback(String url) {
        try {
            String cleaned = url.trim().toLowerCase();
            
            // Remove protocol
            cleaned = cleaned.replaceFirst("^https?://", "");
            
            // Remove www.
            cleaned = removeWwwPrefix(cleaned);
            
            // Find the domain part (before first slash, colon, or question mark)
            int slashIndex = cleaned.indexOf('/');
            int colonIndex = cleaned.indexOf(':');
            int questionIndex = cleaned.indexOf('?');
            
            int endIndex = cleaned.length();
            if (slashIndex > 0) endIndex = Math.min(endIndex, slashIndex);
            if (colonIndex > 0) endIndex = Math.min(endIndex, colonIndex);
            if (questionIndex > 0) endIndex = Math.min(endIndex, questionIndex);
            
            String domain = cleaned.substring(0, endIndex);
            
            // Basic validation
            if (isValidDomain(domain)) {
                Log.d(TAG, "Fallback extracted domain: " + domain + " from URL: " + url);
                return domain;
            }
            
            return null;
        } catch (Exception e) {
            Log.e(TAG, "Fallback domain extraction failed for URL: " + url, e);
            return null;
        }
    }

    /**
     * Basic domain validation
     * @param domain The domain to validate
     * @return true if the domain appears to be valid
     */
    private static boolean isValidDomain(String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            return false;
        }
        
        // Basic checks
        if (domain.length() > 253) return false; // Max domain length
        if (domain.startsWith(".") || domain.endsWith(".")) return false;
        if (domain.contains("..")) return false;
        
        // Must contain at least one dot
        if (!domain.contains(".")) return false;
        
        // Basic pattern matching
        return DOMAIN_PATTERN.matcher(domain).matches() || 
               domain.matches("^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    }

    /**
     * Get the root domain from a subdomain
     * @param domain The domain (may be a subdomain)
     * @return The root domain
     */
    public static String getRootDomain(String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            return null;
        }

        String normalized = normalizeDomain(domain);
        String[] parts = normalized.split("\\.");
        
        if (parts.length >= 2) {
            // Return the last two parts (root domain)
            return parts[parts.length - 2] + "." + parts[parts.length - 1];
        }
        
        return normalized;
    }

    /**
     * Check if a domain is a subdomain of another domain
     * @param domain The domain to check
     * @param parentDomain The potential parent domain
     * @return true if domain is a subdomain of parentDomain
     */
    public static boolean isSubdomain(String domain, String parentDomain) {
        if (domain == null || parentDomain == null) {
            return false;
        }

        String normalizedDomain = normalizeDomain(domain);
        String normalizedParent = normalizeDomain(parentDomain);

        return !normalizedDomain.equals(normalizedParent) && 
               normalizedDomain.endsWith("." + normalizedParent);
    }
}