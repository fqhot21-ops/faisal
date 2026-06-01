import requests
import sys
import json
from datetime import datetime
import os
import tempfile

class SecureVisionAPITester:
    def __init__(self, base_url="https://ai-threat-check-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {}
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        if method != 'POST' or not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "full_name": f"Test User {timestamp}",
            "role": "user"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_admin_registration(self):
        """Test admin user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        admin_data = {
            "email": f"admin_user_{timestamp}@example.com",
            "password": "AdminPass123!",
            "full_name": f"Admin User {timestamp}",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'token' in response and 'user' in response:
            self.admin_token = response['token']
            self.admin_id = response['user']['id']
            print(f"   Admin ID: {self.admin_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user for login test
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "LoginTest123!",
            "full_name": f"Login Test {timestamp}"
        }
        
        # Register first
        reg_success, reg_response = self.run_test(
            "Register for Login Test",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if not reg_success:
            return False
        
        # Now test login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'token' in response and 'user' in response

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200,
            auth_token=self.token
        )
        
        return success and 'id' in response and 'email' in response

    def test_url_scan(self):
        """Test URL scanning"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        scan_data = {"url": "https://example.com"}
        
        success, response = self.run_test(
            "URL Scan",
            "POST",
            "scan/url",
            200,
            data=scan_data,
            auth_token=self.token
        )
        
        expected_fields = ['id', 'scan_type', 'target', 'risk_level', 'risk_score', 'confidence', 'explanation']
        return success and all(field in response for field in expected_fields)

    def test_ip_scan(self):
        """Test IP scanning"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        scan_data = {"ip_address": "8.8.8.8"}
        
        success, response = self.run_test(
            "IP Scan",
            "POST",
            "scan/ip",
            200,
            data=scan_data,
            auth_token=self.token
        )
        
        expected_fields = ['id', 'scan_type', 'target', 'risk_level', 'risk_score', 'confidence', 'explanation']
        return success and all(field in response for field in expected_fields)

    def test_file_scan(self):
        """Test file scanning"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        # Create a test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a test file for malware scanning.")
            test_file_path = f.name
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                
                success, response = self.run_test(
                    "File Scan",
                    "POST",
                    "scan/file",
                    200,
                    files=files,
                    auth_token=self.token
                )
            
            expected_fields = ['id', 'scan_type', 'target', 'risk_level', 'risk_score', 'confidence', 'explanation']
            return success and all(field in response for field in expected_fields)
        finally:
            # Clean up test file
            try:
                os.unlink(test_file_path)
            except:
                pass

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            auth_token=self.token
        )
        
        expected_fields = ['total_scans', 'safe_count', 'suspicious_count', 'malicious_count', 'recent_scans']
        return success and all(field in response for field in expected_fields)

    def test_scan_history(self):
        """Test scan history"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        success, response = self.run_test(
            "Scan History",
            "GET",
            "scans/history",
            200,
            auth_token=self.token
        )
        
        return success and isinstance(response, list)

    def test_admin_stats(self):
        """Test admin statistics"""
        if not self.admin_token:
            print("❌ Skipped - No admin token available")
            return False
            
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            auth_token=self.admin_token
        )
        
        expected_fields = ['total_users', 'total_scans', 'scans_today', 'threat_distribution', 'user_list']
        return success and all(field in response for field in expected_fields)

    def test_non_admin_access_denial(self):
        """Test that non-admin users can't access admin endpoints"""
        if not self.token:
            print("❌ Skipped - No user token available")
            return False
            
        success, response = self.run_test(
            "Non-Admin Access Denial",
            "GET",
            "admin/stats",
            403,
            auth_token=self.token
        )
        
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "dashboard/stats",
            401
        )
        
        return success

def main():
    print("🚀 SecureVision AI Backend API Testing")
    print("=" * 50)
    
    tester = SecureVisionAPITester()
    
    # Authentication Tests
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_user_registration():
        print("❌ User registration failed, stopping tests")
        return 1
        
    if not tester.test_admin_registration():
        print("❌ Admin registration failed, continuing with limited tests")
    
    tester.test_user_login()
    tester.test_get_user_profile()
    
    # Scanning Tests
    print("\n🛡️ SCANNING TESTS")
    print("-" * 30)
    
    tester.test_url_scan()
    tester.test_ip_scan()
    tester.test_file_scan()
    
    # Dashboard Tests
    print("\n📊 DASHBOARD TESTS")
    print("-" * 30)
    
    tester.test_dashboard_stats()
    tester.test_scan_history()
    
    # Admin Tests
    print("\n👑 ADMIN TESTS")
    print("-" * 30)
    
    tester.test_admin_stats()
    tester.test_non_admin_access_denial()
    
    # Security Tests
    print("\n🔒 SECURITY TESTS")
    print("-" * 30)
    
    tester.test_unauthorized_access()
    
    # Results
    print(f"\n📊 FINAL RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend tests PASSED!")
        return 0
    else:
        print("❌ Backend tests FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())