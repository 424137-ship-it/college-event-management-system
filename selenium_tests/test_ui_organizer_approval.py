import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_organizer_approval_ui_test(driver, base_url="http://localhost:5173"):
    print("\n[TC_UI_03] Running Organizer Registration & Approval UI Verification...")
    driver.get(f"{base_url}/register")
    wait = WebDriverWait(driver, 10)

    # 1. Verify Registration Header
    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'HarshaX') or contains(text(), 'Platform') or contains(text(), 'Student')]")))
    print("  ✔ Registration portal loaded successfully.")

    # 2. Click "Organizer" role tab
    organizer_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Organizer')]")))
    organizer_btn.click()
    time.sleep(0.5)

    # 3. Assert Approval Notice Banner is visible
    banner = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'One-Time Admin Approval Required') or contains(text(), 'Once approved, no permission is needed again for login')]")))
    assert banner.is_displayed(), "One-time admin approval banner should be prominently visible to the user!"
    print("  ✔ One-Time Admin Approval Banner verified on Organizer signup form.")

    # 4. Verify Organizer-specific fields
    org_input = driver.find_element(By.XPATH, "//input[@name='organization_name']")
    desig_input = driver.find_element(By.XPATH, "//input[@name='designation']")
    assert org_input.is_displayed(), "Organization Name input should be visible"
    assert desig_input.is_displayed(), "Designation input should be visible"
    print("  ✔ Organizer specific form fields (Organization Name, Designation) verified.")

    # 5. Switch back to Student tab and verify student fields
    student_btn = driver.find_element(By.XPATH, "//button[contains(., 'Student')]")
    student_btn.click()
    time.sleep(0.5)

    roll_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@name='roll_number']")))
    assert roll_input.is_displayed(), "Student Roll Number input should be visible"
    print("  ✔ Dynamic role switching between Student and Organizer forms verified.")

    print("  ✔ Organizer Registration & Approval UI test PASSED!")
    return True

if __name__ == "__main__":
    from selenium.webdriver.chrome.options import Options
    opts = Options()
    opts.add_argument("--headless=new")
    driver = webdriver.Chrome(options=opts)
    try:
        run_organizer_approval_ui_test(driver)
        print("\nAll Organizer Approval UI assertions PASSED!")
    finally:
        driver.quit()
