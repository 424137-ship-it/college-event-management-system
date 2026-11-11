"""
HarshaX College Event Management System (NIT)
Automated Selenium End-to-End Test Suite Runner
Author: Harsha Vardhan & NIT Software Testing Team
"""

import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Import individual test modules
from test_ui_smoke import run_smoke_test
from test_ui_auth import run_auth_test
from test_ui_organizer_approval import run_organizer_approval_ui_test
from test_ui_gallery import run_gallery_test

def create_driver(visible=False):
    opts = Options()
    if not visible:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--log-level=3")
    driver = webdriver.Chrome(options=opts)
    driver.implicitly_wait(4)
    return driver

def main():
    visible = "--visible" in sys.argv or "-v" in sys.argv
    base_url = "http://localhost:5173"

    print("=" * 72)
    print(" HARSHAX / NIT COLLEGE EVENT MANAGEMENT SYSTEM")
    print(" AUTOMATED SELENIUM E2E TEST SUITE (SOFTWARE TESTING LAB)")
    print("=" * 72)
    print(f"Target Base URL: {base_url}")
    print(f"Execution Mode : {'Interactive Visible Browser' if visible else 'Headless Chrome Automation'}")
    print(f"Timestamp      : {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 72)

    tests = [
        ("TC_UI_01", "Smoke, Header & Route Navigation", run_smoke_test),
        ("TC_UI_02", "2FA OTP Authentication & Negative Validation", run_auth_test),
        ("TC_UI_03", "Organizer Role Signup & Admin Approval Banner", run_organizer_approval_ui_test),
        ("TC_UI_04", "Campus Photo Gallery & Lightbox Modal Inspection", run_gallery_test),
    ]

    results = []
    total_start = time.time()

    driver = create_driver(visible=visible)

    try:
        for tc_id, title, test_fn in tests:
            print(f"\n▶ Executing [{tc_id}]: {title}...")
            t0 = time.time()
            try:
                test_fn(driver, base_url=base_url)
                duration = time.time() - t0
                results.append((tc_id, title, "PASS", duration, None))
                print(f"  --> [{tc_id}] PASSED ({duration:.2f}s)")
            except Exception as e:
                duration = time.time() - t0
                results.append((tc_id, title, "FAIL", duration, str(e)))
                print(f"  --> [{tc_id}] FAILED ({duration:.2f}s): {e}")
    finally:
        driver.quit()

    total_duration = time.time() - total_start

    # Print Final Summary Table
    print("\n" + "=" * 72)
    print("                    FINAL TEST EXECUTION SUMMARY")
    print("=" * 72)
    print(f"{'TC ID':<12} | {'Test Scenario':<42} | {'Status':<6} | {'Time':<6}")
    print("-" * 72)
    passed_count = 0
    for tc_id, title, status, dur, err in results:
        status_str = f"\033[92m{status}\033[0m" if status == "PASS" else f"\033[91m{status}\033[0m"
        print(f"{tc_id:<12} | {title:<42} | {status:<6} | {dur:4.2f}s")
        if status == "PASS":
            passed_count += 1

    print("-" * 72)
    print(f"Total Tests Run : {len(results)}")
    print(f"Passed          : {passed_count}")
    print(f"Failed          : {len(results) - passed_count}")
    print(f"Success Rate    : {(passed_count / len(results)) * 100:.1f}%")
    print(f"Total Wall Time : {total_duration:.2f} seconds")
    print("=" * 72)

    if passed_count == len(results):
        print("\n🏆 ALL AUTOMATED SELENIUM TEST CASES PASSED SUCCESSFULLY!\n")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
