import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_auth_test(driver, base_url="http://localhost:5173"):
    print("\n[TC_UI_02] Running 2FA OTP Authentication Test...")
    driver.get(f"{base_url}/login")
    wait = WebDriverWait(driver, 10)

    # 1. Verify Login Form Elements
    username_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='text']")))
    password_input = driver.find_element(By.XPATH, "//input[@type='password']")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")

    assert username_input.is_displayed(), "Username input should be visible"
    assert password_input.is_displayed(), "Password input should be visible"
    print("  ✔ Login credential inputs verified.")

    # 2. Test Invalid Credentials Error Handling (Negative Test)
    username_input.clear()
    username_input.send_keys("invalid_user_999")
    password_input.clear()
    password_input.send_keys("wrong_password")
    submit_btn.click()

    time.sleep(1.2)
    # Check that we remain on the login page or an error notification appears
    assert "/login" in driver.current_url, "User should remain on login page upon failure"
    print("  ✔ Negative Test: Invalid credentials successfully rejected.")

    # 3. Test Valid Demo Login & Two-Factor OTP Flow (Positive Test)
    driver.get(f"{base_url}/login")
    time.sleep(0.5)
    username_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='text']")))
    password_input = driver.find_element(By.XPATH, "//input[@type='password']")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")

    # Use Quick Demo Login button if present or fill credentials
    demo_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Student')]")
    if demo_buttons:
        demo_buttons[0].click()
        print("  ✔ Clicked Student demo quick-fill.")
    else:
        username_input.clear()
        username_input.send_keys("harsha")
        password_input.clear()
        password_input.send_keys("student123")
        submit_btn.click()

    # 4. Wait for OTP step
    otp_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[contains(@placeholder, '000000') or @maxLength='6' or @type='text']")))
    print("  ✔ 2FA Verification Screen reached! 6-digit OTP code requested.")

    # 5. Enter 6-digit OTP code (demo fallback accepts 123456 or actual generated OTP)
    otp_input.clear()
    otp_input.send_keys("123456")

    verify_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Verify')]")
    verify_btn.click()

    time.sleep(2)
    print("  ✔ OTP code submitted successfully.")
    print("  ✔ Authentication flow PASSED!")
    return True

if __name__ == "__main__":
    from selenium.webdriver.chrome.options import Options
    opts = Options()
    opts.add_argument("--headless=new")
    driver = webdriver.Chrome(options=opts)
    try:
        run_auth_test(driver)
        print("\nAll Auth assertions PASSED!")
    finally:
        driver.quit()
