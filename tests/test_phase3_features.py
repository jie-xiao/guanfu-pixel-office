#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
观复阁像素办公室 - Phase 3 功能测试套件

测试内容:
1. 访客邀请系统 (Guest Invite System)
2. 串门通知系统 (Visit Notification System)
3. 骰子游戏 (!dice)
4. 投票系统 (!vote)
5. 部门Buff显示验证
6. 工位升级系统验证

使用方法:
    python test_phase3_features.py
"""

import sys
import os
import json
import time
import requests
from datetime import datetime
from pathlib import Path

# 确保使用UTF-8编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).parent))

OFFICE_URL = "http://127.0.0.1:19000"

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


class Phase3TestResults:
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
        print(f"  Phase 3 测试结果: {self.passed}/{total} 通过")
        if self.errors:
            print("  失败项:")
            for name, msg in self.errors:
                print(f"    - {name}: {msg}")
        print("=" * 60)
        return self.failed == 0


class TestPhase3:
    """Phase 3 功能测试"""

    def __init__(self):
        self.results = Phase3TestResults()
        self.base_url = OFFICE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def test_health(self):
        """健康检查"""
        try:
            r = self.session.get(f"{self.base_url}/health", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("status") == "ok"
            self.results.record("Backend健康检查", passed, data.get("msg") if not passed else None)
        except Exception as e:
            self.results.record("Backend健康检查", False, str(e))

    # ===== 1. 访客邀请系统 =====

    def test_guest_invite_create(self):
        """测试创建访客邀请码"""
        try:
            r = self.session.post(f"{self.base_url}/api/guest/invite",
                json={"adminKey": "guanfu-admin-2026"},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("创建访客邀请码", passed, data.get("msg") if not passed else None)

            if passed:
                code = data.get("inviteCode", "")
                expires = data.get("expiresAt", "")
                join_url = data.get("joinUrl", "")
                log_info(f"  邀请码: {code}")
                log_info(f"  过期时间: {expires}")
                log_info(f"  加入链接: {join_url}")
                return code
            return None
        except Exception as e:
            self.results.record("创建访客邀请码", False, str(e))
            return None

    def test_guest_invite_list(self):
        """测试列出所有邀请码"""
        try:
            r = self.session.get(f"{self.base_url}/api/guest/invites", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("列出访客邀请码", passed, data.get("msg") if not passed else None)

            if passed:
                invites = data.get("invites", [])
                log_info(f"  当前邀请码数量: {len(invites)}")
        except Exception as e:
            self.results.record("列出访客邀请码", False, str(e))

    def test_guest_invite_validate(self):
        """测试验证邀请码"""
        # 先创建一个邀请码
        try:
            r = self.session.post(f"{self.base_url}/api/guest/invite",
                json={"adminKey": "guanfu-admin-2026"},
                timeout=5)
            data = r.json()
            if not data.get("ok"):
                self.results.record("验证邀请码", False, "无法创建邀请码")
                return

            code = data.get("inviteCode", "")

            # 验证有效码
            r = self.session.post(f"{self.base_url}/api/guest/validate",
                json={"code": code},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("valid") == True
            self.results.record("验证有效邀请码", passed, data.get("msg") if not passed else None)

            # 验证无效码
            r = self.session.post(f"{self.base_url}/api/guest/validate",
                json={"code": "INVALID_CODE_XYZ"},
                timeout=5)
            passed = r.status_code in (400, 403, 404)
            self.results.record("验证无效邀请码", passed, f"HTTP {r.status_code}")

        except Exception as e:
            self.results.record("验证邀请码", False, str(e))

    def test_guest_join(self):
        """测试访客加入"""
        try:
            # 先创建邀请码
            r = self.session.post(f"{self.base_url}/api/guest/invite",
                json={"adminKey": "guanfu-admin-2026"},
                timeout=5)
            data = r.json()
            if not data.get("ok"):
                self.results.record("访客加入", False, "无法创建邀请码")
                return

            code = data.get("inviteCode", "")

            # 访客加入
            r = self.session.post(f"{self.base_url}/api/guest/join",
                json={"name": "测试访客_Phase3", "inviteCode": code},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("访客加入", passed, data.get("msg") if not passed else None)

            if passed:
                log_info(f"  AgentId: {data.get('agentId')}")
                log_info(f"  楼层: {data.get('guestFloor')}")
                log_info(f"  有效期: {data.get('expiresAt')}")

        except Exception as e:
            self.results.record("访客加入", False, str(e))

    def test_guest_floor_access(self):
        """测试访客楼层访问权限"""
        try:
            r = self.session.get(f"{self.base_url}/api/guest/floor-access", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("访客楼层访问API", passed, data.get("msg") if not passed else None)

            if passed:
                allowed = data.get("allowedFloors", [])
                default = data.get("defaultFloor", "")
                log_info(f"  可访问楼层: {allowed}")
                log_info(f"  默认楼层: {default}")

                if len(allowed) >= 3:
                    log_pass("  访客楼层数量正确")
                else:
                    log_fail(f"  访客楼层数量不足: {len(allowed)}")

        except Exception as e:
            self.results.record("访客楼层访问API", False, str(e))

    # ===== 2. 串门通知系统 =====

    def test_visit_notify(self):
        """测试发送串门通知"""
        try:
            r = self.session.post(f"{self.base_url}/api/visit/notify",
                json={
                    "visitorId": "test_visitor_001",
                    "visitorName": "测试访客",
                    "targetFloor": "2F",
                    "visitorAgentId": "guest_test_001"
                },
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("发送串门通知", passed, data.get("msg") if not passed else None)

            if passed:
                notif = data.get("notification", {})
                log_info(f"  通知ID: {notif.get('id')}")
                log_info(f"  访客: {notif.get('visitorName')}")
                log_info(f"  目标楼层: {notif.get('targetFloor')}")

        except Exception as e:
            self.results.record("发送串门通知", False, str(e))

    def test_visit_notifications_get(self):
        """测试获取串门通知列表"""
        try:
            r = self.session.get(f"{self.base_url}/api/visit/notifications?floor=2F", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("获取串门通知列表", passed, data.get("msg") if not passed else None)

            if passed:
                notifs = data.get("notifications", [])
                log_info(f"  通知数量: {len(notifs)}")

        except Exception as e:
            self.results.record("获取串门通知列表", False, str(e))

    def test_visit_active(self):
        """测试获取当前楼层访客"""
        try:
            r = self.session.get(f"{self.base_url}/api/visit/active?floor=GF", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("获取当前楼层访客", passed, data.get("msg") if not passed else None)

            if passed:
                visitors = data.get("visitors", [])
                log_info(f"  GF楼层访客数: {len(visitors)}")

        except Exception as e:
            self.results.record("获取当前楼层访客", False, str(e))

    # ===== 3. 骰子游戏 =====

    def test_dice_roll(self):
        """测试掷骰子"""
        try:
            r = self.session.post(f"{self.base_url}/api/breakroom/dice",
                json={"player": "测试玩家", "bet": "测试投注"},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("掷骰子", passed, data.get("msg") if not passed else None)

            if passed:
                dice1 = data.get("dice1", 0)
                dice2 = data.get("dice2", 0)
                total = data.get("total", 0)
                result = data.get("result", "")
                log_info(f"  骰子1: {dice1}, 骰子2: {dice2}, 总计: {total}")
                log_info(f"  结果: {result}")

                if 1 <= dice1 <= 6 and 1 <= dice2 <= 6:
                    log_pass("  骰子值在有效范围内")
                else:
                    log_fail(f"  骰子值无效: {dice1}, {dice2}")

        except Exception as e:
            self.results.record("掷骰子", False, str(e))

    def test_dice_history(self):
        """测试获取骰子历史"""
        try:
            r = self.session.get(f"{self.base_url}/api/breakroom/dice/history", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("获取骰子历史", passed, data.get("msg") if not passed else None)

            if passed:
                games = data.get("games", [])
                log_info(f"  历史游戏数: {len(games)}")

        except Exception as e:
            self.results.record("获取骰子历史", False, str(e))

    # ===== 4. 投票系统 =====

    def test_vote_create(self):
        """测试创建投票"""
        try:
            r = self.session.post(f"{self.base_url}/api/breakroom/vote",
                json={
                    "question": "测试投票：最喜欢哪个楼层？",
                    "options": ["1F大堂", "2F分析部", "3F工程部", "B2服务器房"],
                    "creator": "测试管理员"
                },
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("创建投票", passed, data.get("msg") if not passed else None)

            if passed:
                vote = data.get("vote", {})
                log_info(f"  投票ID: {vote.get('id')}")
                log_info(f"  问题: {vote.get('question')}")
                log_info(f"  选项数: {len(vote.get('options', []))}")
                return vote.get("id")

            return None

        except Exception as e:
            self.results.record("创建投票", False, str(e))
            return None

    def test_vote_cast(self):
        """测试投票"""
        # 先创建投票
        try:
            r = self.session.post(f"{self.base_url}/api/breakroom/vote",
                json={
                    "question": "测试投票2",
                    "options": ["选项A", "选项B", "选项C"],
                    "creator": "测试"
                },
                timeout=5)
            data = r.json()
            if not data.get("ok"):
                self.results.record("投票", False, "无法创建投票")
                return

            vote_id = data.get("vote", {}).get("id")

            # 投票
            r = self.session.post(f"{self.base_url}/api/breakroom/vote/{vote_id}",
                json={"optionIndex": 0, "voter": "测试投票者"},
                timeout=5)
            data = r.json()
            passed = r.status_code == 200 and data.get("ok") == True
            self.results.record("投票", passed, data.get("msg") if not passed else None)

            if passed:
                vote = data.get("vote", {})
                options = vote.get("options", [])
                if options and options[0].get("votes", 0) >= 1:
                    log_pass(f"  选项A票数: {options[0].get('votes')}")
                else:
                    log_fail("  投票未正确记录")

        except Exception as e:
            self.results.record("投票", False, str(e))

    def test_vote_list(self):
        """测试获取投票列表"""
        try:
            # 先创建一个投票
            self.session.post(f"{self.base_url}/api/breakroom/vote",
                json={"question": "列表测试", "options": ["A", "B"], "creator": "测试"},
                timeout=5)

            # 获取所有投票 (通过 breakroom state)
            breakroom_file = Path(__file__).parent / "breakroom-state.json"
            if breakroom_file.exists():
                with open(breakroom_file, 'r', encoding='utf-8') as f:
                    state = json.load(f)
                votes = state.get("votes", [])
                log_info(f"  投票总数: {len(votes)}")
                self.results.record("获取投票列表", True)
            else:
                self.results.record("获取投票列表", False, "breakroom-state.json不存在")

        except Exception as e:
            self.results.record("获取投票列表", False, str(e))

    # ===== 5. 部门Buff显示 =====

    def test_buff_department_info(self):
        """测试部门Buff信息获取"""
        try:
            # 检查楼层配置中的部门信息
            r = self.session.get(f"{self.base_url}/floors", timeout=5)
            data = r.json()
            passed = r.status_code == 200 and "floors" in data
            self.results.record("获取部门楼层配置", passed, data.get("msg") if not passed else None)

            if passed:
                floors = data.get("floors", {})
                # 检查分析部 (2F) 是否有Buff相关配置
                floor_2f = floors.get("2F", {})
                if floor_2f:
                    log_info(f"  2F部门: {floor_2f.get('name')}")
                    log_info(f"  2F类型: {floor_2f.get('type')}")
                    log_info(f"  2F负责人: {floor_2f.get('owner')}")

                # 检查所有部门楼层
                dept_floors = [fid for fid, finfo in floors.items()
                              if finfo.get("type") == "department"]
                log_info(f"  部门楼层数: {len(dept_floors)}")
                for fid in dept_floors:
                    finfo = floors.get(fid, {})
                    log_info(f"    {fid}: {finfo.get('name')} ({finfo.get('owner')})")

        except Exception as e:
            self.results.record("部门Buff配置", False, str(e))

    # ===== 6. 工位升级系统 =====

    def test_desk_upgrade_assets(self):
        """测试工位升级相关资源"""
        try:
            # 检查 desk_v2 资源是否存在
            r = self.session.get(f"{self.base_url}/static/desk-v2.png", timeout=5)
            passed = r.status_code == 200
            self.results.record("工位v2资源(PNG)", passed, f"HTTP {r.status_code}" if not passed else None)

            # 检查 desk 资源
            r = self.session.get(f"{self.base_url}/static/desk.png", timeout=5)
            passed = r.status_code == 200
            self.results.record("工位v1资源(PNG)", passed, f"HTTP {r.status_code}" if not passed else None)

        except Exception as e:
            self.results.record("工位升级资源", False, str(e))

    def test_workstation_info(self):
        """测试工位信息API"""
        try:
            r = self.session.get(f"{self.base_url}/api/workstation/info?agentId=star", timeout=5)
            # 这个API可能返回404或数据，看前端怎么用
            log_info(f"  工位API状态: {r.status_code}")
            if r.status_code == 200:
                data = r.json()
                log_info(f"  工位信息: {json.dumps(data, ensure_ascii=False)[:200]}")
                self.results.record("工位信息API", True)
            else:
                self.results.record("工位信息API", False, f"HTTP {r.status_code}")

        except Exception as e:
            self.results.record("工位信息API", False, str(e))

    def run_all(self):
        """运行所有Phase 3测试"""
        print("=" * 60)
        print("  观复阁像素办公室 - Phase 3 功能测试")
        print("=" * 60)
        print()

        print("[0/11] 健康检查...")
        self.test_health()
        print()

        print("[1/11] 访客邀请系统...")
        self.test_guest_invite_create()
        self.test_guest_invite_list()
        self.test_guest_invite_validate()
        self.test_guest_join()
        self.test_guest_floor_access()
        print()

        print("[2/11] 串门通知系统...")
        self.test_visit_notify()
        self.test_visit_notifications_get()
        self.test_visit_active()
        print()

        print("[3/11] 骰子游戏...")
        self.test_dice_roll()
        self.test_dice_history()
        print()

        print("[4/11] 投票系统...")
        self.test_vote_create()
        self.test_vote_cast()
        self.test_vote_list()
        print()

        print("[5/11] 部门Buff显示...")
        self.test_buff_department_info()
        print()

        print("[6/11] 工位升级系统...")
        self.test_desk_upgrade_assets()
        self.test_workstation_info()
        print()

        return self.results.summary()


def main():
    suite = TestPhase3()
    success = suite.run_all()

    print()
    print(f"测试完成! 访问 http://127.0.0.1:19000 查看办公室状态")
    print()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
