"""
Endpoints para la autenticación de usuarios
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ....application.services.auth_service import AuthService
from ....application.dtos.auth_dto import (
    Token, LoginData, RegistrationData, PasswordResetRequest, PasswordReset
)
from ....dependencies import get_auth_service

router = APIRouter()

@router.post("/login", response_model=Token, summary="Iniciar sesión")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Inicia sesión y obtiene un token JWT.
    
    - **username**: Nombre de usuario o email
    - **password**: Contraseña
    
    Retorna un token de acceso JWT si las credenciales son válidas.
    """
    # Crear datos de inicio de sesión a partir del formulario
    login_data = LoginData(
        username=form_data.username,
        password=form_data.password
    )
    
    # Autenticar al usuario
    user = await auth_service.authenticate_user(login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario/email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token JWT
    return auth_service.create_token(user)


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Registrar un nuevo usuario")
async def register(
    registration_data: RegistrationData,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Registra un nuevo usuario.
    
    - **email**: Correo electrónico
    - **username**: Nombre de usuario
    - **password**: Contraseña
    - **confirm_password**: Confirmación de contraseña
    - **full_name**: Nombre completo
    
    Retorna un mensaje de confirmación si el registro es exitoso.
    """
    try:
        user = await auth_service.register_user(registration_data)
        return {"message": "Usuario registrado correctamente", "user_id": user.id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/password-reset/request", summary="Solicitar restablecimiento de contraseña")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Solicita el restablecimiento de contraseña.
    
    - **email**: Correo electrónico asociado a la cuenta
    
    Retorna un mensaje de confirmación si la solicitud es exitosa.
    """
    result = await auth_service.reset_password(reset_request.email)
    
    # Siempre devolver un mensaje exitoso aunque el email no exista (por seguridad)
    return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}


@router.post("/password-reset/confirm", summary="Confirmar restablecimiento de contraseña")
async def confirm_password_reset(
    reset_data: PasswordReset,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Confirma el restablecimiento de contraseña usando un token temporal.
    
    - **token**: Token de restablecimiento
    - **new_password**: Nueva contraseña
    - **confirm_password**: Confirmación de nueva contraseña
    
    Retorna un mensaje de confirmación si el restablecimiento es exitoso.
    """
    # Este endpoint se completaría con la verificación del token temporal
    # y el cambio de contraseña
    
    # Por ahora, devolver un mensaje de error
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidad de restablecimiento de contraseña no implementada completamente"
    )
