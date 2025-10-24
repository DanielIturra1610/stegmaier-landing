package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/server"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
)

func main() {
	// Cargar configuración
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("❌ Failed to load configuration: %v", err)
	}

	log.Println("🚀 Starting Stegmaier Learning Platform API")
	log.Printf("📍 Environment: %s", cfg.Server.Environment)
	log.Printf("🔧 Port: %s", cfg.Server.Port)

	// Inicializar Database Manager
	log.Println("📦 Initializing database connections...")
	if err := database.InitializeManager(cfg); err != nil {
		log.Fatalf("❌ Failed to initialize database manager: %v", err)
	}
	dbManager := database.GetInstance()
	log.Println("✅ Database manager initialized")

	// Crear servidor con configuración y database manager
	srv := server.New(cfg, dbManager)

	// Channel para señales de sistema
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	// Iniciar servidor en goroutine
	go func() {
		if err := srv.Start(); err != nil {
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
		log.Printf("❌ Error during server shutdown: %v", err)
	}

	// Close database connections
	log.Println("🔒 Closing database connections...")
	if err := dbManager.CloseAll(); err != nil {
		log.Printf("❌ Error closing database connections: %v", err)
	}

	// Esperar que el contexto termine o expire
	<-ctx.Done()
	log.Println("✅ Server stopped gracefully")
}
