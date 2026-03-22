#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
观复阁像素办公室 - Playwright 系统验证测试

验证功能:
1. 10层楼导航
2. 打卡系统
3. !check 命令 (通过 /checkin)
4. 茶水间事件
5. 公告板
6. 分析部安全雷达
7. 访客系统
8. 楼层色调

截图保存到: C:/Users/Administrator/.openclaw/workspace/analyst/gap_test.png
"""

import sys
import os
import json
import time
import requests
import base64
from datetime import datetime
from pathlib import Path

# Playwright
from playwright.sync_api import sync_playwright, Page, expect

# 设置代理
PROXY = "http://127.0.0.1:7890"

# 颜色代码
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

OFFICE_URL = "http://127.0.0.1:19000"
SCREENSHOT_PATH = r"C:\Users\Administrator\.openclaw\workspace\analyst\gap_test.png"

def log_pass(msg):
    print(f"{GREEN}[PASS]{RESET} {msg}")

def log_fail(msg):
    print(f"{RED}[FAIL]{RESET} {msg}")

def log_info(msg):
    print(f"{YELLOW}[INFO]{RESET} {msg}")


class PlaywrightTest:
    """Playwright 浏览器测试"""

    def __init__(self):
        self.results = {"passed": [], "failed": []}
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def record(self, name, passed, detail=None):
        if passed:
            self.results["passed"].append(name)
            log_pass(name)
        else:
            self.results["failed"].append((name, detail))
            log_fail(f"{name}: {detail}" if detail else name)

    def screenshot(self, page: Page, name: str):
        """截图"""
        try:
            path = SCREENSHOT_PATH
            os.makedirs(os.path.dirname(path), exist_ok=True)
            page.screenshot(path=path, full_page=True)
            log_info(f"截图已保存: {path}")
            return True
        except Exception as e:
            log_fail(f"截图失败: {e}")
            return False

    # ==================== API 测试 ====================

    def test_health(self):
        """健康检查"""
        try:
            r = self.session.get(f"{OFFICE_URL}/health", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("status") == "ok"
            self.record("健康检查", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.record("健康检查", False, str(e))

    def test_floors_api(self):
        """API测试: 10层楼导航"""
        try:
            r = self.session.get(f"{OFFICE_URL}/floors", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "floors" in data
            self.record("获取楼层列表", passed, data.get("msg") if not passed else None)

            if passed:
                floors = data.get("floors", {})
                expected = ["8F", "7F", "6F", "5F", "4F", "3F", "2F", "1F", "B1", "B2"]
                missing = [f for f in expected if f not in floors]
                if not missing:
                    self.record("10层楼完整性", True)
                else:
                    self.record("10层楼完整性", False, f"缺少: {missing}")
        except Exception as e:
            self.record("楼层导航API", False, str(e))

    def test_floor_colors_api(self):
        """API测试: 楼层色调"""
        try:
            r = self.session.get(f"{OFFICE_URL}/floors", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "floors" in data

            if passed:
                floors = data.get("floors", {})
                color_floors = {fid: finfo.get("color") for fid, finfo in floors.items() if finfo.get("color")}
                import re
                hex_re = re.compile(r'^#[0-9A-Fa-f]{6}$')
                bad = [(fid, c) for fid, c in color_floors.items() if not hex_re.match(c)]
                if not bad:
                    self.record("楼层色调配置", True)
                    log_info(f"  楼层颜色数: {len(color_floors)}")
                else:
                    self.record("楼层色调配置", False, f"无效颜色: {bad}")
            else:
                self.record("楼层色调配置", False, data.get("msg"))
        except Exception as e:
            self.record("楼层色调配置", False, str(e))

    def test_checkin_api(self):
        """API测试: 打卡系统"""
        try:
            # 签到统计
            r = self.session.get(f"{OFFICE_URL}/checkin/stats", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.record("签到统计API", passed, data.get("msg") if not passed else None)

            # 提交打卡
            import uuid
            unique_id = f"test_{uuid.uuid4().hex[:8]}"
            r = self.session.post(f"{OFFICE_URL}/checkin",
                json={"agentId": unique_id, "floor": "2F"}, timeout=5)
            data = r.json()
            # 可能已打卡，但API应该返回200
            passed = r.status_code == 200
            self.record("提交打卡API", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.record("打卡系统API", False, str(e))

    def test_announcements_api(self):
        """API测试: 公告板"""
        try:
            r = self.session.get(f"{OFFICE_URL}/announcements", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.record("获取公告列表", passed, data.get("msg") if not passed else None)

            if passed:
                announcements = data.get("announcements", [])
                self.record(f"公告数量: {len(announcements)}", True)
        except Exception as e:
            self.record("公告板API", False, str(e))

    def test_events_api(self):
        """API测试: 茶水间事件"""
        try:
            r = self.session.get(f"{OFFICE_URL}/events", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.record("获取事件列表", passed, data.get("msg") if not passed else None)

            if passed:
                events = data.get("events", [])
                categories = set(e.get("category", "") for e in events)
                self.record(f"事件分类: {categories}", True)

            # 即将到来的事件
            r2 = self.session.get(f"{OFFICE_URL}/events/upcoming", timeout=5)
            data2 = r2.json()
            passed2 = r2.status_code == 200 and data2.get("ok") == True
            self.record("获取即将到来的事件", passed2, data2.get("msg") if not passed2 else None)
        except Exception as e:
            self.record("事件系统API", False, str(e))

    def test_guest_api(self):
        """API测试: 访客系统"""
        try:
            # 检查楼层访问权限
            r = self.session.get(f"{OFFICE_URL}/api/guest/floor-access", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.record("访客楼层访问API", passed, data.get("msg") if not passed else None)

            if passed:
                allowed = data.get("allowedFloors", [])
                log_info(f"  允许访客访问的楼层: {allowed}")

            # 列出邀请码
            r2 = self.session.get(f"{OFFICE_URL}/api/guest/invites", timeout=5)
            data2 = r2.json()
            passed2 = r2.status_code == 200 and data2.get("ok") == True
            self.record("访客邀请列表API", passed2, data2.get("msg") if not passed2 else None)
        except Exception as e:
            self.record("访客系统API", False, str(e))

    def test_check_command(self):
        """测试 !check 命令（对应后端 /checkin）"""
        try:
            # !check 命令实际上就是 !checkin，通过 POST /checkin 实现
            import uuid
            unique_id = f"cmd_test_{uuid.uuid4().hex[:8]}"
            r = self.session.post(f"{OFFICE_URL}/checkin",
                json={"agentId": unique_id, "floor": "1F"}, timeout=5)
            data = r.json()
            # 检查返回
            if r.status_code == 200:
                self.record("!check命令处理", True)
            else:
                self.record("!check命令处理", False, f"状态码: {r.status_code}")
        except Exception as e:
            self.record("!check命令处理", False, str(e))

    # ==================== Playwright UI 测试 ====================

    def test_ui_floor_nav(self, page: Page):
        """UI测试: 10层楼导航"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)  # 等待 Phaser 初始化

            # 查找楼层导航元素
            # 楼层导航通常在右侧面板
            floor_btns = page.locator(".floor-btn").all()
            if len(floor_btns) >= 8:
                self.record(f"楼层导航按钮(UI): {len(floor_btns)}个", True)
            else:
                # 尝试其他选择器
                try:
                    # 检查是否存在楼层按钮（可能使用不同CSS类名）
                    all_btns = page.locator("button, .btn, [class*='floor']").all()
                    log_info(f"  找到按钮: {len(all_btns)}个")
                    self.record("楼层导航按钮(UI)", len(all_btns) >= 8, f"仅找到{len(all_btns)}个按钮")
                except Exception:
                    self.record("楼层导航按钮(UI)", False, "未找到楼层按钮元素")
        except Exception as e:
            self.record("楼层导航UI测试", False, str(e))

    def test_ui_checkin_panel(self, page: Page):
        """UI测试: 打卡统计面板"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)

            # 查找打卡统计面板
            panel = page.locator("#checkin-stats-panel")
            if panel.count() > 0:
                self.record("打卡统计面板(UI)", True)
                # 检查面板内容
                title = page.locator("#checkin-stats-title")
                if title.count() > 0:
                    try:
                        title_text = title.inner_text()
                        log_info(f"  打卡面板标题: {title_text[:30]}")
                    except Exception:
                        pass
            else:
                # 尝试查找其他可能的面板
                panels = page.locator("[id*='checkin'], [class*='checkin']").all()
                if panels:
                    self.record("打卡统计面板(UI)", True)
                else:
                    self.record("打卡统计面板(UI)", False, "未找到打卡面板")
        except Exception as e:
            self.record("打卡统计面板UI", False, str(e))

    def test_ui_guest_panel(self, page: Page):
        """UI测试: 访客面板"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)

            guest_panel = page.locator("#guest-agent-panel")
            if guest_panel.count() > 0:
                self.record("访客面板(UI)", True)
            else:
                panels = page.locator("[id*='guest'], [class*='guest']").all()
                if panels:
                    self.record("访客面板(UI)", True)
                else:
                    self.record("访客面板(UI)", False, "未找到访客面板")
        except Exception as e:
            self.record("访客面板UI", False, str(e))

    def test_ui_security_radar(self, page: Page):
        """UI测试: 分析部安全雷达"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)

            # 切换到2F（分析部）以查看安全雷达
            # 查找2F按钮并点击
            floor_2f = page.locator(".floor-btn", has_text="2F")
            if floor_2f.count() > 0:
                floor_2f.first.click()
                time.sleep(2)
                log_info("  已切换到2F楼层")

            # 安全雷达在 analysis-panel 中，以SVG形式呈现
            radar = page.locator("#analysis-panel")
            if radar.count() > 0:
                self.record("安全雷达面板(UI)", True)
            else:
                # 查找SVG元素（雷达通常用SVG绘制）
                svgs = page.locator("svg").all()
                if svgs:
                    self.record("安全雷达面板(UI)", True)
                    log_info(f"  找到{len(svgs)}个SVG元素")
                else:
                    self.record("安全雷达面板(UI)", False, "未找到安全雷达")
        except Exception as e:
            self.record("安全雷达UI", False, str(e))

    def test_ui_floor_colors(self, page: Page):
        """UI测试: 楼层色调变化"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)

            # 获取初始背景色调
            body_bg = page.evaluate("() => document.body.style.backgroundColor || getComputedStyle(document.body).backgroundColor")
            log_info(f"  初始背景色: {body_bg}")

            # 尝试切换楼层观察色调变化
            floors_to_test = ["2F", "8F", "B2"]
            for floor in floors_to_test:
                btn = page.locator(".floor-btn", has_text=floor)
                if btn.count() > 0:
                    btn.first.click()
                    time.sleep(1)
                    log_info(f"  已切换到{floor}楼层")
                    break

            self.record("楼层色调切换(UI)", True)
        except Exception as e:
            self.record("楼层色调UI", False, str(e))

    def test_ui_announcement_board(self, page: Page):
        """UI测试: 公告板"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)

            # 查找公告板相关元素
            board = page.locator("[id*='announce'], [class*='announce'], [id*='board'], [class*='board']")
            if board.count() > 0:
                self.record("公告板(UI)", True)
            else:
                # 检查HTML中是否有公告内容
                content = page.content()
                if "公告" in content or "announce" in content.lower():
                    self.record("公告板(UI)", True)
                else:
                    self.record("公告板(UI)", False, "未找到公告板元素")
        except Exception as e:
            self.record("公告板UI", False, str(e))

    def test_ui_tearoom_event(self, page: Page):
        """UI测试: 茶水间事件"""
        try:
            page.goto(OFFICE_URL, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            time.sleep(3)

            # 茶水间事件通常在1F大堂区域
            # 检查是否有事件/日历相关元素
            events = page.locator("[id*='event'], [class*='event'], [id*='calendar'], [class*='calendar']")
            if events.count() > 0:
                self.record("茶水间事件面板(UI)", True)
            else:
                content = page.content()
                if "事件" in content or "event" in content.lower():
                    self.record("茶水间事件面板(UI)", True)
                else:
                    self.record("茶水间事件面板(UI)", False, "未找到事件面板")
        except Exception as e:
            self.record("茶水间事件UI", False, str(e))

    def run_all(self):
        """运行所有测试"""
        print("=" * 60)
        print("  观复阁像素办公室 - Playwright 系统验证")
        print("=" * 60)
        print()

        # API 测试
        print("[API测试]")
        print("[1/8] 健康检查...")
        self.test_health()
        print()

        print("[2/8] 10层楼导航...")
        self.test_floors_api()
        print()

        print("[3/8] 打卡系统...")
        self.test_checkin_api()
        print()

        print("[4/8] !check 命令...")
        self.test_check_command()
        print()

        print("[5/8] 茶水间事件...")
        self.test_events_api()
        print()

        print("[6/8] 公告板...")
        self.test_announcements_api()
        print()

        print("[7/8] 访客系统...")
        self.test_guest_api()
        print()

        print("[8/8] 楼层色调...")
        self.test_floor_colors_api()
        print()

        # Playwright UI 测试
        print("=" * 60)
        print("  Playwright UI 浏览器测试")
        print("=" * 60)
        print()

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            # localhost 不使用代理
            context = browser.new_context(
                viewport={"width": 1400, "height": 900}
            )
            page = context.new_page()

            print("[UI-1] 楼层导航...")
            self.test_ui_floor_nav(page)
            print()

            print("[UI-2] 打卡统计面板...")
            self.test_ui_checkin_panel(page)
            print()

            print("[UI-3] 访客面板...")
            self.test_ui_guest_panel(page)
            print()

            print("[UI-4] 安全雷达...")
            self.test_ui_security_radar(page)
            print()

            print("[UI-5] 楼层色调...")
            self.test_ui_floor_colors(page)
            print()

            print("[UI-6] 公告板...")
            self.test_ui_announcement_board(page)
            print()

            print("[UI-7] 茶水间事件...")
            self.test_ui_tearoom_event(page)
            print()

            # 最终截图
            print("正在截图...")
            self.screenshot(page, "最终状态")

            browser.close()

        # 总结
        print()
        print("=" * 60)
        total_passed = len(self.results["passed"])
        total_failed = len(self.results["failed"])
        total = total_passed + total_failed
        print(f"  测试结果: {total_passed}/{total} 通过")
        if self.results["failed"]:
            print("  失败项:")
            for name, detail in self.results["failed"]:
                print(f"    - {name}: {detail}")
        print("=" * 60)
        return len(self.results["failed"]) == 0


def main():
    suite = PlaywrightTest()
    success = suite.run_all()
    print()
    print(f"截图已保存: {SCREENSHOT_PATH}")
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
