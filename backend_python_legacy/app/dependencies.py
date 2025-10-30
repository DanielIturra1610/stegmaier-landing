"""
Módulo de inyección de dependencias para la aplicación.
Proporciona funciones para obtener instancias configuradas de servicios y repositorios.
"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .core.config import get_settings
from .infrastructure.database import get_database

# Importación de repositorios
from .domain.repositories.user_repository import UserRepository
from .domain.repositories.course_repository import CourseRepository
from .domain.repositories.lesson_repository import LessonRepository
from .domain.repositories.enrollment_repository import EnrollmentRepository
from .domain.repositories.review_repository import ReviewRepository
from .domain.repositories.verification_token_repository import VerificationTokenRepository
from .domain.repositories.progress_repository import ProgressRepository
from .domain.repositories.module_repository import ModuleRepository
from .domain.repositories.quiz_repository import QuizRepository
from .domain.repositories.notification_repository import NotificationRepository

# Importación de implementaciones de repositorios
from .infrastructure.repositories.user_repository_impl import MongoDBUserRepository
from .infrastructure.repositories.course_repository_impl import MongoDBCourseRepository
from .infrastructure.repositories.lesson_repository_impl import MongoDBLessonRepository
from .infrastructure.repositories.enrollment_repository_impl import MongoDBEnrollmentRepository
from .infrastructure.repositories.review_repository_impl import MongoDBReviewRepository
from .infrastructure.repositories.mongo_verification_token_repository import MongoVerificationTokenRepository
from .infrastructure.repositories.progress_repository import FileSystemProgressRepository
from .infrastructure.repositories.analytics_repository import FileSystemAnalyticsRepository
from .infrastructure.repositories.module_repository_impl import MongoDBModuleRepository
from .infrastructure.repositories.quiz_repository_impl import MongoDBQuizRepository
from .infrastructure.repositories.notification_repository_impl import MongoDBNotificationRepository
from .infrastructure.repositories.media_repository import FileSystemMediaRepository

# Importación de servicios
from .application.services.user_service import UserService
from .application.services.auth_service import AuthService
from .application.services.course_service import CourseService
from .application.services.lesson_service import LessonService
from .application.services.enrollment_service import EnrollmentService
from .application.services.review_service import ReviewService
from .application.services.progress_service import ProgressService
from .application.services.analytics_service import AnalyticsService
from .application.services.module_service import ModuleService
from .application.services.quiz_service import QuizService
from .application.services.notification_service import NotificationService
from .application.services.media_service import MediaService
from .infrastructure.email.email_service import EmailService

# Dependencias de repositorios

async def get_user_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> UserRepository:
    """
    Proporciona una instancia configurada del repositorio de usuarios.
    """
    return MongoDBUserRepository(db)

async def get_course_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> CourseRepository:
    """
    Proporciona una instancia configurada del repositorio de cursos.
    """
    return MongoDBCourseRepository(db)

async def get_lesson_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> LessonRepository:
    """
    Proporciona una instancia configurada del repositorio de lecciones.
    """
    return MongoDBLessonRepository(db)

async def get_enrollment_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> EnrollmentRepository:
    """
    Proporciona una instancia configurada del repositorio de inscripciones.
    """
    return MongoDBEnrollmentRepository(db)

async def get_review_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> ReviewRepository:
    """
    Proporciona una instancia configurada del repositorio de reseñas.
    """
    return MongoDBReviewRepository(db)

async def get_verification_token_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> VerificationTokenRepository:
    """
    Proporciona una instancia configurada del repositorio de tokens de verificación.
    """
    # Asumimos que la colección se llamará 'verification_tokens'
    collection = db.verification_tokens
    return MongoVerificationTokenRepository(collection)

async def get_module_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> ModuleRepository:
    """
    Proporciona una instancia configurada del repositorio de módulos.
    """
    return MongoDBModuleRepository(db)

async def get_quiz_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> QuizRepository:
    """
    Proporciona una instancia configurada del repositorio de quizzes.
    """
    return MongoDBQuizRepository(db)


async def get_notification_repository(db: AsyncIOMotorDatabase = Depends(get_database)) -> NotificationRepository:
    """
    Proporciona una instancia configurada del repositorio de notificaciones.
    """
    return MongoDBNotificationRepository(db)

def get_media_repository() -> FileSystemMediaRepository:
    """
    Proporciona una instancia configurada del repositorio de media.
    """
    return FileSystemMediaRepository()

# Dependencias de servicios

async def get_user_service(user_repository: UserRepository = Depends(get_user_repository)) -> UserService:
    """
    Proporciona una instancia configurada del servicio de usuarios.
    """
    return UserService(user_repository)

async def get_email_service() -> EmailService:
    """
    Proporciona una instancia configurada del servicio de email.
    """
    return EmailService()

async def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository),
    verification_token_repository: VerificationTokenRepository = Depends(get_verification_token_repository),
    email_service: EmailService = Depends(get_email_service)
) -> AuthService:
    """
    Proporciona una instancia configurada del servicio de autenticación.
    """
    return AuthService(user_repository, verification_token_repository, email_service)

async def get_course_service(
    course_repository: CourseRepository = Depends(get_course_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    lesson_repository: LessonRepository = Depends(get_lesson_repository),
    enrollment_repository: EnrollmentRepository = Depends(get_enrollment_repository),
    notification_repository: NotificationRepository = Depends(get_notification_repository)
) -> CourseService:
    """
    Proporciona una instancia configurada del servicio de cursos.
    """
    # Create notification service with proper dependency injection
    notification_service = NotificationService(notification_repository)
    
    return CourseService(
        course_repository, 
        user_repository, 
        lesson_repository, 
        enrollment_repository,
        notification_service
    )

async def get_lesson_service(
    lesson_repository: LessonRepository = Depends(get_lesson_repository),
    course_repository: CourseRepository = Depends(get_course_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    module_repository: ModuleRepository = Depends(get_module_repository)
) -> LessonService:
    """
    Proporciona una instancia configurada del servicio de lecciones.
    """
    return LessonService(lesson_repository, course_repository, user_repository, module_repository)

async def get_notification_service(
    notification_repository: NotificationRepository = Depends(get_notification_repository)
) -> NotificationService:
    """
    Proporciona una instancia configurada del servicio de notificaciones.
    """
    return NotificationService(notification_repository)

async def get_enrollment_service(
    enrollment_repository: EnrollmentRepository = Depends(get_enrollment_repository),
    course_repository: CourseRepository = Depends(get_course_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    lesson_repository: LessonRepository = Depends(get_lesson_repository),
    notification_service: NotificationService = Depends(get_notification_service)
) -> EnrollmentService:
    """
    Proporciona una instancia configurada del servicio de inscripciones.
    """
    return EnrollmentService(
        enrollment_repository, 
        course_repository, 
        user_repository, 
        lesson_repository,
        notification_service
    )

async def get_review_service(
    review_repository: ReviewRepository = Depends(get_review_repository),
    course_repository: CourseRepository = Depends(get_course_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    enrollment_repository: EnrollmentRepository = Depends(get_enrollment_repository)
) -> ReviewService:
    """
    Proporciona una instancia configurada del servicio de reseñas.
    """
    return ReviewService(review_repository, course_repository, user_repository, enrollment_repository)

# Instancia global del repositorio de progreso
_progress_repository = None

# Instancia global del repositorio de analytics
_analytics_repository = None

def get_progress_repository() -> ProgressRepository:
    """
    Proporciona una instancia configurada del repositorio de progreso.
    """
    global _progress_repository
    if _progress_repository is None:
        _progress_repository = FileSystemProgressRepository()
    return _progress_repository

async def get_progress_service(
    enrollment_repository: EnrollmentRepository = Depends(get_enrollment_repository),
    notification_service: NotificationService = Depends(get_notification_service)
) -> ProgressService:
    """
    Proporciona una instancia configurada del servicio de progreso.
    """
    return ProgressService(
        progress_repository=get_progress_repository(),
        enrollment_repository=enrollment_repository,
        notification_service=notification_service
    )

def get_analytics_repository() -> FileSystemAnalyticsRepository:
    """
    Proporciona una instancia configurada del repositorio de analytics.
    """
    global _analytics_repository
    if _analytics_repository is None:
        _analytics_repository = FileSystemAnalyticsRepository()
    return _analytics_repository

async def get_analytics_service(
    user_repository: UserRepository = Depends(get_user_repository),
    course_repository: CourseRepository = Depends(get_course_repository),
    enrollment_repository: EnrollmentRepository = Depends(get_enrollment_repository)
) -> AnalyticsService:
    """
    Proporciona una instancia configurada del servicio de analytics.
    """
    return AnalyticsService(
        analytics_repository=get_analytics_repository(),
        user_repository=user_repository,
        course_repository=course_repository,
        enrollment_repository=enrollment_repository,
        progress_repository=get_progress_repository()
    )

async def get_module_service(
    module_repository: ModuleRepository = Depends(get_module_repository),
    course_repository: CourseRepository = Depends(get_course_repository),
    lesson_repository: LessonRepository = Depends(get_lesson_repository)
) -> ModuleService:
    """
    Proporciona una instancia configurada del servicio de módulos.
    """
    return ModuleService(module_repository, course_repository, lesson_repository)

async def get_quiz_service(
    quiz_repository: QuizRepository = Depends(get_quiz_repository),
    lesson_repository: LessonRepository = Depends(get_lesson_repository),
    course_repository: CourseRepository = Depends(get_course_repository),
) -> QuizService:
    """
    Proporciona una instancia configurada del servicio de quizzes.
    """
    return QuizService(quiz_repository, lesson_repository, course_repository)

def get_media_service(
    media_repository: FileSystemMediaRepository = Depends(get_media_repository)
) -> MediaService:
    """
    Proporciona una instancia configurada del servicio de media.
    """
    return MediaService(media_repository)
