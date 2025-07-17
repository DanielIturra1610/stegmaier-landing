"""
Endpoints para la autenticación de usuarios
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.application.services.auth_service import AuthService
from app.application.dtos.auth_dto import (
    Token, LoginData, RegistrationData, 
    PasswordResetRequest, PasswordReset,
    VerificationResponse, ResendVerificationRequest
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
async def register_user(registration_data: RegistrationData, auth_service: AuthService = Depends(get_auth_service)):
    """Registra un nuevo usuario en el sistema.
    
    - **email**: Email del usuario
    - **username**: Nombre de usuario
    - **password**: Contraseña
    - **confirm_password**: Confirmación de contraseña
    - **full_name**: Nombre completo del usuario
    """
    try:
        user, verification_token = await auth_service.register_user(registration_data)
        # En una implementación real, aquí se enviaría el correo con el enlace de verificación
        # que contendría el token
        verification_url = f"/verify-email/{verification_token}"
        
        # Log temporal para desarrollo (en producción se eliminaría)
        print(f"[DEBUG] Token de verificación para {user.email}: {verification_token}")
        print(f"[DEBUG] URL de verificación: {verification_url}")
        
        return {
            "message": "Usuario registrado correctamente. Debe verificar su correo electrónico.",
            "user_id": user.id,
            "verification_token": verification_token  # Solo para desarrollo, en producción no se devolvería
        }
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


@router.post("/confirm-reset-password", response_model=dict, summary="Confirmar restablecimiento de contraseña")
async def confirm_reset_password(reset_data: PasswordReset, auth_service: AuthService = Depends(get_auth_service)):
    """Confirma el restablecimiento de contraseña con un token temporal.
    
    - **token**: Token temporal recibido por correo electrónico
    - **new_password**: Nueva contraseña
    - **confirm_password**: Confirmación de la nueva contraseña
    """
    success = await auth_service.confirm_reset_password(reset_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    return {"message": "Contraseña restablecida correctamente"}


@router.post("/verify-email/{token}", response_model=VerificationResponse, summary="Verificar correo electrónico")
async def verify_email(token: str, auth_service: AuthService = Depends(get_auth_service)):
    """Verifica el correo electrónico de un usuario mediante un token.
    
    - **token**: Token de verificación recibido por correo electrónico
    """
    verification_result = await auth_service.verify_email(token)
    
    if not verification_result.success:
        # Aunque no lanzamos una excepción HTTP para permitir manejar el error en el frontend
        # de forma personalizada, devolvemos un código 400 para consistencia con REST
        return verification_result
    
    return verification_result


@router.post("/resend-verification", response_model=VerificationResponse, summary="Reenviar correo de verificación")
async def resend_verification(request: ResendVerificationRequest, auth_service: AuthService = Depends(get_auth_service)):
    """Reenvía el correo de verificación a un usuario.
    
    - **email**: Email del usuario
    """
    verification_result = await auth_service.resend_verification(request.email)
    
    if not verification_result.success:
        # Al igual que en verify_email, devolvemos el resultado para manejo personalizado en frontend
        return verification_result
        
    return verification_result


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
