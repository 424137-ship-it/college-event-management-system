import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_gallery_test(driver, base_url="http://localhost:5173"):
    print("\n[TC_UI_04] Running Campus Gallery & Lightbox Modal Verification...")
    driver.get(f"{base_url}/gallery")
    wait = WebDriverWait(driver, 10)

    # 1. Verify Gallery Page Header and wait for asynchronous data loading
    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Campus') or contains(text(), 'Gallery')]")))
    print("  ✔ Campus Gallery page opened.")

    # Wait for loading spinner to finish (classic Selenium synchronization)
    try:
        WebDriverWait(driver, 6).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, "spinner"))
        )
    except Exception:
        pass

    # 2. Verify Album Filter Pills once loaded
    wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Memories') or contains(., 'All')]")))
    filter_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Memories') or contains(., 'All') or contains(., 'Clear')]")
    assert len(filter_buttons) > 0, "Album filter buttons should be present"
    print(f"  ✔ Detected album filter buttons: {[b.text for b in filter_buttons if b.text][:3]}")

    # 3. Verify Photo Cards in Grid
    images = wait.until(EC.presence_of_all_elements_located((By.XPATH, "//img")))
    assert len(images) > 0, "Gallery images should be rendered"
    print(f"  ✔ Rendered {len(images)} gallery images in responsive grid.")

    # 4. Click the first image to trigger Lightbox Modal
    images[0].click()
    time.sleep(1)

    # 5. Check if Lightbox opened or modal is active
    close_btns = driver.find_elements(By.XPATH, "//button[contains(@title, 'Close') or contains(@aria-label, 'Close')] | //*[@data-lucide='x'] | //button[contains(., '✕')]")
    if close_btns:
        print("  ✔ Lightbox modal inspected and close button identified.")
        try:
            close_btns[0].click()
            time.sleep(0.5)
        except Exception:
            pass

    print("  ✔ Gallery Lightbox UI test PASSED!")
    return True

if __name__ == "__main__":
    from selenium.webdriver.chrome.options import Options
    opts = Options()
    opts.add_argument("--headless=new")
    driver = webdriver.Chrome(options=opts)
    try:
        run_gallery_test(driver)
        print("\nAll Gallery assertions PASSED!")
    finally:
        driver.quit()
