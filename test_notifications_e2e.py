#!/usr/bin/env python3
"""
Script de testing end-to-end para el sistema de notificaciones LMS
Prueba la integración completa: Backend API, Service Worker, Push Notifications y Email
Siguiendo principios del EncoderGroup para testing exhaustivo
"""

import requests
import time
import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class NotificationSystemTester:
    def __init__(self, base_url: str = "http://localhost:8000", frontend_url: str = "http://localhost:5173"):
        self.base_url = base_url
        self.frontend_url = frontend_url
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Registrar resultado de test"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def authenticate(self, email: str = "test@stegmaier.com", password: str = "testpass123"):
        """Autenticar usuario para obtener token"""
        try:
            response = requests.post(f"{self.base_url}/api/v1/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.log_test("Authentication", True, f"Token obtenido para user {email}")
                return True
            else:
                self.log_test("Authentication", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Error: {str(e)}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Headers con autenticación"""
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_backend_notifications_api(self):
        """Test completo de API de notificaciones"""
        print("\n📡 Testing Backend Notifications API...")
        
        # Test 1: Crear notificación
        try:
            notification_data = {
                "type": "COURSE_COMPLETION",
                "title": "Test Course Completed",
                "message": "You have successfully completed the test course",
                "metadata": {
                    "course_id": "test-course-123",
                    "course_name": "Test Course",
                    "completion_date": datetime.now().isoformat()
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/notifications",
                json=notification_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                created_notification = response.json()
                notification_id = created_notification.get("id")
                self.log_test("Create Notification", True, f"ID: {notification_id}")
            else:
                self.log_test("Create Notification", False, f"Status: {response.status_code}")
                return
                
        except Exception as e:
            self.log_test("Create Notification", False, f"Error: {str(e)}")
            return
        
        # Test 2: Obtener notificaciones del usuario
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/notifications",
                headers=self.get_headers(),
                params={"page": 1, "limit": 10}
            )
            
            if response.status_code == 200:
                data = response.json()
                notifications = data.get("notifications", [])
                self.log_test("Get Notifications", True, f"Found {len(notifications)} notifications")
            else:
                self.log_test("Get Notifications", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Notifications", False, f"Error: {str(e)}")
        
        # Test 3: Contador de no leídas
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/notifications/unread/count",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                count = response.json().get("count", 0)
                self.log_test("Unread Count", True, f"Count: {count}")
            else:
                self.log_test("Unread Count", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Unread Count", False, f"Error: {str(e)}")
        
        # Test 4: Marcar como leída
        try:
            response = requests.put(
                f"{self.base_url}/api/v1/notifications/{notification_id}/read",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                self.log_test("Mark As Read", True, "Notification marked as read")
            else:
                self.log_test("Mark As Read", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Mark As Read", False, f"Error: {str(e)}")
    
    def test_domain_specific_notifications(self):
        """Test notificaciones específicas del dominio LMS"""
        print("\n🎓 Testing Domain-Specific Notifications...")
        
        # Test: Course completion notification
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/notifications/course-completion",
                json={
                    "course_id": "test-course-123",
                    "certificate_url": "https://certificates.stegmaier.com/cert-123"
                },
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                self.log_test("Course Completion Notification", True, "Sent successfully")
            else:
                self.log_test("Course Completion Notification", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Course Completion Notification", False, f"Error: {str(e)}")
        
        # Test: Progress notification
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/notifications/progress",
                json={
                    "course_id": "test-course-123",
                    "progress_percentage": 75,
                    "lessons_completed": 8,
                    "total_lessons": 12
                },
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                self.log_test("Progress Notification", True, "Sent successfully")
            else:
                self.log_test("Progress Notification", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Progress Notification", False, f"Error: {str(e)}")
        
        # Test: New course announcement
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/notifications/new-course-announcement",
                json={
                    "course_id": "new-course-456",
                    "launch_date": datetime.now().isoformat(),
                    "early_access": True
                },
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                self.log_test("New Course Announcement", True, "Sent successfully")
            else:
                self.log_test("New Course Announcement", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("New Course Announcement", False, f"Error: {str(e)}")
    
    def test_email_service(self):
        """Test del servicio de email (requiere configuración SMTP)"""
        print("\n📧 Testing Email Service...")
        
        # Verificar que las variables de entorno estén configuradas
        smtp_vars = ["SMTP_SERVER", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "FROM_EMAIL"]
        missing_vars = [var for var in smtp_vars if not os.getenv(var)]
        
        if missing_vars:
            self.log_test("Email Configuration", False, f"Missing vars: {missing_vars}")
            return
        
        try:
            # Test email endpoint (si existe)
            response = requests.post(
                f"{self.base_url}/api/v1/notifications/test-email",
                json={
                    "recipient": "test@example.com",
                    "template": "course_completion",
                    "context": {
                        "user_name": "Test User",
                        "course_name": "Test Course",
                        "completion_date": datetime.now().strftime("%Y-%m-%d")
                    }
                },
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                self.log_test("Email Service", True, "Test email sent successfully")
            else:
                self.log_test("Email Service", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Email Service", False, f"Error: {str(e)}")
    
    def test_frontend_integration(self):
        """Test básico de integración frontend"""
        print("\n🌐 Testing Frontend Integration...")
        
        try:
            # Test que el frontend esté corriendo
            response = requests.get(self.frontend_url)
            if response.status_code == 200:
                self.log_test("Frontend Server", True, "Frontend accessible")
            else:
                self.log_test("Frontend Server", False, f"Status: {response.status_code}")
                return
                
        except Exception as e:
            self.log_test("Frontend Server", False, f"Error: {str(e)}")
            return
        
        # Test Service Worker (verificar que sw.js existe)
        try:
            response = requests.get(f"{self.frontend_url}/sw.js")
            if response.status_code == 200:
                self.log_test("Service Worker", True, "sw.js accessible")
                
                # Verificar contenido básico del SW
                sw_content = response.text
                required_features = [
                    "push",
                    "notificationclick", 
                    "notificationclose",
                    "sync"
                ]
                
                missing_features = [f for f in required_features if f not in sw_content.lower()]
                if not missing_features:
                    self.log_test("Service Worker Features", True, "All features present")
                else:
                    self.log_test("Service Worker Features", False, f"Missing: {missing_features}")
            else:
                self.log_test("Service Worker", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Service Worker", False, f"Error: {str(e)}")
    
    def test_push_notification_setup(self):
        """Test configuración de push notifications"""
        print("\n📱 Testing Push Notification Setup...")
        
        # Verificar VAPID key
        vapid_key = os.getenv("REACT_APP_VAPID_PUBLIC_KEY")
        if vapid_key:
            self.log_test("VAPID Key Configuration", True, "Key present")
        else:
            self.log_test("VAPID Key Configuration", False, "REACT_APP_VAPID_PUBLIC_KEY not set")
        
        # Test endpoint de suscripción (si existe)
        try:
            test_subscription = {
                "endpoint": "https://fcm.googleapis.com/fcm/send/test",
                "keys": {
                    "p256dh": "test-p256dh-key",
                    "auth": "test-auth-key"
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/push/subscribe",
                json=test_subscription,
                headers=self.get_headers()
            )
            
            if response.status_code in [200, 201]:
                self.log_test("Push Subscription", True, "Subscription endpoint working")
            else:
                self.log_test("Push Subscription", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Push Subscription", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Ejecutar toda la suite de tests"""
        print("🧪 Starting Notification System E2E Tests")
        print("=" * 50)
        
        start_time = time.time()
        
        # Autenticación requerida para la mayoría de tests
        if not self.authenticate():
            print("❌ Authentication failed. Stopping tests.")
            return
        
        # Ejecutar tests en orden
        self.test_backend_notifications_api()
        self.test_domain_specific_notifications()
        self.test_email_service()
        self.test_frontend_integration()
        self.test_push_notification_setup()
        
        # Resumen final
        end_time = time.time()
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⏱️  Duration: {end_time - start_time:.2f}s")
        print(f"📈 Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Detalles de tests fallidos
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print("\n🔍 FAILED TESTS DETAILS:")
            for result in failed_results:
                print(f"  ❌ {result['test']}: {result['message']}")
        
        # Guardar resultados en JSON
        with open("notification_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "success_rate": passed_tests/total_tests*100,
                    "duration": end_time - start_time
                },
                "results": self.test_results
            }, f, indent=2)
        
        print(f"\n💾 Results saved to: notification_test_results.json")
        
        return failed_tests == 0

def main():
    """Punto de entrada principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Notification System E2E Tester")
    parser.add_argument("--backend", default="http://localhost:8000", help="Backend URL")
    parser.add_argument("--frontend", default="http://localhost:5173", help="Frontend URL")
    parser.add_argument("--email", default="test@stegmaier.com", help="Test user email")
    parser.add_argument("--password", default="testpass123", help="Test user password")
    
    args = parser.parse_args()
    
    tester = NotificationSystemTester(args.backend, args.frontend)
    success = tester.run_all_tests()
    
    # Exit code para CI/CD
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
