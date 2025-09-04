"""
Endpoints para la autenticación de usuarios
"""
from fastapi import APIRouter, Depends, HTTPException, status
from ....application.services.auth_service import AuthService
from ....application.dtos.auth_dto import (
    Token, LoginData, RegistrationData, 
    PasswordResetRequest, PasswordReset,
    VerificationResponse, ResendVerificationRequest
)
from ....dependencies import get_auth_service, get_user_service, get_email_service
from fastapi.security import SecurityScopes
from ...deps import get_current_user
from ....domain.entities.user import User

router = APIRouter()

@router.post("/login", response_model=Token, summary="Iniciar sesión")
async def login(
    login_data: LoginData,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Inicia sesión y obtiene un token JWT usando JSON.
    
    - **username**: Nombre de usuario o email
    - **password**: Contraseña
    
    Retorna un token de acceso JWT si las credenciales son válidas.
    """
    
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
async def register_user(
    registration_data: RegistrationData, 
    auth_service: AuthService = Depends(get_auth_service),
    email_service = Depends(get_email_service)
):
    """Registra un nuevo usuario en el sistema.
    
    - **email**: Email del usuario
    - **firstName**: Nombre del usuario
    - **lastName**: Apellido del usuario
    - **password**: Contraseña
    """
    try:
        user, verification_token = await auth_service.register_user(registration_data)
        
        # Enviar correo de verificación
        print(f"🔧 [AUTH] Sending verification email to {user.email}")
        email_sent = await email_service.send_welcome_email(
            user_email=user.email,
            user_name=user.full_name or user.username,
            verification_token=verification_token
        )
        
        if email_sent:
            print(f"✅ [AUTH] Verification email sent successfully to {user.email}")
        else:
            print(f"❌ [AUTH] Failed to send verification email to {user.email}")
        
        # Log temporal para desarrollo 
        print(f"🔍 [DEBUG] Token de verificación para {user.email}: {verification_token}")
        
        return {
            "message": "Usuario registrado correctamente. Se ha enviado un correo de verificación a tu email.",
            "user_id": user.id,
            "email_sent": email_sent
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


@router.get("/me", summary="Obtener información del usuario actual")
async def get_current_user_info(
    security_scopes: SecurityScopes = SecurityScopes(),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene la información del usuario autenticado actual.
    
    Requiere autenticación con token JWT.
    """
    # Extraer nombres del full_name si existe
    first_name, last_name = "", ""
    if current_user.full_name:
        name_parts = current_user.full_name.strip().split()
        if len(name_parts) >= 1:
            first_name = name_parts[0]
        if len(name_parts) >= 2:
            last_name = " ".join(name_parts[1:])
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "firstName": first_name,
        "lastName": last_name,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "verified": current_user.is_verified,  # Corregido: is_verified no verified
        "createdAt": current_user.created_at.isoformat() if current_user.created_at else None,
        "updatedAt": current_user.updated_at.isoformat() if current_user.updated_at else None
    }
