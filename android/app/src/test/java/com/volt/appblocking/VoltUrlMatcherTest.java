package com.volt.appblocking;

import org.junit.Test;
import org.junit.Before;
import static org.junit.Assert.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Unit tests for VoltUrlMatcher
 * Tests URL pattern matching, domain extraction, and blocking logic
 */
public class VoltUrlMatcherTest {
    
    private Set<String> blockedDomains;

    @Before
    public void setUp() {
        blockedDomains = new HashSet<>();
        blockedDomains.add("facebook.com");
        blockedDomains.add("twitter.com");
        blockedDomains.add("instagram.com");
    }

    // ============ DOMAIN EXTRACTION TESTS ============

    @Test
    public void testExtractDomain_ValidUrls() {
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("https://www.facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("http://facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("https://facebook.com/profile"));
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("https://m.facebook.com/home"));
        assertEquals("google.com", VoltUrlMatcher.extractDomain("https://mail.google.com/mail"));
    }

    @Test
    public void testExtractDomain_NoProtocol() {
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("www.facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("m.facebook.com"));
    }

    @Test
    public void testExtractDomain_WithPaths() {
        assertEquals("facebook.com", VoltUrlMatcher.extractDomain("https://facebook.com/profile/user123"));
        assertEquals("twitter.com", VoltUrlMatcher.extractDomain("https://twitter.com/home?tab=timeline"));
        assertEquals("youtube.com", VoltUrlMatcher.extractDomain("https://www.youtube.com/watch?v=abc123"));
    }

    @Test
    public void testExtractDomain_InvalidUrls() {
        assertNull(VoltUrlMatcher.extractDomain(null));
        assertNull(VoltUrlMatcher.extractDomain(""));
        assertNull(VoltUrlMatcher.extractDomain("   "));
        assertNull(VoltUrlMatcher.extractDomain("not-a-url"));
        assertNull(VoltUrlMatcher.extractDomain("://invalid"));
    }

    // ============ URL BLOCKING TESTS ============

    @Test
    public void testIsUrlBlocked_ExactMatches() {
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://facebook.com", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("http://twitter.com", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://instagram.com", blockedDomains));
    }

    @Test
    public void testIsUrlBlocked_WithWww() {
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://www.facebook.com", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("http://www.twitter.com", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://www.instagram.com", blockedDomains));
    }

    @Test
    public void testIsUrlBlocked_Subdomains() {
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://m.facebook.com", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://mobile.twitter.com", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://api.instagram.com", blockedDomains));
    }

    @Test
    public void testIsUrlBlocked_WithPaths() {
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://facebook.com/profile", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://twitter.com/home?tab=1", blockedDomains));
        assertTrue(VoltUrlMatcher.isUrlBlocked("https://instagram.com/user/photos", blockedDomains));
    }

    @Test
    public void testIsUrlBlocked_NotBlocked() {
        assertFalse(VoltUrlMatcher.isUrlBlocked("https://google.com", blockedDomains));
        assertFalse(VoltUrlMatcher.isUrlBlocked("https://youtube.com", blockedDomains));
        assertFalse(VoltUrlMatcher.isUrlBlocked("https://github.com", blockedDomains));
    }

    @Test
    public void testIsUrlBlocked_EdgeCases() {
        assertFalse(VoltUrlMatcher.isUrlBlocked(null, blockedDomains));
        assertFalse(VoltUrlMatcher.isUrlBlocked("", blockedDomains));
        assertFalse(VoltUrlMatcher.isUrlBlocked("https://facebook.com", null));
        assertFalse(VoltUrlMatcher.isUrlBlocked("https://facebook.com", new HashSet<>()));
    }

    // ============ DOMAIN MATCHING TESTS ============

    @Test
    public void testMatchesDomain_ExactMatch() {
        assertTrue(VoltUrlMatcher.matchesDomain("facebook.com", "facebook.com"));
        assertTrue(VoltUrlMatcher.matchesDomain("twitter.com", "twitter.com"));
    }

    @Test
    public void testMatchesDomain_SubdomainMatch() {
        assertTrue(VoltUrlMatcher.matchesDomain("m.facebook.com", "facebook.com"));
        assertTrue(VoltUrlMatcher.matchesDomain("api.twitter.com", "twitter.com"));
        assertTrue(VoltUrlMatcher.matchesDomain("mail.google.com", "google.com"));
    }

    @Test
    public void testMatchesDomain_NoMatch() {
        assertFalse(VoltUrlMatcher.matchesDomain("facebook.com", "twitter.com"));
        assertFalse(VoltUrlMatcher.matchesDomain("google.com", "facebook.com"));
        assertFalse(VoltUrlMatcher.matchesDomain("facebooktest.com", "facebook.com"));
    }

    @Test
    public void testMatchesDomain_EdgeCases() {
        assertFalse(VoltUrlMatcher.matchesDomain(null, "facebook.com"));
        assertFalse(VoltUrlMatcher.matchesDomain("facebook.com", null));
        assertFalse(VoltUrlMatcher.matchesDomain(null, null));
    }

    // ============ URL NORMALIZATION TESTS ============

    @Test
    public void testNormalizeUrl() {
        assertEquals("https://facebook.com", VoltUrlMatcher.normalizeUrl("facebook.com"));
        assertEquals("https://facebook.com", VoltUrlMatcher.normalizeUrl("https://facebook.com"));
        assertEquals("http://facebook.com", VoltUrlMatcher.normalizeUrl("http://facebook.com"));
        assertEquals("https://facebook.com", VoltUrlMatcher.normalizeUrl("  facebook.com  "));
    }

    @Test
    public void testNormalizeDomain() {
        assertEquals("facebook.com", VoltUrlMatcher.normalizeDomain("Facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.normalizeDomain("www.facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.normalizeDomain("FACEBOOK.COM"));
        assertEquals("facebook.com", VoltUrlMatcher.normalizeDomain("facebook.com."));
        assertEquals("facebook.com", VoltUrlMatcher.normalizeDomain("  www.Facebook.com.  "));
    }

    // ============ ROOT DOMAIN TESTS ============

    @Test
    public void testGetRootDomain() {
        assertEquals("facebook.com", VoltUrlMatcher.getRootDomain("facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.getRootDomain("www.facebook.com"));
        assertEquals("facebook.com", VoltUrlMatcher.getRootDomain("m.facebook.com"));
        assertEquals("google.com", VoltUrlMatcher.getRootDomain("mail.google.com"));
        assertEquals("google.com", VoltUrlMatcher.getRootDomain("docs.google.com"));
    }

    @Test
    public void testGetRootDomain_EdgeCases() {
        assertNull(VoltUrlMatcher.getRootDomain(null));
        assertEquals("", VoltUrlMatcher.getRootDomain(""));
        assertEquals("localhost", VoltUrlMatcher.getRootDomain("localhost"));
    }

    // ============ SUBDOMAIN TESTS ============

    @Test
    public void testIsSubdomain() {
        assertTrue(VoltUrlMatcher.isSubdomain("m.facebook.com", "facebook.com"));
        assertTrue(VoltUrlMatcher.isSubdomain("api.twitter.com", "twitter.com"));
        assertTrue(VoltUrlMatcher.isSubdomain("mail.google.com", "google.com"));
        assertTrue(VoltUrlMatcher.isSubdomain("www.facebook.com", "facebook.com"));
    }

    @Test
    public void testIsSubdomain_NotSubdomain() {
        assertFalse(VoltUrlMatcher.isSubdomain("facebook.com", "facebook.com")); // Same domain
        assertFalse(VoltUrlMatcher.isSubdomain("facebook.com", "twitter.com")); // Different domains
        assertFalse(VoltUrlMatcher.isSubdomain("facebooktest.com", "facebook.com")); // Similar but different
        assertFalse(VoltUrlMatcher.isSubdomain("facebook.com", "m.facebook.com")); // Parent of subdomain
    }

    @Test
    public void testIsSubdomain_EdgeCases() {
        assertFalse(VoltUrlMatcher.isSubdomain(null, "facebook.com"));
        assertFalse(VoltUrlMatcher.isSubdomain("facebook.com", null));
        assertFalse(VoltUrlMatcher.isSubdomain(null, null));
    }
}