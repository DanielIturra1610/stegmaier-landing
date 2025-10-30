package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config contiene toda la configuración de la aplicación
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Email    EmailConfig
	Redis    RedisConfig
	Storage  StorageConfig
	Logging  LoggingConfig
}

// ServerConfig contiene la configuración del servidor
type ServerConfig struct {
	Port        string
	Environment string
	CORSOrigins []string
}

// DatabaseConfig contiene la configuración de bases de datos
type DatabaseConfig struct {
	Control DatabaseConnection
	Tenant  TenantDatabaseConfig
}

// DatabaseConnection representa la configuración de una conexión a base de datos
type DatabaseConnection struct {
	Host     string
	Port     int
	Name     string
	User     string
	Password string
	SSLMode  string
}

// TenantDatabaseConfig contiene la configuración para bases de datos de tenants
type TenantDatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	SSLMode  string
}

// JWTConfig contiene la configuración de JWT
type JWTConfig struct {
	Secret            string
	Expiration        time.Duration
	RefreshExpiration time.Duration
}

// EmailConfig contiene la configuración de email
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	From         string
}

// RedisConfig contiene la configuración de Redis
type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

// StorageConfig contiene la configuración de almacenamiento
type StorageConfig struct {
	Type            string
	AWSAccessKey    string
	AWSSecretKey    string
	AWSRegion       string
	S3Bucket        string
}

// LoggingConfig contiene la configuración de logging
type LoggingConfig struct {
	Level  string
	Format string
}

// LoadConfig carga la configuración desde variables de entorno
func LoadConfig() (*Config, error) {
	// Intentar cargar .env en desarrollo
	env := os.Getenv("ENV")
	if env != "production" {
		if err := godotenv.Load(); err != nil {
			// Intentar .env.local
			if err := godotenv.Load(".env.local"); err != nil {
				log.Println("⚠️  No .env file found, using environment variables")
			}
		}
	}

	// Crear configuración
	cfg := &Config{
		Server:   loadServerConfig(),
		Database: loadDatabaseConfig(),
		JWT:      loadJWTConfig(),
		Email:    loadEmailConfig(),
		Redis:    loadRedisConfig(),
		Storage:  loadStorageConfig(),
		Logging:  loadLoggingConfig(),
	}

	// Validar configuración
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return cfg, nil
}

// loadServerConfig carga la configuración del servidor
func loadServerConfig() ServerConfig {
	corsOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")

	return ServerConfig{
		Port:        getEnv("PORT", "8000"),
		Environment: getEnv("ENV", "development"),
		CORSOrigins: strings.Split(corsOrigins, ","),
	}
}

// loadDatabaseConfig carga la configuración de bases de datos
func loadDatabaseConfig() DatabaseConfig {
	return DatabaseConfig{
		Control: DatabaseConnection{
			Host:     getEnv("CONTROL_DB_HOST", "localhost"),
			Port:     getEnvAsInt("CONTROL_DB_PORT", 5432),
			Name:     getEnv("CONTROL_DB_NAME", "stegmaier_control"),
			User:     getEnv("CONTROL_DB_USER", "postgres"),
			Password: getEnv("CONTROL_DB_PASSWORD", ""),
			SSLMode:  getEnv("CONTROL_DB_SSLMODE", "disable"),
		},
		Tenant: TenantDatabaseConfig{
			Host:     getEnv("TENANT_DB_HOST", "localhost"),
			Port:     getEnvAsInt("TENANT_DB_PORT", 5432),
			User:     getEnv("TENANT_DB_USER", "postgres"),
			Password: getEnv("TENANT_DB_PASSWORD", ""),
			SSLMode:  getEnv("TENANT_DB_SSLMODE", "disable"),
		},
	}
}

// loadJWTConfig carga la configuración de JWT
func loadJWTConfig() JWTConfig {
	expirationStr := getEnv("JWT_EXPIRATION", "24h")
	expiration, err := time.ParseDuration(expirationStr)
	if err != nil {
		log.Printf("⚠️  Invalid JWT_EXPIRATION '%s', using default 24h", expirationStr)
		expiration = 24 * time.Hour
	}

	refreshExpirationStr := getEnv("JWT_REFRESH_EXPIRATION", "168h")
	refreshExpiration, err := time.ParseDuration(refreshExpirationStr)
	if err != nil {
		log.Printf("⚠️  Invalid JWT_REFRESH_EXPIRATION '%s', using default 168h", refreshExpirationStr)
		refreshExpiration = 168 * time.Hour
	}

	return JWTConfig{
		Secret:            getEnv("JWT_SECRET", ""),
		Expiration:        expiration,
		RefreshExpiration: refreshExpiration,
	}
}

// loadEmailConfig carga la configuración de email
func loadEmailConfig() EmailConfig {
	return EmailConfig{
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		From:         getEnv("SMTP_FROM", "Stegmaier Learning <noreply@stegmaier.com>"),
	}
}

// loadRedisConfig carga la configuración de Redis
func loadRedisConfig() RedisConfig {
	return RedisConfig{
		Host:     getEnv("REDIS_HOST", "localhost"),
		Port:     getEnvAsInt("REDIS_PORT", 6379),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       getEnvAsInt("REDIS_DB", 0),
	}
}

// loadStorageConfig carga la configuración de almacenamiento
func loadStorageConfig() StorageConfig {
	return StorageConfig{
		Type:         getEnv("STORAGE_TYPE", "local"),
		AWSAccessKey: getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AWSRegion:    getEnv("AWS_REGION", "us-east-1"),
		S3Bucket:     getEnv("AWS_S3_BUCKET", "stegmaier-media"),
	}
}

// loadLoggingConfig carga la configuración de logging
func loadLoggingConfig() LoggingConfig {
	return LoggingConfig{
		Level:  getEnv("LOG_LEVEL", "info"),
		Format: getEnv("LOG_FORMAT", "json"),
	}
}

// Validate valida que la configuración sea correcta
func (c *Config) Validate() error {
	// Validar Server
	if c.Server.Port == "" {
		return fmt.Errorf("PORT is required")
	}

	// Validar Database Control
	if c.Database.Control.Host == "" {
		return fmt.Errorf("CONTROL_DB_HOST is required")
	}
	if c.Database.Control.Name == "" {
		return fmt.Errorf("CONTROL_DB_NAME is required")
	}
	if c.Database.Control.User == "" {
		return fmt.Errorf("CONTROL_DB_USER is required")
	}

	// Validar Database Tenant
	if c.Database.Tenant.Host == "" {
		return fmt.Errorf("TENANT_DB_HOST is required")
	}
	if c.Database.Tenant.User == "" {
		return fmt.Errorf("TENANT_DB_USER is required")
	}

	// Validar JWT (crítico para seguridad)
	if c.Server.Environment == "production" {
		if c.JWT.Secret == "" {
			return fmt.Errorf("JWT_SECRET is required in production")
		}
		if len(c.JWT.Secret) < 32 {
			return fmt.Errorf("JWT_SECRET must be at least 32 characters in production")
		}
	}

	// Validar Email (solo en producción)
	if c.Server.Environment == "production" {
		if c.Email.SMTPUser == "" {
			return fmt.Errorf("SMTP_USER is required in production")
		}
		if c.Email.SMTPPassword == "" {
			return fmt.Errorf("SMTP_PASSWORD is required in production")
		}
	}

	return nil
}

// GetDSN retorna el Data Source Name para una conexión de base de datos
func (d *DatabaseConnection) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode,
	)
}

// GetTenantDSN retorna el DSN para una base de datos de tenant
func (t *TenantDatabaseConfig) GetTenantDSN(dbName string) string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		t.Host, t.Port, t.User, t.Password, dbName, t.SSLMode,
	)
}

// IsDevelopment retorna true si el entorno es desarrollo
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsProduction retorna true si el entorno es producción
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}

// Helper functions

// getEnv obtiene una variable de entorno o retorna un valor por defecto
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt obtiene una variable de entorno como entero o retorna un valor por defecto
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Printf("⚠️  Invalid integer for %s: %s, using default %d", key, valueStr, defaultValue)
		return defaultValue
	}

	return value
}

// getEnvAsBool obtiene una variable de entorno como booleano
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		log.Printf("⚠️  Invalid boolean for %s: %s, using default %v", key, valueStr, defaultValue)
		return defaultValue
	}

	return value
}
