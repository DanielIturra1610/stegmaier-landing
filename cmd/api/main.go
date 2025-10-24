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

	// Crear servidor con configuración
	srv := server.New(cfg)

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
		log.Printf("❌ Error during shutdown: %v", err)
	}

	// Esperar que el contexto termine o expire
	<-ctx.Done()
	log.Println("✅ Server stopped gracefully")
}
