# src/api/contact.py
from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import time
import os
from cachetools import TTLCache
import re
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent

app = FastAPI()

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("ALLOWED_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# Caché para rate limiting
rate_limit = 5  # solicitudes por minuto
rate_limit_window = 60  # segundos
rate_limit_cache = TTLCache(maxsize=500, ttl=rate_limit_window)

# Modelo de datos con validación
class ContactForm(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    company: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    service: str = Field(..., max_length=100)
    message: str = Field(..., min_length=10, max_length=2000)
    gotcha: Optional[str] = Field(None)  # Honeypot field

    @validator('name')
    def name_must_contain_only_letters(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$', v):
            raise ValueError('El nombre solo puede contener letras')
        return v
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v and not re.match(r'^[0-9+\s()-]{0,20}$', v):
            raise ValueError('Formato de teléfono inválido')
        return v
    
    @validator('message')
    def message_no_html(cls, v):
        if re.search(r'[<>]', v):
            raise ValueError('El mensaje no puede contener HTML')
        return v

# Rate limiting middleware
async def check_rate_limit(request: Request):
    client_ip = request.client.host
    current_time = time.time()
    
    # Limpiar entradas antiguas
    client_requests = rate_limit_cache.get(client_ip, [])
    client_requests = [t for t in client_requests if current_time - t < rate_limit_window]
    
    if len(client_requests) >= rate_limit:
        raise HTTPException(
            status_code=429,
            detail="Demasiadas solicitudes. Intente más tarde."
        )
    
    client_requests.append(current_time)
    rate_limit_cache[client_ip] = client_requests
    
    return True

# Función para sanitizar inputs
def sanitize_input(input: str) -> str:
    if not input:
        return ""
    
    return (input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#039;")
            .strip())

# Función para enviar email (SendGrid)
async def send_email(form_data: ContactForm):
    # Usar la API key específica
    api_key = os.environ.get("SENDGRID_API_KEY")
    if not api_key:
        print("Error: SENDGRID_API_KEY no encontrada")
        return {"success": False, "message": "Configuración de API incorrecta"}
        
    sg = sendgrid.SendGridAPIClient(api_key=api_key)
    
    from_email = Email(os.environ.get("SENDGRID_FROM", "daniel.eduardo1610@gmail.com"))
    to_email = To(os.environ.get("SENDGRID_TO", "contacto@stegmaierconsulting.cl"))
    subject = f"Nuevo contacto de {form_data.name}"
    
    # Crear mensaje HTML
    message_with_br = sanitize_input(form_data.message).replace("\n", "<br>")
    html_content = f"""
    <h2>Nuevo mensaje desde stegmaierconsulting.cl</h2>
    <p><strong>Nombre:</strong> {sanitize_input(form_data.name)}</p>
    <p><strong>Email:</strong> {sanitize_input(form_data.email)}</p>
    <p><strong>Empresa:</strong> {sanitize_input(form_data.company or 'No especificada')}</p>
    <p><strong>Teléfono:</strong> {sanitize_input(form_data.phone or 'No especificado')}</p>
    <p><strong>Servicio:</strong> {sanitize_input(form_data.service)}</p>
    <p><strong>Mensaje:</strong></p>
    <div style="padding: 15px; background-color: #f7f7f7; border-left: 4px solid #0070f3;">
        {message_with_br}
    </div>
    """
    
    # Crear mensaje texto plano
    text_content = f"""
    Nuevo mensaje de contacto:
    
    Nombre: {form_data.name}
    Email: {form_data.email}
    Empresa: {form_data.company or 'No especificada'}
    Teléfono: {form_data.phone or 'No especificado'}
    Servicio: {form_data.service}
    
    Mensaje:
    {form_data.message}
    """
    
    content = Content("text/html", html_content)
    mail = Mail(from_email, to_email, subject, content)
    mail.reply_to = form_data.email
    
    try:
        response = sg.client.mail.send.post(request_body=mail.get())
        print(f"Email enviado correctamente. Status code: {response.status_code}")
        # Para debugging, podemos obtener el mensaje ID
        message_id = response.headers.get('X-Message-Id', '')
        if message_id:
            print(f"Message ID: {message_id}")
        return {
            "success": True, 
            "message": "Email enviado correctamente",
            "status_code": response.status_code,
            "message_id": message_id
        }
    except Exception as e:
        print(f"Error al enviar email: {str(e)}")
        return {
            "success": False, 
            "message": "Error al enviar el email", 
            "error": str(e)
        }

@app.post("/api/contact")
async def contact_handler(
    form_data: ContactForm, 
    background_tasks: BackgroundTasks,
    _: bool = Depends(check_rate_limit)
):
    # Verificar honeypot
    if form_data.gotcha:
        # Simular éxito para no alertar al bot
        print("Honeypot detectado, ignorando solicitud")
        return {"success": True, "message": "Mensaje enviado correctamente"}
    
    # Enviar email en segundo plano
    background_tasks.add_task(send_email, form_data)
    
    return {"success": True, "message": "Mensaje enviado correctamente"}

# Para desarrollo local
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)