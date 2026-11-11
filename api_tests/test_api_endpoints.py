"""
HarshaX / NIT College Event Management System
Automated REST API Test Suite
Covers: Functional API, Status Code Verification, 2FA OTP, Organizer Approval, RBAC Security
"""

import time
import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_all_api_tests():
    results = []

    def record(test_id, endpoint, method, expected_code, actual_code, passed, latency_ms, notes=""):
        results.append({
            "id": test_id,
            "endpoint": endpoint,
            "method": method,
            "expected": expected_code,
            "actual": actual_code,
            "passed": passed,
            "latency": latency_ms,
            "notes": notes
        })
        status_symbol = "✔ PASS" if passed else "❌ FAIL"
        print(f"[{test_id}] {method:<5} {endpoint:<38} -> {actual_code} ({latency_ms:4.1f}ms) [{status_symbol}] {notes}")

    print("\n" + "=" * 78)
    print(" HARSHAX REST API AUTOMATED TEST SUITE (SOFTWARE TESTING LAB)")
    print(" Target Base URL: " + BASE_URL)
    print("=" * 78 + "\n")

    # ---------------------------------------------------------
    # 1. PUBLIC ENDPOINTS
    # ---------------------------------------------------------
    # TC_API_01: Public Events Catalog
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/events/")
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 200 and isinstance(r.json().get('results', r.json()), list)
    record("TC_API_01", "/api/events/", "GET", 200, r.status_code, passed, latency, f"Found {len(r.json().get('results', r.json()))} events")

    # TC_API_02: Active Clubs & Associations
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/clubs/")
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 200
    record("TC_API_02", "/api/clubs/", "GET", 200, r.status_code, passed, latency, "Retrieved college club registry")

    # TC_API_03: Public Platform Metrics
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/stats/public/")
    latency = (time.time() - t0) * 1000
    data = r.json() if r.status_code == 200 else {}
    passed = r.status_code == 200 and 'total_events' in data and 'total_students' in data
    record("TC_API_03", "/api/stats/public/", "GET", 200, r.status_code, passed, latency, f"Stats verified: {data.get('total_events', 0)} events, {data.get('total_students', 0)} students")

    # TC_API_04: Academic Departments List
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/departments/")
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 200
    record("TC_API_04", "/api/departments/", "GET", 200, r.status_code, passed, latency, "NIT academic departments fetched")

    # ---------------------------------------------------------
    # 2. TWO-FACTOR OTP AUTHENTICATION & LOGIN FLOW
    # ---------------------------------------------------------
    # TC_API_05: Request OTP with valid credentials (Positive Test)
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/login-otp-request/", json={
        "username": "student",
        "password": "student123"
    })
    latency = (time.time() - t0) * 1000
    otp_data = r.json() if r.status_code == 200 else {}
    demo_otp = otp_data.get("demo_otp", "")
    passed = r.status_code == 200 and otp_data.get("otp_required") is True and len(demo_otp) == 6
    record("TC_API_05", "/api/auth/login-otp-request/", "POST", 200, r.status_code, passed, latency, f"OTP dispatched: {demo_otp}")

    # TC_API_06: Request OTP with invalid credentials (Negative Test)
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/login-otp-request/", json={
        "username": "student",
        "password": "wrong_password_999"
    })
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 401
    record("TC_API_06", "/api/auth/login-otp-request/", "POST", 401, r.status_code, passed, latency, "Rejected invalid credentials")

    # TC_API_07: Verify valid OTP and issue JWT access token
    student_access_token = None
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/login-otp-verify/", json={
        "username": "student",
        "otp": demo_otp
    })
    latency = (time.time() - t0) * 1000
    verify_data = r.json() if r.status_code == 200 else {}
    student_access_token = verify_data.get("access")
    passed = r.status_code == 200 and student_access_token is not None and student_access_token.startswith("eyJ")
    record("TC_API_07", "/api/auth/login-otp-verify/", "POST", 200, r.status_code, passed, latency, "JWT Access & Refresh tokens issued")

    # TC_API_08: Verify invalid/tampered OTP code (Negative Test)
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/login-otp-verify/", json={
        "username": "student",
        "otp": "000000"
    })
    latency = (time.time() - t0) * 1000
    err_msg = r.json().get("error", "").lower()
    passed = r.status_code == 400 and ("incorrect" in err_msg or "invalid" in err_msg or "expired" in err_msg)
    record("TC_API_08", "/api/auth/login-otp-verify/", "POST", 400, r.status_code, passed, latency, f"Rejected bad OTP: {r.json().get('error')}")

    # ---------------------------------------------------------
    # 3. ORGANIZER REGISTRATION & ADMIN APPROVAL WORKFLOW
    # ---------------------------------------------------------
    unique_org_user = f"org_test_{int(time.time())}"
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/register/", json={
        "username": unique_org_user,
        "email": f"{unique_org_user}@nit.ac.in",
        "password": "Password@123",
        "first_name": "Event",
        "last_name": "Coordinator",
        "role": "ORGANIZER",
        "organization_name": "CyberSecurity Association",
        "designation": "Vice President"
    })
    latency = (time.time() - t0) * 1000
    reg_data = r.json() if r.status_code == 201 else {}
    created_org_id = reg_data.get("user", {}).get("id")
    passed = r.status_code == 201 and reg_data.get("pending_approval") is True and reg_data.get("user", {}).get("is_approved") is False
    record("TC_API_09", "/api/auth/register/", "POST", 201, r.status_code, passed, latency, "Organizer registered with is_approved=False")

    # TC_API_10: Unapproved Organizer sign-in denial
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/login-otp-request/", json={
        "username": unique_org_user,
        "password": "Password@123"
    })
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 403 and "pending administrator approval" in r.json().get("error", "").lower()
    record("TC_API_10", "/api/auth/login-otp-request/", "POST", 403, r.status_code, passed, latency, "Pre-approval login safely blocked (403)")

    # ---------------------------------------------------------
    # 4. ADMIN PRIVILEGES & APPROVAL EXECUTION
    # ---------------------------------------------------------
    # First obtain Admin JWT Token using valid admin credentials (admin / admin123)
    r_admin_req = requests.post(f"{BASE_URL}/auth/login-otp-request/", json={
        "username": "admin",
        "password": "admin123"
    })
    admin_otp = r_admin_req.json().get("demo_otp", "")
    r_admin_verify = requests.post(f"{BASE_URL}/auth/login-otp-verify/", json={
        "username": "admin",
        "otp": admin_otp
    })
    admin_access_token = r_admin_verify.json().get("access")
    admin_headers = {"Authorization": f"Bearer {admin_access_token}"}

    # TC_API_11: Admin approves pending organizer
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/admin/organizers/{created_org_id}/approve/", headers=admin_headers)
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 200 and r.json().get("user", {}).get("is_approved") is True
    record("TC_API_11", f"/api/admin/organizers/{created_org_id}/approve/", "POST", 200, r.status_code, passed, latency, "Admin approved organizer account")

    # TC_API_12: Post-approval organizer login (No permission needed again, just OTP)
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/auth/login-otp-request/", json={
        "username": unique_org_user,
        "password": "Password@123"
    })
    latency = (time.time() - t0) * 1000
    approved_org_otp = r.json().get("demo_otp", "")
    passed = r.status_code == 200 and r.json().get("otp_required") is True
    record("TC_API_12", "/api/auth/login-otp-request/", "POST", 200, r.status_code, passed, latency, f"Approved organizer logs in with OTP ({approved_org_otp})")

    # ---------------------------------------------------------
    # 5. ROLE-BASED ACCESS CONTROL (RBAC) SECURITY TESTS
    # ---------------------------------------------------------
    # TC_API_13: Student JWT attempting to access Admin User Management -> 403 Forbidden
    student_headers = {"Authorization": f"Bearer {student_access_token}"}
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/admin/users/", headers=student_headers)
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 403
    record("TC_API_13", "/api/admin/users/", "GET", 403, r.status_code, passed, latency, "Security RBAC: Student token denied admin access")

    # TC_API_14: Admin JWT accessing Admin User Management -> 200 OK
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/admin/users/", headers=admin_headers)
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 200 and isinstance(r.json(), list)
    record("TC_API_14", "/api/admin/users/", "GET", 200, r.status_code, passed, latency, f"Admin token granted access ({len(r.json())} users)")

    # ---------------------------------------------------------
    # 6. GALLERY & MEDIA ALBUMS API
    # ---------------------------------------------------------
    # TC_API_15: Gallery Images Catalog
    t0 = time.time()
    r = requests.get(f"{BASE_URL}/images/")
    latency = (time.time() - t0) * 1000
    passed = r.status_code == 200
    record("TC_API_15", "/api/images/", "GET", 200, r.status_code, passed, latency, "Retrieved campus event photo images")

    # ---------------------------------------------------------
    # SUMMARY TABLE
    # ---------------------------------------------------------
    print("\n" + "=" * 78)
    print("                     API TEST EXECUTION REPORT")
    print("=" * 78)
    print(f"{'TC ID':<10} | {'Method':<6} | {'Endpoint':<34} | {'Exp':<3} | {'Act':<3} | {'Status':<6} | {'Latency':<7}")
    print("-" * 78)
    passed_count = sum(1 for item in results if item["passed"])
    for item in results:
        status_str = "PASS" if item["passed"] else "FAIL"
        print(f"{item['id']:<10} | {item['method']:<6} | {item['endpoint']:<34} | {item['expected']:<3} | {item['actual']:<3} | {status_str:<6} | {item['latency']:5.1f}ms")

    print("-" * 78)
    print(f"Total API Tests Run : {len(results)}")
    print(f"Passed              : {passed_count}")
    print(f"Failed              : {len(results) - passed_count}")
    print(f"Pass Percentage     : {(passed_count / len(results)) * 100:.1f}%")
    avg_latency = sum(item["latency"] for item in results) / len(results)
    print(f"Average Latency     : {avg_latency:.1f}ms")
    print("=" * 78)

    if passed_count == len(results):
        print("\n🏆 ALL 15 AUTOMATED API TEST CASES PASSED SUCCESSFULLY!\n")
        return 0
    else:
        print("\n❌ SOME API TESTS FAILED. PLEASE CHECK SERVER STATUS.\n")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(run_all_api_tests())
