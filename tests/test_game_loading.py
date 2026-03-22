#!/usr/bin/env python3
"""Test script to diagnose Phaser 3 game loading issues"""

from playwright.sync_api import sync_playwright
import time

def test_game_loading():
    console_logs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        # Capture page errors
        page.on('pageerror', lambda err: console_logs.append(f"[PAGE ERROR] {err}"))

        # Capture failed requests
        page.on('requestfailed', lambda req: console_logs.append(f"[REQUEST FAILED] {req.url} - {req.failure}"))

        print("Navigating to http://localhost:19000/...")
        page.goto('http://localhost:19000/', timeout=30000)

        print("Waiting for network idle...")
        page.wait_for_load_state('networkidle', timeout=15000)

        # Wait a bit for Phaser to initialize
        print("Waiting 5 seconds for game initialization...")
        time.sleep(5)

        # Take screenshot
        screenshot_path = "E:/guanfu/Star-Office-UI/test_screenshots/game_loading_test.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to: {screenshot_path}")

        # Check loading overlay state
        loading_overlay = page.query_selector('#loading-overlay')
        if loading_overlay:
            overlay_style = loading_overlay.get_attribute('style') or ''
            overlay_display = loading_overlay.evaluate('el => window.getComputedStyle(el).display')
            print(f"Loading overlay display: {overlay_display}")

        # Check game container
        game_container = page.query_selector('#game-container')
        if game_container:
            canvas = game_container.query_selector('canvas')
            if canvas:
                print(f"Canvas found: {canvas.get_attribute('width')}x{canvas.get_attribute('height')}")
            else:
                print("No canvas found in game container!")

        # Check if Phaser global exists
        has_phaser = page.evaluate('typeof Phaser !== "undefined"')
        has_game = page.evaluate('typeof game !== "undefined"')
        has_config = page.evaluate('typeof window.config !== "undefined"')
        has_preload = page.evaluate('typeof window.preload !== "undefined"')
        has_create = page.evaluate('typeof window.create !== "undefined"')
        has_update = page.evaluate('typeof window.update !== "undefined"')

        print(f"\n--- Diagnostics ---")
        print(f"Phaser loaded: {has_phaser}")
        print(f"window.config exists: {has_config}")
        print(f"window.preload exists: {has_preload}")
        print(f"window.create exists: {has_create}")
        print(f"window.update exists: {has_update}")
        print(f"game instance exists: {has_game}")

        # Check scene config
        scene_config = page.evaluate('window.config && window.config.scene')
        print(f"Scene config: {scene_config}")

        browser.close()

    print(f"\n--- Console Logs ({len(console_logs)} total) ---")
    for log in console_logs:
        print(log)

if __name__ == "__main__":
    test_game_loading()
