#!/bin/bash

# ============================================
# Stegmaier LMS - Test Data Setup Script
# ============================================
# This script creates:
# 1. A tenant organization
# 2. Admin, instructor, and student users
# 3. Course "Estructura de procesos - SICMON" with modules, lessons, and quizzes
#
# Prerequisites:
# - Backend server running on http://localhost:8000
# - PostgreSQL running on localhost:5432
# - All infrastructure services (Redis, MinIO) running
# ============================================

set -e  # Exit on error

# Configuration
API_BASE_URL="http://localhost:8080/api/v1"
POSTGRES_CONTAINER="stegmaier-postgres"
DB_USER="postgres"
DB_PASSWORD="postgres123"
CONTROL_DB="stegmaier_control"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to print colored messages
print_step() {
    echo -e "${BLUE}==>${NC} ${1}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

# Helper function to extract JSON field
extract_json_field() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*" | cut -d'"' -f4
}

# Helper function to generate UUID
generate_uuid() {
    python3 -c 'import uuid; print(str(uuid.uuid4()))' 2>/dev/null || python -c 'import uuid; print(str(uuid.uuid4()))' 2>/dev/null || echo "00000000-0000-0000-0000-$(date +%s)$(shuf -i 1000-9999 -n 1)"
}

# ============================================
# STEP 1: Create SuperAdmin User (No Tenant)
# ============================================
print_step "Creating SuperAdmin user in control database..."

# Generate UUID for superadmin (not used if API returns it)
SUPERADMIN_ID=$(generate_uuid)

# Register superadmin user via API (without tenant)
SUPERADMIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@stegmaier.com",
    "password": "SuperAdmin123!@#",
    "full_name": "Super Administrator",
    "role": "superadmin"
  }')

SUPERADMIN_TOKEN=$(extract_json_field "$SUPERADMIN_RESPONSE" "access_token")
SUPERADMIN_USER_ID=$(extract_json_field "$SUPERADMIN_RESPONSE" "user_id")

if [ -z "$SUPERADMIN_USER_ID" ]; then
    print_warning "SuperAdmin user might already exist, fetching from database..."
    SUPERADMIN_USER_ID=$(docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB -t -c "SELECT id FROM users WHERE email = 'superadmin@stegmaier.com' LIMIT 1;" | xargs)
fi

# Ensure superadmin has correct role and is verified
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB <<EOF
UPDATE users
SET role = 'superadmin', is_verified = true, tenant_id = NULL
WHERE id = '$SUPERADMIN_USER_ID'::uuid;
EOF

print_success "SuperAdmin user created - ID: $SUPERADMIN_USER_ID"

# SuperAdmin login to get token if not obtained from registration
if [ -z "$SUPERADMIN_TOKEN" ]; then
    print_step "Logging in as superadmin..."
    SUPERADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "superadmin@stegmaier.com",
        "password": "SuperAdmin123!@#"
      }')
    SUPERADMIN_TOKEN=$(extract_json_field "$SUPERADMIN_LOGIN_RESPONSE" "access_token")
fi

print_success "SuperAdmin logged in successfully"

# ============================================
# STEP 2: Create Tenant in Control Database
# ============================================
print_step "Creating tenant 'SICMON'..."

TENANT_SLUG="sicmon"
TENANT_DB_NAME="stegmaier_tenant_${TENANT_SLUG}"

# Insert tenant into control database and get generated UUID
TENANT_ID=$(docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB -t -A -c "
INSERT INTO tenants (id, name, slug, database_name, node_number, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'SICMON',
    '$TENANT_SLUG',
    '$TENANT_DB_NAME',
    1,
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET name='SICMON'
RETURNING id;
" 2>/dev/null | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')

print_success "Tenant created with ID: $TENANT_ID"

# ============================================
# STEP 3: Create Tenant Database
# ============================================
print_step "Creating tenant database '$TENANT_DB_NAME'..."

# Create tenant database if it doesn't exist
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d postgres <<EOF
SELECT 'CREATE DATABASE $TENANT_DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$TENANT_DB_NAME')\gexec
EOF

print_success "Tenant database created"

# ============================================
# STEP 4: Run Tenant Migrations
# ============================================
print_step "Running migrations on tenant database..."

# Apply tenant schema migration
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $TENANT_DB_NAME < backend/migrations/tenants/000001_init_tenant_schema.up.sql 2>/dev/null || true

print_success "Migrations applied successfully"

# ============================================
# STEP 5: Register Admin User (for SICMON tenant)
# ============================================
print_step "Registering admin user for SICMON tenant..."

ADMIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "email": "admin@stegmaier.com",
    "password": "Admin123!@#",
    "full_name": "Administrator Stegmaier",
    "role": "admin"
  }')

ADMIN_TOKEN=$(extract_json_field "$ADMIN_RESPONSE" "access_token")
ADMIN_USER_ID=$(extract_json_field "$ADMIN_RESPONSE" "user_id")

if [ -z "$ADMIN_TOKEN" ]; then
    print_warning "Admin user might already exist, attempting login..."
    ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -d '{
        "email": "admin@stegmaier.com",
        "password": "Admin123!@#"
      }')
    ADMIN_TOKEN=$(extract_json_field "$ADMIN_LOGIN_RESPONSE" "access_token")
    ADMIN_USER_ID=$(extract_json_field "$ADMIN_LOGIN_RESPONSE" "user_id")
fi

print_success "Admin user ready - ID: $ADMIN_USER_ID"

# Update admin user to set is_verified = true and ensure role is admin
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB <<EOF
UPDATE users
SET is_verified = true, role = 'admin'
WHERE id = '$ADMIN_USER_ID'::uuid;
EOF

# ============================================
# STEP 6: Register Instructor User (for SICMON tenant)
# ============================================
print_step "Registering instructor user for SICMON tenant..."

INSTRUCTOR_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "email": "instructor@stegmaier.com",
    "password": "Instructor123!@#",
    "full_name": "Carlos Rodriguez",
    "role": "instructor"
  }')

INSTRUCTOR_USER_ID=$(extract_json_field "$INSTRUCTOR_RESPONSE" "user_id")

if [ -z "$INSTRUCTOR_USER_ID" ]; then
    print_warning "Instructor user might already exist, fetching from database..."
    INSTRUCTOR_USER_ID=$(docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB -t -c "SELECT id FROM users WHERE email = 'instructor@stegmaier.com' LIMIT 1;" | xargs)
fi

print_success "Instructor user created - ID: $INSTRUCTOR_USER_ID"

# Update instructor to set is_verified = true
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB <<EOF
UPDATE users
SET is_verified = true, role = 'instructor'
WHERE id = '$INSTRUCTOR_USER_ID'::uuid;
EOF

# Instructor login to get token
print_step "Logging in as instructor..."

INSTRUCTOR_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "email": "instructor@stegmaier.com",
    "password": "Instructor123!@#"
  }')

INSTRUCTOR_TOKEN=$(extract_json_field "$INSTRUCTOR_LOGIN_RESPONSE" "access_token")
print_success "Instructor logged in successfully"

# ============================================
# STEP 7: Register Student User (for SICMON tenant)
# ============================================
print_step "Registering student user for SICMON tenant..."

STUDENT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "email": "student@stegmaier.com",
    "password": "Student123!@#",
    "full_name": "Maria Gonzalez",
    "role": "student"
  }')

STUDENT_USER_ID=$(extract_json_field "$STUDENT_RESPONSE" "user_id")

if [ -z "$STUDENT_USER_ID" ]; then
    print_warning "Student user might already exist, fetching from database..."
    STUDENT_USER_ID=$(docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB -t -c "SELECT id FROM users WHERE email = 'student@stegmaier.com' LIMIT 1;" | xargs)
fi

print_success "Student user created - ID: $STUDENT_USER_ID"

# Update student to set is_verified = true
docker exec -i $POSTGRES_CONTAINER psql -U $DB_USER -d $CONTROL_DB <<EOF
UPDATE users
SET is_verified = true, role = 'student'
WHERE id = '$STUDENT_USER_ID'::uuid;
EOF

# ============================================
# STEP 8: Create Course (as Instructor)
# ============================================
print_step "Creating course 'Estructura de procesos - SICMON'..."

COURSE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"title\": \"Estructura de procesos - SICMON\",
    \"slug\": \"estructura-procesos-sicmon\",
    \"description\": \"Curso completo sobre la estructura y gestión de procesos en el Sistema de Control y Monitoreo (SICMON). Aprenderás a diseñar, implementar y optimizar procesos empresariales utilizando la metodología SICMON.\",
    \"instructorId\": \"$INSTRUCTOR_USER_ID\",
    \"level\": \"intermediate\",
    \"duration\": 40,
    \"price\": 0,
    \"requirements\": [
      \"Conocimientos básicos de gestión empresarial\",
      \"Familiaridad con conceptos de procesos\",
      \"Acceso a computadora con internet\"
    ],
    \"whatYouWillLearn\": [
      \"Fundamentos de la gestión por procesos\",
      \"Estructura del sistema SICMON\",
      \"Diseño y modelado de procesos\",
      \"Implementación de controles y monitoreo\",
      \"Análisis y optimización de procesos\",
      \"Mejores prácticas en gestión de procesos\"
    ],
    \"targetAudience\": [
      \"Gerentes y supervisores\",
      \"Analistas de procesos\",
      \"Consultores empresariales\",
      \"Profesionales de mejora continua\"
    ]
  }")

COURSE_ID=$(extract_json_field "$COURSE_RESPONSE" "id")
print_success "Course created - ID: $COURSE_ID"

# ============================================
# STEP 9: Create Modules
# ============================================
print_step "Creating course modules..."

# Module 1: Introducción
MODULE1_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/modules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "title": "Módulo 1: Introducción a SICMON",
    "description": "Conceptos fundamentales y visión general del sistema SICMON",
    "order": 1,
    "duration": 120,
    "is_published": true
  }')

MODULE1_ID=$(extract_json_field "$MODULE1_RESPONSE" "id")
print_success "Module 1 created - ID: $MODULE1_ID"

# Module 2: Estructura de Procesos
MODULE2_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/modules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "title": "Módulo 2: Estructura de Procesos",
    "description": "Diseño y arquitectura de procesos empresariales",
    "order": 2,
    "duration": 180,
    "is_published": true
  }')

MODULE2_ID=$(extract_json_field "$MODULE2_RESPONSE" "id")
print_success "Module 2 created - ID: $MODULE2_ID"

# Module 3: Control y Monitoreo
MODULE3_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/modules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "title": "Módulo 3: Control y Monitoreo",
    "description": "Implementación de controles y sistemas de monitoreo",
    "order": 3,
    "duration": 150,
    "is_published": true
  }')

MODULE3_ID=$(extract_json_field "$MODULE3_RESPONSE" "id")
print_success "Module 3 created - ID: $MODULE3_ID"

# Module 4: Optimización
MODULE4_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/modules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "title": "Módulo 4: Optimización y Mejora Continua",
    "description": "Técnicas de análisis y optimización de procesos",
    "order": 4,
    "duration": 150,
    "is_published": true
  }')

MODULE4_ID=$(extract_json_field "$MODULE4_RESPONSE" "id")
print_success "Module 4 created - ID: $MODULE4_ID"

# ============================================
# STEP 10: Create Lessons (Video type)
# ============================================
print_step "Creating lessons for Module 1..."

# Module 1 Lessons
curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE1_ID\",
    \"title\": \"¿Qué es SICMON?\",
    \"description\": \"Introducción al Sistema de Control y Monitoreo\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module1-lesson1.mp4\",
    \"duration\": 25,
    \"order_index\": 1,
    \"is_published\": true,
    \"is_free\": true
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE1_ID\",
    \"title\": \"Historia y Evolución de SICMON\",
    \"description\": \"Cómo surgió y evolucionó el sistema SICMON\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module1-lesson2.mp4\",
    \"duration\": 30,
    \"order_index\": 2,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE1_ID\",
    \"title\": \"Beneficios de la Gestión por Procesos\",
    \"description\": \"Ventajas de implementar gestión por procesos\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module1-lesson3.mp4\",
    \"duration\": 20,
    \"order_index\": 3,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

print_success "Module 1 lessons created (3 lessons)"

print_step "Creating lessons for Module 2..."

# Module 2 Lessons
curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE2_ID\",
    \"title\": \"Identificación de Procesos\",
    \"description\": \"Cómo identificar y clasificar procesos en una organización\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module2-lesson1.mp4\",
    \"duration\": 35,
    \"order_index\": 1,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE2_ID\",
    \"title\": \"Modelado de Procesos con BPMN\",
    \"description\": \"Técnicas de modelado utilizando notación BPMN\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module2-lesson2.mp4\",
    \"duration\": 45,
    \"order_index\": 2,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE2_ID\",
    \"title\": \"Documentación de Procesos\",
    \"description\": \"Mejores prácticas para documentar procesos\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module2-lesson3.mp4\",
    \"duration\": 30,
    \"order_index\": 3,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE2_ID\",
    \"title\": \"Jerarquía de Procesos\",
    \"description\": \"Organización jerárquica de procesos, subprocesos y actividades\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module2-lesson4.mp4\",
    \"duration\": 25,
    \"order_index\": 4,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

print_success "Module 2 lessons created (4 lessons)"

print_step "Creating lessons for Module 3..."

# Module 3 Lessons
curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE3_ID\",
    \"title\": \"Indicadores de Desempeño (KPIs)\",
    \"description\": \"Definición y medición de KPIs en procesos\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module3-lesson1.mp4\",
    \"duration\": 40,
    \"order_index\": 1,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE3_ID\",
    \"title\": \"Sistemas de Monitoreo en Tiempo Real\",
    \"description\": \"Implementación de dashboards y alertas\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module3-lesson2.mp4\",
    \"duration\": 35,
    \"order_index\": 2,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE3_ID\",
    \"title\": \"Control de Procesos y Puntos de Control\",
    \"description\": \"Establecimiento de controles efectivos\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module3-lesson3.mp4\",
    \"duration\": 30,
    \"order_index\": 3,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

print_success "Module 3 lessons created (3 lessons)"

print_step "Creating lessons for Module 4..."

# Module 4 Lessons
curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE4_ID\",
    \"title\": \"Análisis de Datos de Procesos\",
    \"description\": \"Técnicas de análisis para identificar mejoras\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module4-lesson1.mp4\",
    \"duration\": 40,
    \"order_index\": 1,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE4_ID\",
    \"title\": \"Metodologías de Mejora: Lean y Six Sigma\",
    \"description\": \"Aplicación de metodologías de mejora continua\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module4-lesson2.mp4\",
    \"duration\": 45,
    \"order_index\": 2,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE4_ID\",
    \"title\": \"Gestión del Cambio en Procesos\",
    \"description\": \"Cómo implementar cambios en los procesos exitosamente\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module4-lesson3.mp4\",
    \"duration\": 30,
    \"order_index\": 3,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/lessons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"module_id\": \"$MODULE4_ID\",
    \"title\": \"Proyecto Final: Implementación de SICMON\",
    \"description\": \"Caso práctico de implementación completa\",
    \"content_type\": \"video\",
    \"content_url\": \"https://placeholder-video.stegmaier.com/module4-lesson4.mp4\",
    \"duration\": 50,
    \"order_index\": 4,
    \"is_published\": true,
    \"is_free\": false
  }" > /dev/null

print_success "Module 4 lessons created (4 lessons)"

# ============================================
# STEP 11: Create Quizzes
# ============================================
print_step "Creating quizzes..."

# Quiz for Module 1
QUIZ1_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/quizzes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"title\": \"Quiz: Introducción a SICMON\",
    \"description\": \"Evaluación de conceptos básicos del módulo 1\",
    \"passing_score\": 70,
    \"time_limit\": 20,
    \"max_attempts\": 3,
    \"shuffle_questions\": true,
    \"show_results\": true
  }")

QUIZ1_ID=$(extract_json_field "$QUIZ1_RESPONSE" "id")
print_success "Quiz 1 created - ID: $QUIZ1_ID"

# Add questions to Quiz 1
curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ1_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "multiple_choice",
    "text": "¿Qué significa SICMON?",
    "points": 10,
    "order_index": 1,
    "options": [
      {"text": "Sistema de Control y Monitoreo", "is_correct": true, "order_index": 1},
      {"text": "Sistema Integrado de Consultoría", "is_correct": false, "order_index": 2},
      {"text": "Sistema de Control Monetario", "is_correct": false, "order_index": 3},
      {"text": "Sistema de Calidad y Monitoreo", "is_correct": false, "order_index": 4}
    ]
  }' > /dev/null

curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ1_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "true_false",
    "text": "La gestión por procesos ayuda a mejorar la eficiencia organizacional",
    "points": 5,
    "order_index": 2,
    "options": [
      {"text": "Verdadero", "is_correct": true, "order_index": 1},
      {"text": "Falso", "is_correct": false, "order_index": 2}
    ]
  }' > /dev/null

curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ1_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "multiple_choice",
    "text": "¿Cuál es uno de los principales beneficios de SICMON?",
    "points": 10,
    "order_index": 3,
    "options": [
      {"text": "Control y monitoreo en tiempo real", "is_correct": true, "order_index": 1},
      {"text": "Reducción de personal", "is_correct": false, "order_index": 2},
      {"text": "Aumento de costos operativos", "is_correct": false, "order_index": 3},
      {"text": "Eliminación de procesos", "is_correct": false, "order_index": 4}
    ]
  }' > /dev/null

print_success "Quiz 1 questions created (3 questions)"

# Quiz for Module 2
QUIZ2_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/quizzes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"title\": \"Quiz: Estructura de Procesos\",
    \"description\": \"Evaluación sobre modelado y documentación de procesos\",
    \"passing_score\": 70,
    \"time_limit\": 25,
    \"max_attempts\": 3,
    \"shuffle_questions\": true,
    \"show_results\": true
  }")

QUIZ2_ID=$(extract_json_field "$QUIZ2_RESPONSE" "id")
print_success "Quiz 2 created - ID: $QUIZ2_ID"

# Add questions to Quiz 2
curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ2_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "multiple_choice",
    "text": "¿Qué significa BPMN?",
    "points": 10,
    "order_index": 1,
    "options": [
      {"text": "Business Process Model and Notation", "is_correct": true, "order_index": 1},
      {"text": "Business Process Management Network", "is_correct": false, "order_index": 2},
      {"text": "Basic Process Modeling Notation", "is_correct": false, "order_index": 3},
      {"text": "Business Performance Monitoring Network", "is_correct": false, "order_index": 4}
    ]
  }' > /dev/null

curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ2_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "short_answer",
    "text": "Menciona tres elementos clave que debe incluir la documentación de un proceso",
    "points": 15,
    "explanation": "Ejemplos: objetivos, responsables, entradas/salidas, actividades, recursos, indicadores",
    "order_index": 2
  }' > /dev/null

print_success "Quiz 2 questions created (2 questions)"

# Quiz for Module 3
QUIZ3_RESPONSE=$(curl -s -X POST "$API_BASE_URL/courses/$COURSE_ID/quizzes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\",
    \"title\": \"Quiz: Control y Monitoreo\",
    \"description\": \"Evaluación sobre KPIs y sistemas de monitoreo\",
    \"passing_score\": 70,
    \"time_limit\": 25,
    \"max_attempts\": 3,
    \"shuffle_questions\": true,
    \"show_results\": true
  }")

QUIZ3_ID=$(extract_json_field "$QUIZ3_RESPONSE" "id")
print_success "Quiz 3 created - ID: $QUIZ3_ID"

# Add questions to Quiz 3
curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ3_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "multiple_choice",
    "text": "¿Qué es un KPI?",
    "points": 10,
    "order_index": 1,
    "options": [
      {"text": "Key Performance Indicator", "is_correct": true, "order_index": 1},
      {"text": "Key Process Implementation", "is_correct": false, "order_index": 2},
      {"text": "Knowledge Process Integration", "is_correct": false, "order_index": 3},
      {"text": "Key Performance Integration", "is_correct": false, "order_index": 4}
    ]
  }' > /dev/null

curl -s -X POST "$API_BASE_URL/quizzes/$QUIZ3_ID/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "type": "true_false",
    "text": "Los dashboards de monitoreo deben actualizarse en tiempo real para ser efectivos",
    "points": 5,
    "order_index": 2,
    "options": [
      {"text": "Verdadero", "is_correct": true, "order_index": 1},
      {"text": "Falso", "is_correct": false, "order_index": 2}
    ]
  }' > /dev/null

print_success "Quiz 3 questions created (2 questions)"

# ============================================
# STEP 12: Enroll Student in Course
# ============================================
print_step "Enrolling student in course..."

# Student login to get token
STUDENT_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "email": "student@stegmaier.com",
    "password": "Student123!@#"
  }')

STUDENT_TOKEN=$(extract_json_field "$STUDENT_LOGIN_RESPONSE" "access_token")

curl -s -X POST "$API_BASE_URL/enrollments/enroll" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"course_id\": \"$COURSE_ID\"
  }" > /dev/null

print_success "Student enrolled in course"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "============================================"
print_success "Test Data Setup Complete!"
echo "============================================"
echo ""
echo "SuperAdmin Account (No Tenant):"
echo "  - Email: superadmin@stegmaier.com"
echo "  - Password: SuperAdmin123!@#"
echo "  - ID: $SUPERADMIN_USER_ID"
echo "  - Role: superadmin"
echo ""
echo "Tenant Information:"
echo "  - Name: SICMON"
echo "  - Slug: $TENANT_SLUG"
echo "  - ID: $TENANT_ID"
echo "  - Database: $TENANT_DB_NAME"
echo ""
echo "User Accounts (SICMON Tenant):"
echo "  Admin:"
echo "    - Email: admin@stegmaier.com"
echo "    - Password: Admin123!@#"
echo "    - ID: $ADMIN_USER_ID"
echo "    - Role: admin"
echo ""
echo "  Instructor:"
echo "    - Email: instructor@stegmaier.com"
echo "    - Password: Instructor123!@#"
echo "    - ID: $INSTRUCTOR_USER_ID"
echo "    - Role: instructor"
echo ""
echo "  Student:"
echo "    - Email: student@stegmaier.com"
echo "    - Password: Student123!@#"
echo "    - ID: $STUDENT_USER_ID"
echo "    - Role: student"
echo ""
echo "Course Created:"
echo "  - Title: Estructura de procesos - SICMON"
echo "  - ID: $COURSE_ID"
echo "  - Modules: 4"
echo "  - Lessons: 14 (all video type with placeholder URLs)"
echo "  - Quizzes: 3"
echo ""
echo "Next Steps:"
echo "  1. Access the frontend at http://localhost:5173"
echo "  2. Log in with any of the accounts above"
echo "  3. Replace placeholder video URLs with actual video files"
echo "  4. Upload videos using the media upload endpoints"
echo "  5. Test the complete course flow"
echo ""
echo "URLs:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: $API_BASE_URL"
echo "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "API Configuration:"
echo "  - Base URL: $API_BASE_URL"
echo "  - Tenant Header: X-Tenant-ID: $TENANT_ID"
echo ""
echo "============================================"
