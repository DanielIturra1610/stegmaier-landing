"""
Endpoints para la gestión de usuarios
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from ....application.services.user_service import UserService
from ....application.dtos.user_dto import (
    UserResponse, UserCreate, UserUpdate, UserPasswordUpdate
)
from ....domain.entities.user import User
from ....dependencies import get_user_service
from ...deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[UserResponse], summary="Obtener lista de usuarios")
async def get_users(
    skip: int = Query(0, ge=0, description="Número de usuarios a saltar"),
    limit: int = Query(100, ge=1, le=100, description="Número máximo de usuarios a devolver"),
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Obtiene una lista paginada de usuarios.
    
    Requiere permisos de administrador.
    
    - **skip**: Número de usuarios a saltar (paginación)
    - **limit**: Número máximo de usuarios a devolver (paginación)
    """
    return await user_service.get_users(skip, limit)


@router.get("/me", response_model=UserResponse, summary="Obtener información del usuario actual")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Obtiene la información del usuario autenticado actual.
    """
    return current_user


@router.get("/{user_id}", response_model=UserResponse, summary="Obtener usuario por ID")
async def get_user_by_id(
    user_id: str = Path(..., description="ID del usuario"),
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Obtiene la información de un usuario específico por su ID.
    
    Solo los administradores pueden ver la información de cualquier usuario.
    Los usuarios normales solo pueden ver su propia información.
    
    - **user_id**: ID del usuario a consultar
    """
    # Verificar permisos
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver la información de este usuario"
        )
    
    # Obtener el usuario
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo usuario")
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Crea un nuevo usuario.
    
    Requiere permisos de administrador.
    
    - **user_data**: Datos del usuario a crear
    """
    try:
        return await user_service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/me", response_model=UserResponse, summary="Actualizar información del usuario actual")
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Actualiza la información del usuario autenticado actual.
    
    - **user_data**: Datos a actualizar
    """
    try:
        updated_user = await user_service.update_user(current_user.id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{user_id}", response_model=UserResponse, summary="Actualizar información de un usuario")
async def update_user(
    user_data: UserUpdate,
    user_id: str = Path(..., description="ID del usuario"),
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Actualiza la información de un usuario específico.
    
    Requiere permisos de administrador.
    
    - **user_id**: ID del usuario a actualizar
    - **user_data**: Datos a actualizar
    """
    try:
        updated_user = await user_service.update_user(user_id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/me/password", response_model=dict, summary="Actualizar contraseña del usuario actual")
async def update_current_user_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Actualiza la contraseña del usuario autenticado actual.
    
    - **password_data**: Datos de contraseña actual y nueva
    """
    try:
        result = await user_service.update_user_password(current_user.id, password_data)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return {"message": "Contraseña actualizada correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{user_id}", response_model=dict, summary="Eliminar un usuario")
async def delete_user(
    user_id: str = Path(..., description="ID del usuario"),
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Elimina un usuario específico.
    
    Requiere permisos de administrador.
    
    - **user_id**: ID del usuario a eliminar
    """
    # Verificar que no se esté eliminando a sí mismo
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    result = await user_service.delete_user(user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"message": "Usuario eliminado correctamente"}


@router.put("/{user_id}/role", response_model=dict, summary="Cambiar rol de usuario")
async def change_user_role(
    new_role: str,
    user_id: str = Path(..., description="ID del usuario"),
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Cambia el rol de un usuario específico.
    
    Requiere permisos de administrador.
    
    - **user_id**: ID del usuario
    - **new_role**: Nuevo rol (student, instructor, admin)
    """
    # Validar que el rol sea válido
    valid_roles = ["student", "instructor", "admin"]
    if new_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
        )
    
    # Verificar que no se esté cambiando su propio rol de admin
    if current_user.id == user_id and current_user.role == "admin" and new_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes cambiar tu propio rol de administrador"
        )
    
    try:
        from ...domain.entities.user import UserRole
        role_enum = UserRole(new_role)
        
        from ...application.dtos.user_dto import UserUpdate
        user_data = UserUpdate(role=role_enum)
        
        updated_user = await user_service.update_user(user_id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return {
            "message": f"Rol cambiado exitosamente a {new_role}",
            "user_id": user_id,
            "new_role": new_role,
            "updated_user": {
                "id": updated_user.id,
                "email": updated_user.email,
                "full_name": updated_user.full_name,
                "role": updated_user.role
            }
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
