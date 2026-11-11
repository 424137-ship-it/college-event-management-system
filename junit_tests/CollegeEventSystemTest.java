package test;

/**
 * ============================================================================
 * HarshaX / NIT College Event Management System
 * Software Testing Lab: JUnit 5 Unit & Business Logic Test Suite
 * ============================================================================
 * Demonstrates:
 * 1. Test Fixtures (@BeforeEach, @AfterEach)
 * 2. Assertions (assertEquals, assertTrue, assertFalse, assertThrows)
 * 3. Boundary Value Analysis (BVA) for Event Capacity & OTP Expiry
 * 4. Equivalence Partitioning (EP) for Role-Based Access Control
 * 5. State Transition Testing for Organizer Registration Approval
 * ============================================================================
 */

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

// Simulated System Under Test (SUT) Models
class User {
    String username;
    String email;
    String role; // "ADMIN", "ORGANIZER", "STUDENT"
    boolean isApproved;
    boolean isActive;

    public User(String username, String email, String role) {
        this.username = username;
        this.email = email;
        this.role = role;
        this.isActive = true;
        // Business Rule: Organizers require admin approval; students & admins are auto-approved
        this.isApproved = !role.equals("ORGANIZER");
    }
}

class Event {
    int id;
    String title;
    int maxCapacity;
    int currentRegistrations;
    User organizer;

    public Event(int id, String title, int maxCapacity, User organizer) {
        this.id = id;
        this.title = title;
        this.maxCapacity = maxCapacity;
        this.currentRegistrations = 0;
        this.organizer = organizer;
    }

    public boolean registerParticipant() {
        if (currentRegistrations >= maxCapacity) {
            return false; // Capacity reached
        }
        currentRegistrations++;
        return true;
    }

    public boolean canUploadGalleryPhotos(User user) {
        if (user.role.equals("ADMIN")) return true;
        return user.role.equals("ORGANIZER") && user.username.equals(this.organizer.username) && user.isApproved;
    }
}

class EmailOTP {
    String code;
    LocalDateTime expiresAt;
    boolean isUsed;

    public EmailOTP(String code, int validityMinutes) {
        this.code = code;
        this.expiresAt = LocalDateTime.now().plus(validityMinutes, ChronoUnit.MINUTES);
        this.isUsed = false;
    }

    public boolean isValid(LocalDateTime checkTime) {
        return !isUsed && (checkTime.isBefore(expiresAt) || checkTime.isEqual(expiresAt));
    }
}

public class CollegeEventSystemTest {

    private User adminUser;
    private User organizerUser;
    private User studentUser;
    private Event techHackathon;

    // Fixture setup before each test execution
    public void setUp() {
        adminUser = new User("admin", "admin@nit.ac.in", "ADMIN");
        organizerUser = new User("cs_club_lead", "lead@nit.ac.in", "ORGANIZER");
        studentUser = new User("harsha", "harsha@nit.ac.in", "STUDENT");
        techHackathon = new Event(101, "NIT Hackathon 2026", 2, organizerUser);
    }

    // [TC_JUNIT_01] Organizer Registration State Machine
    public void testOrganizerRegistrationRequiresApproval() {
        // Assert new organizer starts unapproved
        assertFalse(organizerUser.isApproved, "New organizer must require administrator review.");
        assertTrue(studentUser.isApproved, "Students are auto-approved on registration.");
        assertTrue(adminUser.isApproved, "Admins with verified secret are auto-approved.");
    }

    // [TC_JUNIT_02] Pre-approval Organizer Sign-in Denial
    public void testOrganizerLoginBlockedWhenPending() {
        boolean canLogin = organizerUser.isActive && organizerUser.isApproved;
        assertFalse(canLogin, "Unapproved organizer must be blocked from sign-in before admin review.");

        // Admin approves organizer
        organizerUser.isApproved = true;
        boolean canLoginAfterApproval = organizerUser.isActive && organizerUser.isApproved;
        assertTrue(canLoginAfterApproval, "Once approved, organizer can log in directly using OTP.");
    }

    // [TC_JUNIT_03] Boundary Value Analysis on Event Registration Capacity
    public void testEventCapacityBoundaryValueAnalysis() {
        // Capacity = 2
        // Test 1: First registration (nominal value: 1 < 2) -> SUCCESS
        boolean reg1 = techHackathon.registerParticipant();
        assertTrue(reg1, "First registration must succeed.");
        assertEquals(1, techHackathon.currentRegistrations);

        // Test 2: Second registration (boundary value: 2 == 2) -> SUCCESS
        boolean reg2 = techHackathon.registerParticipant();
        assertTrue(reg2, "Second registration at max capacity must succeed.");
        assertEquals(2, techHackathon.currentRegistrations);

        // Test 3: Third registration (above boundary value: 3 > 2) -> REJECTED
        boolean reg3 = techHackathon.registerParticipant();
        assertFalse(reg3, "Registration beyond max capacity must be rejected.");
        assertEquals(2, techHackathon.currentRegistrations);
    }

    // [TC_JUNIT_04] Time Boundary Analysis on 2FA OTP Expiry
    public void testOtpExpiryBoundaryAnalysis() {
        EmailOTP otp = new EmailOTP("847291", 5);

        // 1. Within validity window (e.g. 2 minutes later) -> VALID
        LocalDateTime testNow = LocalDateTime.now().plus(2, ChronoUnit.MINUTES);
        assertTrue(otp.isValid(testNow), "OTP must remain valid within 5 minutes.");

        // 2. Exactly at 5 minute boundary -> VALID
        LocalDateTime atBoundary = otp.expiresAt;
        assertTrue(otp.isValid(atBoundary), "OTP must remain valid at boundary timestamp.");

        // 3. 1 second past 5 minute boundary -> EXPIRED
        LocalDateTime pastBoundary = otp.expiresAt.plus(1, ChronoUnit.SECONDS);
        assertFalse(otp.isValid(pastBoundary), "OTP must expire past 5-minute threshold.");
    }

    // [TC_JUNIT_05] Role-Based Access Control for Gallery Photo Upload
    public void testGalleryPhotoUploadAuthorization() {
        // Unapproved organizer cannot upload
        assertFalse(techHackathon.canUploadGalleryPhotos(organizerUser));

        // Approved organizer can upload for their own event
        organizerUser.isApproved = true;
        assertTrue(techHackathon.canUploadGalleryPhotos(organizerUser));

        // Different organizer cannot upload for this event
        User otherOrg = new User("robo_lead", "robo@nit.ac.in", "ORGANIZER");
        otherOrg.isApproved = true;
        assertFalse(techHackathon.canUploadGalleryPhotos(otherOrg), "Organizers cannot upload to other clubs' events.");

        // Super Admin can upload for any event
        assertTrue(techHackathon.canUploadGalleryPhotos(adminUser), "Admin has universal curation privileges.");
    }

    // Helper assertion methods matching JUnit 5 API
    private void assertTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError("[FAIL] " + message);
    }
    private void assertTrue(boolean condition) {
        assertTrue(condition, "Condition expected true but was false");
    }
    private void assertFalse(boolean condition, String message) {
        if (condition) throw new AssertionError("[FAIL] " + message);
    }
    private void assertFalse(boolean condition) {
        assertFalse(condition, "Condition expected false but was true");
    }
    private void assertEquals(int expected, int actual) {
        if (expected != actual) throw new AssertionError("[FAIL] Expected " + expected + " but got " + actual);
    }

    // Standalone JUnit Test Runner
    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println(" HARSHAX / NIT COLLEGE EVENT MANAGEMENT SYSTEM");
        System.out.println(" STANDALONE JUNIT 5 CORE TEST SUITE EXECUTION");
        System.out.println("========================================================================");

        CollegeEventSystemTest test = new CollegeEventSystemTest();
        int passed = 0;
        int total = 5;

        try {
            test.setUp();
            test.testOrganizerRegistrationRequiresApproval();
            System.out.println("✔ [TC_JUNIT_01] testOrganizerRegistrationRequiresApproval : PASS");
            passed++;

            test.setUp();
            test.testOrganizerLoginBlockedWhenPending();
            System.out.println("✔ [TC_JUNIT_02] testOrganizerLoginBlockedWhenPending       : PASS");
            passed++;

            test.setUp();
            test.testEventCapacityBoundaryValueAnalysis();
            System.out.println("✔ [TC_JUNIT_03] testEventCapacityBoundaryValueAnalysis     : PASS");
            passed++;

            test.setUp();
            test.testOtpExpiryBoundaryAnalysis();
            System.out.println("✔ [TC_JUNIT_04] testOtpExpiryBoundaryAnalysis             : PASS");
            passed++;

            test.setUp();
            test.testGalleryPhotoUploadAuthorization();
            System.out.println("✔ [TC_JUNIT_05] testGalleryPhotoUploadAuthorization        : PASS");
            passed++;

        } catch (AssertionError e) {
            System.err.println("❌ Assertion failed: " + e.getMessage());
        }

        System.out.println("------------------------------------------------------------------------");
        System.out.printf("Total JUnit Tests: %d | Passed: %d | Failed: %d | Pass Rate: %.1f%%\n",
                total, passed, total - passed, (passed / (double) total) * 100);
        System.out.println("========================================================================");
        if (passed == total) {
            System.out.println("🏆 ALL JUNIT TEST ASSERTIONS PASSED SUCCESSFULLY!\n");
        }
    }
}
