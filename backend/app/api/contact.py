from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Añadir directorio src al path para importar módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importar la funcionalidad del módulo de src/api
from src.api.contact import app

# Crear handler para Vercel serverless function
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Obtener el tamaño del contenido
        content_length = int(self.headers['Content-Length'])
        # Leer el cuerpo de la solicitud
        request_body = self.rfile.read(content_length)
        # Parsear como JSON
        body = json.loads(request_body)
        
        # Configurar respuesta
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        # Configurar CORS para permitir solicitudes desde cualquier origen
        self.send_header('Access-Control-Allow-Origin', os.environ.get("ALLOWED_ORIGIN", "*"))
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
        
        try:
            # Procesar el formulario como lo haría el endpoint FastAPI
            from src.api.contact import ContactForm, send_email, check_rate_limit
            
            # Verificar honeypot
            if body.get('_gotcha'):
                # Simular éxito para no alertar al bot
                response = {"success": True, "message": "Mensaje enviado correctamente"}
            else:
                # Crear objeto de formulario
                form_data = ContactForm(
                    name=body.get('name'),
                    email=body.get('email'),
                    company=body.get('company', ''),
                    phone=body.get('phone', ''),
                    service=body.get('service'),
                    message=body.get('message'),
                    _gotcha=body.get('_gotcha', '')
                )
                
                # Enviar email
                import asyncio
                response = asyncio.run(send_email(form_data))
                
            # Devolver respuesta
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            # Manejar errores
            error_response = {
                "success": False, 
                "message": "Error al procesar la solicitud", 
                "error": str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        # Manejar solicitudes OPTIONS para CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', os.environ.get("ALLOWED_ORIGIN", "*"))
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
        
        # Devolver respuesta vacía
        self.wfile.write(b'')
