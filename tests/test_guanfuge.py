#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
观复阁像素办公室 - 单元测试套件

测试方法:
1. 确保后端服务已启动 (python backend/app.py)
2. 运行此测试脚本: python test_guanfuge.py
3. 观察办公室页面状态变化

覆盖功能:
- 10层楼导航
- 打卡系统 (!checkin)
- !check 命令 (通过 /checkin API)
- 茶水间事件
- 公告板
- 签到统计面板
- 楼层色调变化
- 访客系统
- 分析部安全雷达面板
"""

import sys
import os
import json
import time
import requests
from datetime import datetime, timedelta
from pathlib import Path

# 确保使用UTF-8编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent))

OFFICE_URL = "http://127.0.0.1:19000"
CONFIG_FILE = Path(__file__).parent / "guanfuge-config.json"
DATA_DIR = Path(__file__).parent / "data"

# 颜色代码
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def log_pass(msg):
    print(f"{GREEN}[PASS]{RESET} {msg}")

def log_fail(msg):
    print(f"{RED}[FAIL]{RESET} {msg}")

def log_info(msg):
    print(f"{YELLOW}[INFO]{RESET} {msg}")


class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def record(self, name, passed, error_msg=None):
        if passed:
            self.passed += 1
            log_pass(name)
        else:
            self.failed += 1
            self.errors.append((name, error_msg))
            log_fail(f"{name}: {error_msg}" if error_msg else name)

    def summary(self):
        total = self.passed + self.failed
        print()
        print("=" * 60)
        print(f"  测试结果: {self.passed}/{total} 通过")
        if self.errors:
            print("  失败项:")
            for name, msg in self.errors:
                print(f"    - {name}: {msg}")
        print("=" * 60)
        return self.failed == 0


class TestGuanfuge:
    """观复阁测试套件"""

    def __init__(self):
        self.results = TestResults()
        self.base_url = OFFICE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def test_health(self):
        """测试服务健康状态"""
        try:
            r = self.session.get(f"{self.base_url}/health", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("status") == "ok"
            self.results.record("健康检查", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("健康检查", False, str(e))

    def test_floors(self):
        """测试10层楼导航"""
        try:
            # 获取楼层列表
            r = self.session.get(f"{self.base_url}/floors", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "floors" in data
            self.results.record("获取楼层列表", passed, data.get("msg") if not passed else None)
            
            if passed:
                floors = data.get("floors", {})
                expected_floors = ["8F", "7F", "6F", "5F", "4F", "3F", "2F", "1F", "B1", "B2"]
                for floor_id in expected_floors:
                    if floor_id not in floors:
                        self.results.record(f"楼层 {floor_id} 存在", False, "不存在")
                        break
                else:
                    self.results.record("10层楼完整性", True)

        except Exception as e:
            self.results.record("楼层导航", False, str(e))

        # 测试获取当前楼层
        try:
            r = self.session.get(f"{self.base_url}/floor/current", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "currentFloor" in data
            self.results.record("获取当前楼层", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("获取当前楼层", False, str(e))

        # 测试设置楼层
        try:
            r = self.session.post(f"{self.base_url}/floor/set", json={"floor": "6F"}, timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("设置楼层到6F", passed, data.get("msg") if not passed else None)
            
            # 验证楼层已更改
            if passed:
                r2 = self.session.get(f"{self.base_url}/floor/current", timeout=5)
                data2 = r2.json()
                if data2.get("currentFloor") == "6F":
                    log_pass("楼层变更验证")
                else:
                    log_fail(f"楼层变更验证: 期望6F, 实际{data2.get('currentFloor')}")
            
            # 恢复原楼层
            self.session.post(f"{self.base_url}/floor/set", json={"floor": "2F"}, timeout=5)
        except Exception as e:
            self.results.record("设置楼层", False, str(e))

    def test_checkin(self):
        """测试打卡系统"""
        # 测试签到统计
        try:
            r = self.session.get(f"{self.base_url}/checkin/stats", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("签到统计接口", passed, data.get("msg") if not passed else None)
            
            if passed:
                # 验证签到数据结构
                stats_fields = ["todayChecked", "monthCount", "totalCheckins", "weekDays", "lastCheckin"]
                for field in stats_fields:
                    if field not in data:
                        self.results.record(f"签到统计字段 {field}", False, "缺失")
                        break
                else:
                    self.results.record("签到统计数据完整性", True)
        except Exception as e:
            self.results.record("签到统计", False, str(e))

        # 测试提交打卡(使用唯一ID避免重复签到)
        try:
            import uuid
            unique_id = f"test_{uuid.uuid4().hex[:8]}"
            r = self.session.post(f"{self.base_url}/checkin", 
                json={"agentId": unique_id, "floor": "2F"},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("提交打卡", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("提交打卡", False, str(e))

    def test_announcements(self):
        """测试公告板"""
        try:
            r = self.session.get(f"{self.base_url}/announcements", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("获取公告列表", passed, data.get("msg") if not passed else None)
            
            if passed:
                announcements = data.get("announcements", [])
                self.results.record(f"公告数量: {len(announcements)}", True)
        except Exception as e:
            self.results.record("公告板", False, str(e))

        # 测试创建公告
        try:
            r = self.session.post(f"{self.base_url}/announcements",
                json={
                    "title": "测试公告",
                    "content": "这是自动化测试创建的公告",
                    "priority": "normal",
                    "author": "test_agent"
                },
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("创建公告", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("创建公告", False, str(e))

    def test_events(self):
        """测试事件系统(茶水间事件等)"""
        try:
            r = self.session.get(f"{self.base_url}/events", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("获取事件列表", passed, data.get("msg") if not passed else None)
            
            if passed:
                events = data.get("events", [])
                categories = set(e.get("category", "") for e in events)
                self.results.record(f"事件分类: {categories}", True)
        except Exception as e:
            self.results.record("事件系统", False, str(e))

        # 测试即将到来的事件
        try:
            r = self.session.get(f"{self.base_url}/events/upcoming", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("获取即将到来的事件", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("即将到来的事件", False, str(e))

        # 测试创建事件
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            r = self.session.post(f"{self.base_url}/events",
                json={
                    "title": "测试会议",
                    "date": tomorrow,
                    "time": "14:00",
                    "description": "自动化测试创建的事件",
                    "category": "meeting",
                    "participants": ["test_agent"]
                },
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("创建事件", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("创建事件", False, str(e))

    def test_agents(self):
        """测试Agent系统"""
        try:
            r = self.session.get(f"{self.base_url}/agents", timeout=5)
            agents = r.json()
            passed = isinstance(agents, list)
            self.results.record("获取Agent列表", passed)
            
            if passed:
                for agent in agents:
                    required_fields = ["agentId", "name", "state", "floor"]
                    for field in required_fields:
                        if field not in agent:
                            self.results.record(f"Agent字段 {field}", False, "缺失")
                            break
                    else:
                        pass  # log_pass handled below
                    break
                self.results.record("Agent数据结构", True)
        except Exception as e:
            self.results.record("Agent系统", False, str(e))

    def test_floor_colors(self):
        """测试楼层色调变化"""
        try:
            r = self.session.get(f"{self.base_url}/floors", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "floors" in data
            
            if passed:
                floors = data.get("floors", {})
                color_floors = [fid for fid, finfo in floors.items() if "color" in finfo]
                
                if len(color_floors) == 10:
                    log_pass(f"所有10层楼都有颜色配置")
                else:
                    log_fail(f"有颜色的楼层: {len(color_floors)}/10")
                
                # 验证每个楼层颜色都是有效的hex颜色
                import re
                hex_color_re = re.compile(r'^#[0-9A-Fa-f]{6}$')
                for fid, finfo in floors.items():
                    color = finfo.get("color", "")
                    if color and not hex_color_re.match(color):
                        self.results.record(f"楼层 {fid} 颜色格式", False, f"无效颜色: {color}")
                        break
                else:
                    self.results.record("楼层颜色格式(hex)", True)
            else:
                self.results.record("楼层颜色配置", False, data.get("msg"))
        except Exception as e:
            self.results.record("楼层颜色", False, str(e))

    def test_check_command(self):
        """测试 !check 命令 (通过 /checkin API)"""
        # !check 命令映射到 POST /checkin
        try:
            import uuid
            unique_id = f"cmd_test_{uuid.uuid4().hex[:8]}"
            r = self.session.post(f"{self.base_url}/checkin",
                json={"agentId": unique_id, "floor": "1F"},
                timeout=5)
            data = r.json()
            # 成功返回 200，ok=True 或已签到
            passed = r.status_code == 200
            if passed:
                if data.get("ok") == True:
                    self.results.record("!check命令处理", True)
                elif data.get("alreadyCheckedIn"):
                    # 已签到也是正常行为
                    self.results.record("!check命令处理(重复签到)", True)
                else:
                    self.results.record("!check命令处理", False, f"意外响应: {data}")
            else:
                self.results.record("!check命令处理", False, f"HTTP {r.status_code}: {data}")
        except Exception as e:
            self.results.record("!check命令处理", False, str(e))

        # 测试获取签到统计（!check 后验证状态）
        try:
            r = self.session.get(f"{self.base_url}/checkin/stats", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("!check状态验证", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("!check状态验证", False, str(e))

    def test_visitor_system(self):
        """测试访客系统"""
        # 访客楼层访问权限
        try:
            r = self.session.get(f"{self.base_url}/api/guest/floor-access", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("访客楼层访问API", passed, data.get("msg") if not passed else None)

            if passed:
                allowed = data.get("allowedFloors", [])
                default = data.get("defaultFloor", "")
                if len(allowed) >= 3:
                    log_pass(f"访客可访问楼层: {allowed}, 默认: {default}")
                else:
                    self.results.record("访客楼层数量", False, f"仅{len(allowed)}个楼层")
        except Exception as e:
            self.results.record("访客楼层访问API", False, str(e))

        # 访客邀请列表
        try:
            r = self.session.get(f"{self.base_url}/api/guest/invites", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("访客邀请列表API", passed, data.get("msg") if not passed else None)

            if passed:
                invites = data.get("invites", [])
                self.results.record(f"访客邀请数量: {len(invites)}", True)
        except Exception as e:
            self.results.record("访客邀请列表API", False, str(e))

        # 验证访客邀请码
        try:
            r = self.session.post(f"{self.base_url}/api/guest/validate",
                json={"code": "INVALID_CODE_12345"},
                timeout=5)
            # 无效码应返回404或403
            passed = r.status_code in (400, 403, 404)
            self.results.record("访客邀请码验证(无效码)", passed, f"HTTP {r.status_code}")
        except Exception as e:
            self.results.record("访客邀请码验证(无效码)", False, str(e))

        # 创建访客邀请码
        try:
            r = self.session.post(f"{self.base_url}/api/guest/invite",
                json={"adminKey": "guanfu-admin-2026"},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("创建访客邀请码", passed, data.get("msg") if not passed else None)

            if passed:
                code = data.get("inviteCode", "")
                log_pass(f"邀请码: {code}")
        except Exception as e:
            self.results.record("创建访客邀请码", False, str(e))

    def test_security_radar(self):
        """测试分析部安全雷达面板"""
        # 安全雷达是前端面板，验证 API 状态用于驱动雷达
        try:
            r = self.session.get(f"{self.base_url}/agents", timeout=5)
            agents = r.json()
            passed = isinstance(agents, list)
            self.results.record("安全雷达-获取Agent列表", passed)

            if passed:
                # 分析部在2F，检查是否有Agent在分析部
                floor_2f_agents = [a for a in agents if a.get("floor") == "2F"]
                self.results.record(f"分析部(2F) Agent数量: {len(floor_2f_agents)}", True)
        except Exception as e:
            self.results.record("安全雷达-Agent列表", False, str(e))

        # 验证楼层配置中2F为分析部
        try:
            r = self.session.get(f"{self.base_url}/floors", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "floors" in data
            self.results.record("安全雷达-楼层配置获取", passed, data.get("msg") if not passed else None)

            if passed:
                floors = data.get("floors", {})
                floor_2f = floors.get("2F", {})
                if floor_2f.get("type") == "department" and "分析" in floor_2f.get("name", ""):
                    self.results.record("安全雷达-2F分析部配置", True)
                else:
                    self.results.record("安全雷达-2F分析部配置", False, f"2F配置: {floor_2f}")
        except Exception as e:
            self.results.record("安全雷达-2F分析部配置", False, str(e))

        # 验证前端分析部面板入口存在
        try:
            r = self.session.get(f"{self.base_url}/", timeout=5)
            html = r.text
            if "showAnalysisPanel" in html or "analysis" in html.lower():
                self.results.record("安全雷达-前端面板入口", True)
            else:
                self.results.record("安全雷达-前端面板入口", False, "未找到showAnalysisPanel")
        except Exception as e:
            self.results.record("安全雷达-前端面板入口", False, str(e))

    def run_all(self):
        """运行所有测试"""
        print("=" * 60)
        print("  观复阁像素办公室 - 单元测试套件")
        print("=" * 60)
        print()

        print("[1/10] 健康检查...")
        self.test_health()
        print()

        print("[2/10] 10层楼导航...")
        self.test_floors()
        print()

        print("[3/10] 打卡系统...")
        self.test_checkin()
        print()

        print("[4/10] !check 命令...")
        self.test_check_command()
        print()

        print("[5/10] 公告板...")
        self.test_announcements()
        print()

        print("[6/10] 事件系统...")
        self.test_events()
        print()

        print("[7/10] 访客系统...")
        self.test_visitor_system()
        print()

        print("[8/10] Agent系统...")
        self.test_agents()
        print()

        print("[9/10] 楼层色调变化...")
        self.test_floor_colors()
        print()

        print("[10/10] 分析部安全雷达...")
        self.test_security_radar()
        print()

        return self.results.summary()


def main():
    """主入口"""
    suite = TestGuanfuge()
    success = suite.run_all()
    
    print()
    print(f"测试完成! 访问 http://127.0.0.1:19000 查看办公室状态")
    print()
    
    # 返回退出码
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
