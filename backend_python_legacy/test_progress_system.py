#!/usr/bin/env python3
"""
Script de prueba completo para el sistema de progreso de cursos y lecciones
"""
import asyncio
import json
import os
import sys
import traceback
from datetime import datetime
from typing import Dict, Any

# Añadir el directorio app al path para importar módulos
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from domain.entities.course_progress import LessonProgress, CourseProgress, ProgressSummary, ProgressStatus
from infrastructure.repositories.progress_repository import FileSystemProgressRepository
from application.services.progress_service import ProgressService

class ProgressSystemTester:
    """Tester completo para el sistema de progreso"""
    
    def __init__(self):
        self.progress_repo = FileSystemProgressRepository()
        self.progress_service = ProgressService(progress_repository=self.progress_repo)
        self.test_user_id = "test_user_123"
        self.test_course_id = "course_test_456"
        self.test_lesson_ids = ["lesson_1", "lesson_2", "lesson_3"]
        self.test_enrollment_id = "enrollment_789"
        
        # Limpiar datos de test al inicio
        self._cleanup_test_data()
        
    def _cleanup_test_data(self):
        """Limpiar datos de prueba"""
        try:
            # Limpiar archivos de test si existen
            test_files = [
                f"data/lesson_progress/{self.test_user_id}.json",
                f"data/course_progress/{self.test_user_id}.json",
                f"data/progress_summary/{self.test_user_id}.json"
            ]
            
            for file_path in test_files:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"🧹 Limpiado archivo de test: {file_path}")
        except Exception as e:
            print(f"⚠️ Error limpiando datos de test: {e}")
    
    async def test_lesson_progress_lifecycle(self):
        """Probar el ciclo completo de progreso de lección"""
        print("\n" + "="*60)
        print("🧪 TESTING: Ciclo de Progreso de Lección")
        print("="*60)
        
        try:
            lesson_id = self.test_lesson_ids[0]
            
            # 1. Iniciar lección
            print(f"📖 1. Iniciando lección {lesson_id}...")
            progress = await self.progress_service.start_lesson(
                user_id=self.test_user_id,
                lesson_id=lesson_id,
                course_id=self.test_course_id,
                enrollment_id=self.test_enrollment_id
            )
            assert progress.status == ProgressStatus.IN_PROGRESS
            print(f"✅ Lección iniciada correctamente - Status: {progress.status.value}")
            
            # 2. Actualizar progreso parcial
            print(f"📈 2. Actualizando progreso a 50%...")
            progress = await self.progress_service.update_lesson_progress(
                user_id=self.test_user_id,
                lesson_id=lesson_id,
                course_id=self.test_course_id,
                enrollment_id=self.test_enrollment_id,
                progress_percentage=50.0,
                time_spent_delta=600,  # 10 minutos
                video_position=300
            )
            assert progress.progress_percentage == 50.0
            assert progress.time_spent >= 600
            print(f"✅ Progreso actualizado - {progress.progress_percentage}%, {progress.time_spent}s")
            
            # 3. Completar lección
            print(f"🎯 3. Completando lección...")
            progress = await self.progress_service.complete_lesson(
                user_id=self.test_user_id,
                lesson_id=lesson_id,
                course_id=self.test_course_id,
                enrollment_id=self.test_enrollment_id
            )
            assert progress.status == ProgressStatus.COMPLETED
            assert progress.progress_percentage == 100.0
            print(f"✅ Lección completada - Status: {progress.status.value}")
            
            # 4. Obtener progreso
            print(f"📊 4. Obteniendo progreso guardado...")
            saved_progress = await self.progress_service.get_lesson_progress(
                user_id=self.test_user_id,
                lesson_id=lesson_id
            )
            assert saved_progress is not None
            assert saved_progress.status == ProgressStatus.COMPLETED
            print(f"✅ Progreso recuperado correctamente")
            
            print(f"🎉 LESSON PROGRESS LIFECYCLE: ✅ PASSED")
            return True
            
        except Exception as e:
            print(f"❌ LESSON PROGRESS LIFECYCLE: FAILED")
            print(f"Error: {str(e)}")
            traceback.print_exc()
            return False
    
    async def test_course_progress_calculation(self):
        """Probar cálculo de progreso del curso"""
        print("\n" + "="*60)
        print("🧪 TESTING: Cálculo de Progreso de Curso")
        print("="*60)
        
        try:
            # 1. Completar múltiples lecciones
            completed_lessons = 0
            for i, lesson_id in enumerate(self.test_lesson_ids):
                print(f"📖 Procesando lección {i+1}/{len(self.test_lesson_ids)}: {lesson_id}")
                
                # Iniciar lección
                await self.progress_service.start_lesson(
                    user_id=self.test_user_id,
                    lesson_id=lesson_id,
                    course_id=self.test_course_id,
                    enrollment_id=self.test_enrollment_id
                )
                
                # Completar solo las primeras 2 lecciones
                if i < 2:
                    await self.progress_service.complete_lesson(
                        user_id=self.test_user_id,
                        lesson_id=lesson_id,
                        course_id=self.test_course_id,
                        enrollment_id=self.test_enrollment_id
                    )
                    completed_lessons += 1
                    print(f"✅ Lección {lesson_id} completada")
                else:
                    # Solo progreso parcial en la última
                    await self.progress_service.update_lesson_progress(
                        user_id=self.test_user_id,
                        lesson_id=lesson_id,
                        course_id=self.test_course_id,
                        enrollment_id=self.test_enrollment_id,
                        progress_percentage=30.0,
                        time_spent_delta=300
                    )
                    print(f"📈 Lección {lesson_id} en progreso (30%)")
            
            # 2. Obtener progreso detallado del curso
            print(f"📊 Obteniendo progreso detallado del curso...")
            detailed_progress = await self.progress_service.get_detailed_course_progress(
                user_id=self.test_user_id,
                course_id=self.test_course_id
            )
            
            assert "course_progress" in detailed_progress
            assert detailed_progress["course_progress"] is not None
            
            course_progress = detailed_progress["course_progress"]
            print(f"✅ Progreso del curso: {course_progress.progress_percentage:.1f}%")
            print(f"✅ Lecciones completadas: {course_progress.lessons_completed}/{course_progress.total_lessons}")
            print(f"✅ Tiempo total: {course_progress.total_time_spent}s")
            
            # Verificar que el cálculo sea correcto
            expected_completed = completed_lessons
            assert course_progress.lessons_completed == expected_completed
            assert course_progress.total_lessons == len(self.test_lesson_ids)
            
            print(f"🎉 COURSE PROGRESS CALCULATION: ✅ PASSED")
            return True
            
        except Exception as e:
            print(f"❌ COURSE PROGRESS CALCULATION: FAILED")
            print(f"Error: {str(e)}")
            traceback.print_exc()
            return False
    
    async def test_user_progress_summary(self):
        """Probar resumen de progreso del usuario"""
        print("\n" + "="*60)
        print("🧪 TESTING: Resumen de Progreso de Usuario")
        print("="*60)
        
        try:
            # Obtener resumen
            print(f"📊 Obteniendo resumen de progreso...")
            summary = await self.progress_service.get_user_progress_summary(self.test_user_id)
            
            assert summary is not None
            assert summary.user_id == self.test_user_id
            assert summary.total_courses_enrolled >= 1
            
            print(f"✅ Usuario: {summary.user_id}")
            print(f"✅ Cursos inscritos: {summary.total_courses_enrolled}")
            print(f"✅ Cursos completados: {summary.courses_completed}")
            print(f"✅ Cursos en progreso: {summary.courses_in_progress}")
            print(f"✅ Tiempo total: {summary.total_time_spent}s")
            print(f"✅ Tasa de completitud: {summary.completion_rate():.1f}%")
            print(f"✅ Lecciones completadas: {summary.total_lessons_completed}")
            print(f"✅ Certificados: {summary.certificates_earned}")
            
            print(f"🎉 USER PROGRESS SUMMARY: ✅ PASSED")
            return True
            
        except Exception as e:
            print(f"❌ USER PROGRESS SUMMARY: FAILED")
            print(f"Error: {str(e)}")
            traceback.print_exc()
            return False
    
    async def test_repository_persistence(self):
        """Probar persistencia en archivos JSON"""
        print("\n" + "="*60)
        print("🧪 TESTING: Persistencia de Repositorio")
        print("="*60)
        
        try:
            # 1. Verificar que los archivos se crearon
            lesson_progress_file = f"data/lesson_progress/{self.test_user_id}.json"
            course_progress_file = f"data/course_progress/{self.test_user_id}.json"
            
            print(f"📁 Verificando archivo de progreso de lecciones...")
            if os.path.exists(lesson_progress_file):
                with open(lesson_progress_file, 'r') as f:
                    lesson_data = json.load(f)
                print(f"✅ Archivo existe con {len(lesson_data)} lecciones")
            else:
                print(f"❌ Archivo de lecciones no existe: {lesson_progress_file}")
                return False
            
            print(f"📁 Verificando archivo de progreso de curso...")
            if os.path.exists(course_progress_file):
                with open(course_progress_file, 'r') as f:
                    course_data = json.load(f)
                print(f"✅ Archivo existe con datos del curso")
            else:
                print(f"❌ Archivo de curso no existe: {course_progress_file}")
                return False
            
            print(f"🎉 REPOSITORY PERSISTENCE: ✅ PASSED")
            return True
            
        except Exception as e:
            print(f"❌ REPOSITORY PERSISTENCE: FAILED")
            print(f"Error: {str(e)}")
            traceback.print_exc()
            return False
    
    async def test_offline_recovery_simulation(self):
        """Simular recuperación después de datos offline"""
        print("\n" + "="*60)
        print("🧪 TESTING: Simulación Recuperación Offline")
        print("="*60)
        
        try:
            # 1. Crear nuevo servicio (simular reinicio de app)
            new_repo = FileSystemProgressRepository()
            new_service = ProgressService(progress_repository=new_repo)
            
            # 2. Recuperar datos existentes
            print(f"📖 Recuperando datos después del 'reinicio'...")
            lesson_progress = await new_service.get_lesson_progress(
                user_id=self.test_user_id,
                lesson_id=self.test_lesson_ids[0]
            )
            
            assert lesson_progress is not None
            assert lesson_progress.status == ProgressStatus.COMPLETED
            print(f"✅ Progreso de lección recuperado correctamente")
            
            # 3. Recuperar progreso del curso
            course_progress = await new_service.get_detailed_course_progress(
                user_id=self.test_user_id,
                course_id=self.test_course_id
            )
            
            assert course_progress["course_progress"] is not None
            print(f"✅ Progreso de curso recuperado correctamente")
            
            print(f"🎉 OFFLINE RECOVERY SIMULATION: ✅ PASSED")
            return True
            
        except Exception as e:
            print(f"❌ OFFLINE RECOVERY SIMULATION: FAILED")
            print(f"Error: {str(e)}")
            traceback.print_exc()
            return False
    
    async def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("🚀 INICIANDO PRUEBAS DEL SISTEMA DE PROGRESO")
        print("="*80)
        
        tests = [
            ("Lesson Progress Lifecycle", self.test_lesson_progress_lifecycle),
            ("Course Progress Calculation", self.test_course_progress_calculation),
            ("User Progress Summary", self.test_user_progress_summary),
            ("Repository Persistence", self.test_repository_persistence),
            ("Offline Recovery Simulation", self.test_offline_recovery_simulation)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Ejecutando: {test_name}")
            try:
                result = await test_func()
                results[test_name] = result
                if result:
                    passed += 1
            except Exception as e:
                print(f"❌ Error inesperado en {test_name}: {str(e)}")
                results[test_name] = False
        
        # Resumen final
        print("\n" + "="*80)
        print("📊 RESUMEN DE PRUEBAS")
        print("="*80)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:<35} {status}")
        
        print(f"\n📈 TOTAL: {passed}/{total} pruebas exitosas ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS! 🎉")
            print("✅ El sistema de progreso está funcionando correctamente")
        else:
            print(f"\n⚠️ {total-passed} pruebas fallaron")
            print("❌ Revisa los errores arriba para más detalles")
        
        # Cleanup final
        print("\n🧹 Limpiando datos de prueba...")
        self._cleanup_test_data()
        
        return passed == total

async def main():
    """Función principal"""
    tester = ProgressSystemTester()
    success = await tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
