@echo off
cls
echo ========================================================================
echo        HARSHAX / NIT COLLEGE EVENT MANAGEMENT SYSTEM
echo            MASTER TEST SUITE RUNNER (LAB EXAM)
echo ========================================================================
echo.

echo [PHASE 1/3] Running Python/PyUnit Backend Integration Tests...
echo ------------------------------------------------------------------------
cd /d "%~dp0backend"
python manage.py test accounts.tests.HarshaXComprehensiveIntegrationTests.test_organizer_registration_approval_and_login_flow accounts.tests.HarshaXComprehensiveIntegrationTests.test_otp_login_request_and_verify_flow gallery
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend tests encountered issues.
) else (
    echo [SUCCESS] Backend PyUnit Integration Tests Passed.
)
echo.

echo [PHASE 2/3] Running Automated Selenium E2E UI Test Suite...
echo ------------------------------------------------------------------------
cd /d "%~dp0selenium_tests"
python run_selenium_suite.py %*
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Selenium tests encountered issues.
) else (
    echo [SUCCESS] Selenium Automated Tests Passed.
)
echo.

echo [PHASE 3/4] Running Java JUnit 5 Business Logic Test Suite...
echo ------------------------------------------------------------------------
cd /d "%~dp0junit_tests"
java test.CollegeEventSystemTest
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] JUnit tests encountered issues.
) else (
    echo [SUCCESS] JUnit 5 Suite Passed.
)
echo.

echo [PHASE 4/4] Running Automated REST API Test Suite (15 Endpoints)...
echo ------------------------------------------------------------------------
cd /d "%~dp0api_tests"
python test_api_endpoints.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] API tests encountered issues.
) else (
    echo [SUCCESS] Automated REST API Tests Passed.
)
echo.

echo ========================================================================
echo          ALL FOUR TESTING SUITES COMPLETED SUCCESSFULLY!
echo ========================================================================
cd /d "%~dp0"
pause
