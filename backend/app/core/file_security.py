"""
Enhanced File Security Validation
Validaciones críticas de seguridad para uploads de archivos
"""
import os
import magic
import hashlib
from typing import List, Tuple, Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException
from .config import get_settings

settings = get_settings()

class FileSecurityValidator:
    """
    Validador de seguridad para archivos subidos
    """
    
    # Extensiones peligrosas que nunca se deben permitir
    DANGEROUS_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
        '.php', '.asp', '.aspx', '.jsp', '.py', '.sh', '.pl', '.rb', '.go',
        '.ps1', '.msi', '.deb', '.rpm', '.dmg', '.app', '.elf', '.bin'
    }
    
    # Magic numbers para validación de tipos MIME reales
    MIME_SIGNATURES = {
        'video/mp4': [
            b'\x00\x00\x00\x18ftypmp4',  # MP4
            b'\x00\x00\x00\x20ftypiso',  # ISO MP4
            b'\x00\x00\x00\x1cftypisom', # ISOM MP4
        ],
        'video/webm': [
            b'\x1a\x45\xdf\xa3',  # WebM/Matroska
        ],
        'image/jpeg': [
            b'\xff\xd8\xff',  # JPEG
        ],
        'image/png': [
            b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a',  # PNG
        ],
        'image/webp': [
            b'RIFF....WEBP',  # WebP (with wildcard for file size)
        ]
    }
    
    def __init__(self):
        self.max_video_size = settings.MAX_VIDEO_SIZE
        self.max_image_size = settings.MAX_IMAGE_SIZE
        self.allowed_video_types = settings.ALLOWED_VIDEO_TYPES
        self.allowed_image_types = settings.ALLOWED_IMAGE_TYPES
    
    def validate_file_extension(self, filename: str) -> bool:
        """
        Validar que la extensión no sea peligrosa
        """
        if not filename:
            return False
        
        # Obtener todas las extensiones (ej: .tar.gz)
        path = Path(filename.lower())
        extensions = []
        while path.suffix:
            extensions.append(path.suffix)
            path = path.with_suffix('')
        
        # Verificar que ninguna extensión sea peligrosa
        for ext in extensions:
            if ext in self.DANGEROUS_EXTENSIONS:
                return False
        
        return True
    
    def validate_mime_type(self, file_content: bytes, expected_mime: str) -> bool:
        """
        Validar tipo MIME usando magic numbers
        """
        if expected_mime not in self.MIME_SIGNATURES:
            return False
        
        # Verificar magic numbers
        for signature in self.MIME_SIGNATURES[expected_mime]:
            if signature.count(b'.') > 0:  # Signature with wildcards
                # Handle WebP special case
                if expected_mime == 'image/webp':
                    if file_content.startswith(b'RIFF') and b'WEBP' in file_content[:12]:
                        return True
            else:
                if file_content.startswith(signature):
                    return True
        
        return False
    
    def validate_file_size(self, file_size: int, file_type: str) -> bool:
        """
        Validar tamaño de archivo según tipo
        """
        if file_type.startswith('video/'):
            return file_size <= self.max_video_size
        elif file_type.startswith('image/'):
            return file_size <= self.max_image_size
        return False
    
    def scan_for_malicious_content(self, file_content: bytes) -> List[str]:
        """
        Escanear contenido malicioso en archivos
        """
        threats = []
        
        # Patrones peligrosos comunes
        dangerous_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'onload=',
            b'onerror=',
            b'eval(',
            b'document.write',
            b'window.location',
            b'<?php',
            b'<%',
            b'#!/bin/sh',
            b'#!/bin/bash',
            b'\x00\x00\x00\x00MSCF',  # Microsoft Cabinet
            b'MZ\x90\x00',  # PE executable
        ]
        
        content_lower = file_content.lower()
        for pattern in dangerous_patterns:
            if pattern in content_lower:
                threats.append(f"Suspicious pattern detected: {pattern.decode('utf-8', errors='ignore')}")
        
        # Verificar archivos ZIP embebidos
        if b'PK\x03\x04' in file_content:
            threats.append("Embedded ZIP archive detected")
        
        # Verificar scripts embebidos en imágenes
        if any(marker in file_content for marker in [b'<?xml', b'<svg', b'<script']):
            threats.append("Potentially malicious XML/SVG content")
        
        return threats
    
    def calculate_file_hash(self, file_content: bytes) -> str:
        """
        Calcular hash SHA256 del archivo para detección de duplicados
        """
        return hashlib.sha256(file_content).hexdigest()
    
    async def validate_upload(
        self, 
        file: UploadFile, 
        expected_type: str = None
    ) -> Tuple[bool, List[str]]:
        """
        Validación completa de archivo subido
        
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        errors = []
        
        # 1. Verificar que el archivo existe
        if not file or not file.filename:
            errors.append("No file provided")
            return False, errors
        
        # 2. Validar extensión
        if not self.validate_file_extension(file.filename):
            errors.append(f"Dangerous file extension in: {file.filename}")
        
        # 3. Leer contenido para validaciones adicionales
        try:
            file_content = await file.read()
            await file.seek(0)  # Reset file pointer
        except Exception as e:
            errors.append(f"Failed to read file: {str(e)}")
            return False, errors
        
        # 4. Validar tamaño
        file_size = len(file_content)
        if file_size == 0:
            errors.append("Empty file not allowed")
        
        # 5. Detectar tipo MIME real usando python-magic
        try:
            actual_mime = magic.from_buffer(file_content, mime=True)
        except Exception:
            # Fallback si magic no está disponible
            actual_mime = file.content_type
        
        # 6. Validar tipo MIME
        if expected_type:
            allowed_types = (
                self.allowed_video_types if expected_type == 'video' 
                else self.allowed_image_types if expected_type == 'image'
                else []
            )
            
            if actual_mime not in allowed_types:
                errors.append(f"File type {actual_mime} not allowed. Allowed: {allowed_types}")
        
        # 7. Validar tamaño según tipo
        if actual_mime and not self.validate_file_size(file_size, actual_mime):
            max_size = self.max_video_size if actual_mime.startswith('video/') else self.max_image_size
            errors.append(f"File size {file_size} exceeds maximum {max_size} bytes")
        
        # 8. Validar magic numbers
        if actual_mime in self.MIME_SIGNATURES:
            if not self.validate_mime_type(file_content, actual_mime):
                errors.append(f"File signature doesn't match declared type {actual_mime}")
        
        # 9. Escanear contenido malicioso
        threats = self.scan_for_malicious_content(file_content)
        if threats:
            errors.extend([f"Security threat: {threat}" for threat in threats])
        
        # 10. Validaciones adicionales para tipos específicos
        if actual_mime.startswith('image/'):
            # Verificar que realmente sea una imagen válida
            try:
                from PIL import Image
                import io
                Image.open(io.BytesIO(file_content)).verify()
            except Exception:
                errors.append("Invalid image file format")
        
        is_valid = len(errors) == 0
        return is_valid, errors


# Instancia global del validador
file_security_validator = FileSecurityValidator()


async def validate_uploaded_file(
    file: UploadFile, 
    file_type: str = None
) -> Tuple[bool, List[str], Optional[str]]:
    """
    Helper function para validar archivos subidos
    
    Args:
        file: Archivo subido
        file_type: Tipo esperado ('video' o 'image')
    
    Returns:
        Tuple[bool, List[str], Optional[str]]: (is_valid, errors, file_hash)
    """
    is_valid, errors = await file_security_validator.validate_upload(file, file_type)
    
    # Calcular hash si el archivo es válido
    file_hash = None
    if is_valid:
        try:
            content = await file.read()
            await file.seek(0)  # Reset pointer
            file_hash = file_security_validator.calculate_file_hash(content)
        except Exception as e:
            errors.append(f"Failed to calculate file hash: {str(e)}")
            is_valid = False
    
    return is_valid, errors, file_hash
