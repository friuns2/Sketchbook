from playwright.sync_api import sync_playwright

def verify_ai_settings():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming it runs on port 8080 or 8081 based on webpack dev server defaults)
        # I'll check the server log or try common ports.
        try:
            page.goto("http://localhost:8080", timeout=10000)
        except:
             try:
                 page.goto("http://localhost:8081", timeout=10000)
             except:
                 print("Could not connect to localhost:8080 or 8081")
                 return

        # Wait for the GUI to load (it might take a moment due to 'world.glb' loading and setTimeout)
        page.wait_for_timeout(2000)

        # The dat.GUI is usually added to the body or a specific container.
        # We need to find the "AI Settings" folder.
        # dat.GUI renders folders as list items <li> with class 'folder'.
        # The title is inside a span or div.

        # Screenshot the whole page to see the GUI
        page.screenshot(path="verification/initial_load.png")

        # Try to open "AI Settings" folder
        # Find element with text "AI Settings"
        ai_settings = page.get_by_text("AI Settings")
        if ai_settings.is_visible():
            ai_settings.click()
            page.wait_for_timeout(500)
            page.screenshot(path="verification/ai_settings_open.png")
            print("AI Settings folder found and clicked.")
        else:
            print("AI Settings folder not found.")

        browser.close()

if __name__ == "__main__":
    verify_ai_settings()
