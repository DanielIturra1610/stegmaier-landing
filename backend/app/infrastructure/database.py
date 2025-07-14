"""
Configuración de conexión a MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from ..core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def get_database():
    return db.db

async def connect_to_mongo():
    """
    Conectar a MongoDB al iniciar la aplicación
    """
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.MONGODB_DB_NAME]
    print("Conectado a MongoDB")

async def close_mongo_connection():
    """
    Cerrar conexión a MongoDB al detener la aplicación
    """
    if db.client:
        db.client.close()
        print("Conexión a MongoDB cerrada")
