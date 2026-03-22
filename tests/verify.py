from playwright.sync_api import sync_playwright
import time, json

p = sync_playwright().start()
b = p.chromium.launch(args=["--disable-cache", "--aggressive-cache-discard"])
ctx = b.new_context(viewport={"width": 1400, "height": 900}, bypass_csp=True)
page = ctx.new_page()
page.route("**/*", lambda route: route.continue_(headers={**route.request.headers, "Cache-Control": "no-cache", "Pragma": "no-cache"}))

# 监听图片加载
img_urls = []
page.on("response", lambda resp: img_urls.append(resp.url) if "office_bg" in resp.url and "webp" in resp.url else None)

url = "http://127.0.0.1:19000/?t=" + str(int(time.time()))
page.goto(url, timeout=60000, wait_until="domcontentloaded")
page.wait_for_timeout(10000)

print("Loaded office_bg URLs:")
for u in img_urls:
    print(f"  {u}")

page.screenshot(path="verify_nocache.png")
ctx.close()
b.close()
p.stop()
print("Done")
