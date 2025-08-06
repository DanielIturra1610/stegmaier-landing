#!/usr/bin/env python3
"""
Script de testing básico para el sistema de analytics
Verifica que todos los componentes del sistema funcionen correctamente
"""
import asyncio
import json
import requests
from datetime import datetime
import time

# URL base de la API (ajustar según configuración)
BASE_URL = "http://localhost:8000/api/v1"

class AnalyticsSystemTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test results"""
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED {message}")
    
    def authenticate(self):
        """Authenticate as admin and regular user for testing"""
        print("🔐 Testing Authentication...")
        
        # Esta función asume que ya tienes usuarios creados
        # En un entorno de pruebas real, crearías usuarios de prueba aquí
        
        # Test admin login (necesitarás un usuario admin creado previamente)
        admin_data = {
            "email": "admin@stegmaier.com",  # Ajustar según tu configuración
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=admin_data)
            if response.status_code == 200:
                self.admin_token = response.json()["access_token"]
                self.log_result("Admin Authentication", True, "Admin token obtained")
            else:
                self.log_result("Admin Authentication", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Admin Authentication", False, str(e))
        
        # Test regular user login
        user_data = {
            "email": "user@test.com",  # Ajustar según tu configuración
            "password": "user123"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=user_data)
            if response.status_code == 200:
                self.user_token = response.json()["access_token"]
                self.log_result("User Authentication", True, "User token obtained")
            else:
                self.log_result("User Authentication", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("User Authentication", False, str(e))
    
    def test_analytics_endpoints(self):
        """Test all analytics API endpoints"""
        print("\n📊 Testing Analytics Endpoints...")
        
        if not self.admin_token:
            print("⚠️ Skipping analytics tests - no admin token")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test platform metrics
        try:
            response = requests.get(f"{self.base_url}/analytics/platform", headers=headers)
            success = response.status_code == 200
            if success:
                data = response.json()
                message = f"Users: {data.get('data', {}).get('users', {}).get('total_users', 0)}"
            else:
                message = f"Status: {response.status_code}"
            self.log_result("Platform Metrics", success, message)
        except Exception as e:
            self.log_result("Platform Metrics", False, str(e))
        
        # Test popular courses
        try:
            response = requests.get(f"{self.base_url}/analytics/courses/popular", headers=headers)
            success = response.status_code == 200
            if success:
                data = response.json()
                courses_count = len(data.get('data', {}).get('courses', []))
                message = f"Found {courses_count} popular courses"
            else:
                message = f"Status: {response.status_code}"
            self.log_result("Popular Courses", success, message)
        except Exception as e:
            self.log_result("Popular Courses", False, str(e))
        
        # Test revenue analytics
        try:
            response = requests.get(f"{self.base_url}/analytics/revenue", headers=headers)
            success = response.status_code == 200
            if success:
                data = response.json()
                revenue = data.get('data', {}).get('revenue', {}).get('total_revenue', 0)
                message = f"Total revenue: ${revenue}"
            else:
                message = f"Status: {response.status_code}"
            self.log_result("Revenue Analytics", success, message)
        except Exception as e:
            self.log_result("Revenue Analytics", False, str(e))
    
    def test_user_analytics(self):
        """Test user-specific analytics endpoints"""
        print("\n👤 Testing User Analytics...")
        
        if not self.user_token:
            print("⚠️ Skipping user analytics tests - no user token")
            return
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Test current user stats
        try:
            response = requests.get(f"{self.base_url}/analytics/users/me", headers=headers)
            success = response.status_code == 200
            if success:
                data = response.json()
                user_data = data.get('data', {}).get('user', {})
                message = f"User: {user_data.get('name', 'Unknown')}"
            else:
                message = f"Status: {response.status_code}"
            self.log_result("User Stats", success, message)
        except Exception as e:
            self.log_result("User Stats", False, str(e))
    
    def test_activity_tracking(self):
        """Test activity tracking functionality"""
        print("\n📝 Testing Activity Tracking...")
        
        if not self.user_token:
            print("⚠️ Skipping activity tracking tests - no user token")
            return
        
        headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Content-Type": "application/json"
        }
        
        # Test basic activity tracking
        activity_data = {
            "activity_type": "page_view",
            "metadata": {
                "page": "test_page",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/analytics/activity", 
                                   json=activity_data, headers=headers)
            success = response.status_code in [200, 201]
            message = f"Status: {response.status_code}"
            self.log_result("Activity Tracking - Page View", success, message)
        except Exception as e:
            self.log_result("Activity Tracking - Page View", False, str(e))
        
        # Test lesson tracking
        lesson_activity = {
            "activity_type": "lesson_start",
            "course_id": "test_course_id",
            "lesson_id": "test_lesson_id",
            "metadata": {
                "lesson_title": "Test Lesson",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/analytics/activity", 
                                   json=lesson_activity, headers=headers)
            success = response.status_code in [200, 201]
            message = f"Status: {response.status_code}"
            self.log_result("Activity Tracking - Lesson Start", success, message)
        except Exception as e:
            self.log_result("Activity Tracking - Lesson Start", False, str(e))
    
    def test_middleware_performance(self):
        """Test that performance middleware is working"""
        print("\n⚡ Testing Performance Middleware...")
        
        # Make a request and check for performance headers
        try:
            response = requests.get(f"{self.base_url.replace('/api/v1', '')}/")
            
            has_process_time = "X-Process-Time" in response.headers
            has_request_id = "X-Request-ID" in response.headers
            
            self.log_result("Performance Headers", has_process_time and has_request_id,
                          f"Process-Time: {response.headers.get('X-Process-Time', 'Missing')}")
            
        except Exception as e:
            self.log_result("Performance Headers", False, str(e))
    
    def test_cache_middleware(self):
        """Test that cache middleware is working"""
        print("\n💾 Testing Cache Middleware...")
        
        if not self.admin_token:
            print("⚠️ Skipping cache tests - no admin token")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test that analytics endpoints have appropriate cache headers
        try:
            response = requests.get(f"{self.base_url}/analytics/platform", headers=headers)
            
            has_cache_control = "Cache-Control" in response.headers
            cache_control = response.headers.get("Cache-Control", "")
            
            # Analytics should have some cache control
            success = has_cache_control and "max-age" in cache_control
            message = f"Cache-Control: {cache_control}"
            
            self.log_result("Cache Headers", success, message)
            
        except Exception as e:
            self.log_result("Cache Headers", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Analytics System Tests...\n")
        
        self.authenticate()
        self.test_analytics_endpoints()
        self.test_user_analytics()
        self.test_activity_tracking()
        self.test_middleware_performance()
        self.test_cache_middleware()
        
        # Print summary
        print("\n" + "="*50)
        print("📋 TEST SUMMARY")
        print("="*50)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"📊 Total: {self.test_results['passed'] + self.test_results['failed']}")
        
        if self.test_results['errors']:
            print("\n🚨 ERRORS:")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        success_rate = (self.test_results['passed'] / 
                       (self.test_results['passed'] + self.test_results['failed']) * 100)
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 System is working well!")
        elif success_rate >= 60:
            print("⚠️ System needs attention")
        else:
            print("🔥 System has critical issues")

def main():
    """Main function"""
    print("Analytics System Tester")
    print("="*50)
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code != 200:
            print("❌ Server is not running or not accessible at http://localhost:8000")
            print("   Please start the FastAPI server first")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server at http://localhost:8000")
        print("   Please start the FastAPI server first")
        return
    
    tester = AnalyticsSystemTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
