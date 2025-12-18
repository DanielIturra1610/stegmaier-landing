# Script para agregar getTenantDB a todos los métodos de CertificatesRepository
$file = "backend\internal\core\certificates\adapters\postgresql.go"
$content = Get-Content $file -Raw

# Lista de métodos y sus tenantID sources
$methods = @{
    'CreateCertificate' = 'certificate.TenantID'
    'GetCertificate' = 'tenantID'
    'GetCertificateByNumber' = 'tenantID'
    'GetCertificateByUserAndCourse' = 'tenantID'
    'ListCertificates' = 'tenantID'
    'ListCertificatesByUser' = 'tenantID'
    'ListCertificatesByCourse' = 'tenantID'
    'UpdateCertificate' = 'certificate.TenantID'
    'DeleteCertificate' = 'tenantID'
    'RevokeCertificate' = 'tenantID'
    'SetCertificateExpiration' = 'tenantID'
    'VerifyCertificate' = 'tenantID'
    'CertificateExists' = 'tenantID'
    'GetCertificateStatistics' = 'tenantID'
    'GetCourseStatistics' = 'tenantID'
    'CountCertificatesByStatus' = 'tenantID'
    'CreateTemplate' = 'template.TenantID'
    'GetTemplate' = 'tenantID'
    'GetDefaultTemplate' = 'tenantID'
    'ListTemplates' = 'tenantID'
    'UpdateTemplate' = 'template.TenantID'
    'DeleteTemplate' = 'tenantID'
    'SetDefaultTemplate' = 'tenantID'
}

foreach ($method in $methods.Keys) {
    $tenantSource = $methods[$method]
    
    # Pattern para encontrar el método y agregar getTenantDB justo después del {
    $pattern = "(func \(r \*PostgreSQLCertificateRepository\) $method\([^\)]+\)[^\{]+\{)"
    
    if ($content -match $pattern) {
        $getTenantCode = "`n`tdb, err := r.getTenantDB($tenantSource)`n`tif err != nil {`n`t`treturn nil, fmt.Errorf(`"failed to get tenant DB: %w`", err)`n`t}`n"
        
        # Para métodos que retornan error (no pointer)
        if ($method -in @('CreateCertificate', 'UpdateCertificate', 'DeleteCertificate', 'RevokeCertificate', 'SetCertificateExpiration', 'CreateTemplate', 'UpdateTemplate', 'DeleteTemplate', 'SetDefaultTemplate')) {
            $getTenantCode = "`n`tdb, err := r.getTenantDB($tenantSource)`n`tif err != nil {`n`t`treturn fmt.Errorf(`"failed to get tenant DB: %w`", err)`n`t}`n"
        }
        
        # Para CertificateExists que retorna (bool, error)
        if ($method -eq 'CertificateExists') {
            $getTenantCode = "`n`tdb, err := r.getTenantDB(tenantID)`n`tif err != nil {`n`t`treturn false, fmt.Errorf(`"failed to get tenant DB: %w`", err)`n`t}`n"
        }
        
        # Para CountCertificatesByStatus que retorna (int, error)
        if ($method -eq 'CountCertificatesByStatus') {
            $getTenantCode = "`n`tdb, err := r.getTenantDB(tenantID)`n`tif err != nil {`n`t`treturn 0, fmt.Errorf(`"failed to get tenant DB: %w`", err)`n`t}`n"
        }
        
        # Para ListCertificates que retorna ([]*domain.Certificate, int, error)
        if ($method -in @('ListCertificates', 'ListCertificatesByUser', 'ListCertificatesByCourse', 'ListTemplates')) {
            $getTenantCode = "`n`tdb, err := r.getTenantDB(tenantID)`n`tif err != nil {`n`t`treturn nil, 0, fmt.Errorf(`"failed to get tenant DB: %w`", err)`n`t}`n"
        }
        
        $content = $content -replace $pattern, "`$1$getTenantCode"
        Write-Host "Added getTenantDB to $method"
    }
}

# Corregir declaraciones de err duplicadas (err := cuando ya existe err)
$content = $content -replace '(\s+db, err := r\.getTenantDB[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n\s+)(?:metadataJSON, err := json\.Marshal)', '$1metadataJSON, err = json.Marshal'

Set-Content $file -Value $content -NoNewline
Write-Host "`nDone! CertificatesRepository refactored successfully"
