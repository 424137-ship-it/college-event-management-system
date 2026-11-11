import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_smoke_test(driver, base_url="http://localhost:5173"):
    print("\n[TC_UI_01] Running Smoke & Navigation Test...")
    driver.get(base_url)
    
    # 1. Verify Home Page Title or Header
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "nav")))
    
    assert "HarshaX" in driver.title or "Event" in driver.title or "Campus" in driver.title or "NIT" in driver.page_source, "Page branding not found!"
    print("  ✔ Home page loaded successfully with NIT Campus Branding.")

    # 2. Check Navbar Links
    nav_links = driver.find_elements(By.TAG_NAME, "a")
    link_texts = [link.text.strip() for link in nav_links if link.text.strip()]
    print(f"  ✔ Navigation bar links detected: {link_texts[:6]}")
    assert any("Events" in t for t in link_texts), "Events link not found in Navbar"
    assert any("Gallery" in t for t in link_texts), "Gallery link not found in Navbar"

    # 3. Navigate to Events Page
    driver.get(f"{base_url}/events")
    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Events') or contains(text(), 'Browse')]")))
    print("  ✔ Events explorer page navigated and rendered.")

    # 4. Navigate to Gallery Page
    driver.get(f"{base_url}/gallery")
    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Gallery') or contains(text(), 'Memories')]")))
    print("  ✔ Campus Gallery page navigated and rendered.")

    return True

if __name__ == "__main__":
    from selenium.webdriver.chrome.options import Options
    opts = Options()
    opts.add_argument("--headless=new")
    driver = webdriver.Chrome(options=opts)
    try:
        run_smoke_test(driver)
        print("\nAll Smoke assertions PASSED!")
    finally:
        driver.quit()
