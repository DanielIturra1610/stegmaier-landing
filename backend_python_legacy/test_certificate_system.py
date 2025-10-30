#!/usr/bin/env python3
"""
Script de testing completo para el sistema de certificados
Valida endpoints, validaciones, generación y descarga
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Any, Optional
import sys
import os

# Configuración del test
BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_EMAIL = "student@test.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_ADMIN_EMAIL = "admin@stegmaier.com"
TEST_ADMIN_PASSWORD = "admin123"

class CertificateSystemTester:
    def __init__(self):
        self.session = None
        self.student_token = None
        self.admin_token = None
        self.test_course_id = None
        self.test_enrollment_id = None
        self.test_certificate_id = None
        
    async def setup_session(self):
        """Configurar sesión HTTP"""
        self.session = aiohttp.ClientSession()
    
    async def cleanup_session(self):
        """Limpiar sesión HTTP"""
        if self.session:
            await self.session.close()
    
    async def login_user(self, email: str, password: str) -> Optional[str]:
        """Login y obtener token JWT"""
        try:
            login_data = {
                "username": email,
                "password": password
            }
            
            async with self.session.post(
                f"{BASE_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("access_token")
                else:
                    print(f"❌ Login failed for {email}: {response.status}")
                    text = await response.text()
                    print(f"   Response: {text}")
                    return None
        except Exception as e:
            print(f"❌ Login error for {email}: {e}")
            return None
    
    async def create_test_data(self) -> bool:
        """Crear datos de prueba: curso y enrollment"""
        try:
            # Crear curso de prueba
            course_data = {
                "title": "Curso de Prueba para Certificados",
                "description": "Curso creado para testing del sistema de certificados",
                "instructor_id": "admin_user_id",  # Se ajustará con ID real
                "level": "intermedio",
                "category": "occupational_safety",
                "is_published": True
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            async with self.session.post(
                f"{BASE_URL}/admin/courses",
                json=course_data,
                headers=headers
            ) as response:
                if response.status == 201:
                    course = await response.json()
                    self.test_course_id = course["id"]
                    print(f"✅ Test course created: {self.test_course_id}")
                else:
                    print(f"❌ Failed to create test course: {response.status}")
                    return False
            
            # Crear enrollment de prueba
            enrollment_data = {
                "course_id": self.test_course_id
            }
            
            headers = {"Authorization": f"Bearer {self.student_token}"}
            
            async with self.session.post(
                f"{BASE_URL}/enrollments",
                json=enrollment_data,
                headers=headers
            ) as response:
                if response.status == 201:
                    enrollment = await response.json()
                    self.test_enrollment_id = enrollment["id"]
                    print(f"✅ Test enrollment created: {self.test_enrollment_id}")
                    return True
                else:
                    print(f"❌ Failed to create test enrollment: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error creating test data: {e}")
            return False
    
    async def simulate_course_completion(self) -> bool:
        """Simular completitud del curso"""
        try:
            # Marcar el enrollment como completado (simulado)
            # En un test real, esto se haría completando lecciones
            
            headers = {"Authorization": f"Bearer {self.student_token}"}
            
            # Intentar emitir certificado directamente
            async with self.session.put(
                f"{BASE_URL}/enrollments/{self.test_enrollment_id}/issue-certificate",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    cert_data = result.get("certificate", {})
                    self.test_certificate_id = cert_data.get("id")
                    print(f"✅ Certificate issued: {self.test_certificate_id}")
                    return True
                else:
                    print(f"⚠️  Certificate issue failed (expected): {response.status}")
                    text = await response.text()
                    print(f"   Reason: {text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error simulating course completion: {e}")
            return False
    
    async def test_certificate_generation(self) -> bool:
        """Test generar certificado"""
        try:
            headers = {"Authorization": f"Bearer {self.student_token}"}
            
            cert_request = {
                "enrollmentId": self.test_enrollment_id,
                "template": "stegmaier-standard"
            }
            
            async with self.session.post(
                f"{BASE_URL}/certificates/generate",
                json=cert_request,
                headers=headers
            ) as response:
                if response.status == 200:
                    certificate = await response.json()
                    self.test_certificate_id = certificate["id"]
                    print(f"✅ Certificate generated successfully")
                    print(f"   ID: {certificate['id']}")
                    print(f"   Course: {certificate['courseName']}")
                    print(f"   Student: {certificate['studentName']}")
                    print(f"   Verification Code: {certificate['verificationCode']}")
                    return True
                else:
                    print(f"❌ Certificate generation failed: {response.status}")
                    text = await response.text()
                    print(f"   Response: {text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing certificate generation: {e}")
            return False
    
    async def test_user_certificates(self) -> bool:
        """Test obtener certificados del usuario"""
        try:
            headers = {"Authorization": f"Bearer {self.student_token}"}
            
            async with self.session.get(
                f"{BASE_URL}/certificates/user",
                headers=headers
            ) as response:
                if response.status == 200:
                    certificates = await response.json()
                    print(f"✅ User certificates retrieved: {len(certificates)} certificates")
                    
                    for cert in certificates:
                        print(f"   - {cert['courseName']} (ID: {cert['id']})")
                    
                    return True
                else:
                    print(f"❌ Failed to get user certificates: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing user certificates: {e}")
            return False
    
    async def test_certificate_download(self) -> bool:
        """Test descarga de certificado"""
        try:
            if not self.test_certificate_id:
                print("⚠️  No certificate ID available for download test")
                return False
            
            headers = {"Authorization": f"Bearer {self.student_token}"}
            
            async with self.session.get(
                f"{BASE_URL}/certificates/{self.test_certificate_id}/download",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Certificate download endpoint works")
                    print(f"   Message: {result.get('message')}")
                    return True
                else:
                    print(f"❌ Certificate download failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing certificate download: {e}")
            return False
    
    async def test_certificate_verification(self) -> bool:
        """Test verificación de certificado"""
        try:
            # Usar código de verificación de prueba
            test_verification_code = "TEST123CODE"
            
            async with self.session.get(
                f"{BASE_URL}/certificates/verify/{test_verification_code}"
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Certificate verification endpoint works")
                    print(f"   Valid: {result.get('isValid')}")
                    return True
                else:
                    print(f"❌ Certificate verification failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing certificate verification: {e}")
            return False
    
    async def test_shareable_url(self) -> bool:
        """Test generación de URL compartible"""
        try:
            if not self.test_certificate_id:
                print("⚠️  No certificate ID available for shareable URL test")
                return False
            
            headers = {"Authorization": f"Bearer {self.student_token}"}
            
            async with self.session.get(
                f"{BASE_URL}/certificates/share/{self.test_certificate_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Shareable URL generated")
                    print(f"   URL: {result.get('shareableUrl')}")
                    print(f"   Verification Code: {result.get('verificationCode')}")
                    return True
                else:
                    print(f"❌ Shareable URL generation failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing shareable URL: {e}")
            return False
    
    async def test_authorization(self) -> bool:
        """Test autorización de endpoints"""
        try:
            # Test acceso sin token
            async with self.session.get(f"{BASE_URL}/certificates/user") as response:
                if response.status == 401:
                    print("✅ Unauthorized access properly blocked")
                else:
                    print(f"❌ Unauthorized access should be blocked: {response.status}")
                    return False
            
            # Test acceso con token inválido
            headers = {"Authorization": "Bearer invalid_token"}
            async with self.session.get(
                f"{BASE_URL}/certificates/user",
                headers=headers
            ) as response:
                if response.status == 401:
                    print("✅ Invalid token properly rejected")
                    return True
                else:
                    print(f"❌ Invalid token should be rejected: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing authorization: {e}")
            return False

    async def run_all_tests(self) -> Dict[str, bool]:
        """Ejecutar todos los tests"""
        results = {}
        
        print("🚀 Starting Certificate System Tests")
        print("=" * 50)
        
        # Setup
        await self.setup_session()
        
        # Login
        print("\n1. Testing Authentication...")
        self.student_token = await self.login_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        self.admin_token = await self.login_user(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        
        if not self.student_token:
            print("❌ Student login failed - skipping tests that require authentication")
            results["authentication"] = False
            await self.cleanup_session()
            return results
        
        results["authentication"] = True
        print("✅ Authentication successful")
        
        # Test authorization
        print("\n2. Testing Authorization...")
        results["authorization"] = await self.test_authorization()
        
        # Create test data (optional, might fail if endpoints don't exist)
        if self.admin_token:
            print("\n3. Setting up test data...")
            test_data_created = await self.create_test_data()
            results["test_data_setup"] = test_data_created
        else:
            print("⚠️  Admin login failed - using mock data for tests")
            # Use mock enrollment ID for testing
            self.test_enrollment_id = "mock_enrollment_id"
            results["test_data_setup"] = False
        
        # Test certificate generation
        print("\n4. Testing Certificate Generation...")
        results["certificate_generation"] = await self.test_certificate_generation()
        
        # Test user certificates
        print("\n5. Testing User Certificates Retrieval...")
        results["user_certificates"] = await self.test_user_certificates()
        
        # Test certificate download
        print("\n6. Testing Certificate Download...")
        results["certificate_download"] = await self.test_certificate_download()
        
        # Test certificate verification
        print("\n7. Testing Certificate Verification...")
        results["certificate_verification"] = await self.test_certificate_verification()
        
        # Test shareable URL
        print("\n8. Testing Shareable URL Generation...")
        results["shareable_url"] = await self.test_shareable_url()
        
        # Cleanup
        await self.cleanup_session()
        
        return results
    
    def print_results_summary(self, results: Dict[str, bool]):
        """Imprimir resumen de resultados"""
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title():<30} {status}")
        
        print("-" * 50)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 All tests passed! Certificate system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Please check the implementation.")

async def main():
    """Función principal"""
    tester = CertificateSystemTester()
    
    try:
        results = await tester.run_all_tests()
        tester.print_results_summary(results)
        
        # Return exit code based on results
        if all(results.values()):
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Some tests failed
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        await tester.cleanup_session()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        await tester.cleanup_session()
        sys.exit(1)

if __name__ == "__main__":
    print("Certificate System Tester")
    print("=" * 50)
    print("This script tests the complete certificate system")
    print("Make sure the backend server is running on localhost:8000")
    print()
    
    # Check if server is accessible
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', 8000))
    sock.close()
    
    if result != 0:
        print("❌ Backend server is not accessible on localhost:8000")
        print("Please start the server with: uvicorn app.main:app --reload")
        sys.exit(1)
    
    print("✅ Backend server is accessible")
    print("Starting tests in 3 seconds...")
    
    import time
    time.sleep(3)
    
    asyncio.run(main())
