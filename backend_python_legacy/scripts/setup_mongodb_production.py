"""
Script para configurar MongoDB para producción con optimizaciones completas
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from mongodb_optimization import MongoDBOptimizer
from app.infrastructure.database_optimization import DatabaseQueryOptimizer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def setup_production_mongodb():
    """
    Configuración completa de MongoDB para producción
    """
    # Configuración desde variables de entorno
    MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "stegmaier_lms")
    
    logger.info("🚀 Iniciando configuración de MongoDB para producción...")
    
    try:
        # Crear optimizador e índices
        optimizer = MongoDBOptimizer(MONGO_URL, DATABASE_NAME)
        await optimizer.optimize_all()
        
        # Configurar query optimizer
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DATABASE_NAME]
        
        query_optimizer = DatabaseQueryOptimizer(db)
        await query_optimizer.create_aggregation_indexes()
        
        # Configuraciones adicionales de producción
        await configure_production_settings(db)
        
        logger.info("✅ MongoDB configurado exitosamente para producción")
        
    except Exception as e:
        logger.error(f"❌ Error en configuración: {e}")
        raise
    finally:
        if 'client' in locals():
            client.close()

async def configure_production_settings(db):
    """
    Configuraciones adicionales para producción
    """
    # Configurar read preference para distribución de carga
    await db.command("setReadPreference", "secondaryPreferred")
    
    # Configurar write concern para durabilidad
    await db.command("setDefaultRWConcern", {
        "defaultWriteConcern": {
            "w": "majority",
            "j": True,
            "wtimeout": 5000
        }
    })
    
    # Configurar compresión
    await db.command("setParameter", "storageEngineCacheSizeGB", 1)
    
    logger.info("✅ Configuraciones de producción aplicadas")

if __name__ == "__main__":
    asyncio.run(setup_production_mongodb())
