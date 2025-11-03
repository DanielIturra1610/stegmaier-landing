"""
Script para inicializar la base de datos con las colecciones necesarias
"""
from motor.motor_asyncio import AsyncIOMotorClient
from ...core.config import get_settings

async def init_db():
    """
    Inicializa la base de datos creando las colecciones necesarias y los índices
    """
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_database]
    
    # Lista de colecciones a crear si no existen
    collections = [
        "users",
        "courses",
        "lessons",
        "enrollments",
        "reviews",
        "verification_tokens"
    ]
    
    # Crear colecciones si no existen
    for collection_name in collections:
        if collection_name not in await db.list_collection_names():
            await db.create_collection(collection_name)
    
    # Crear índices para usuarios
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    
    # Crear índices para tokens de verificación
    await db.verification_tokens.create_index("token", unique=True)
    await db.verification_tokens.create_index("user_id")
    await db.verification_tokens.create_index("expires_at")
    
    # Otros índices que puedan ser necesarios
    
    return db
