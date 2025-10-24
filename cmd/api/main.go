package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/server"
	"github.com/joho/godotenv"
)

func main() {
	// Cargar variables de entorno
	if err := loadEnv(); err != nil {
		log.Printf("⚠️  Warning: Error loading .env file: %v", err)
		log.Println("📝 Continuing with environment variables...")
	}

	// Obtener puerto desde ENV o usar default
	port := getEnvOrDefault("PORT", "8000")
	env := getEnvOrDefault("ENV", "development")

	log.Println("🚀 Starting Stegmaier Learning Platform API")
	log.Printf("📍 Environment: %s", env)
	log.Printf("🔧 Port: %s", port)

	// Crear servidor
	srv := server.New()

	// Channel para señales de sistema
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	// Iniciar servidor en goroutine
	go func() {
		if err := srv.Start(port); err != nil {
			log.Fatalf("❌ Error starting server: %v", err)
		}
	}()

	// Esperar señal de terminación
	<-quit
	log.Println("🛑 Shutdown signal received")

	// Crear contexto con timeout para shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown gracefully
	if err := srv.Shutdown(); err != nil {
		log.Printf("❌ Error during shutdown: %v", err)
	}

	// Esperar que el contexto termine o expire
	<-ctx.Done()
	log.Println("✅ Server stopped gracefully")
}

// loadEnv carga las variables de entorno desde .env
func loadEnv() error {
	// En producción, las variables ya estarán en el entorno
	env := os.Getenv("ENV")
	if env == "production" {
		log.Println("📍 Running in production mode - skipping .env file")
		return nil
	}

	// Intentar cargar .env
	if err := godotenv.Load(); err != nil {
		// Intentar cargar .env.local
		if err := godotenv.Load(".env.local"); err != nil {
			return err
		}
	}

	log.Println("✅ Environment variables loaded from .env")
	return nil
}

// getEnvOrDefault obtiene una variable de entorno o retorna un valor por defecto
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
