# Stegmaier LMS Backend - Makefile
# Go commands for development and deployment

.PHONY: help build run test clean dev docker-build docker-up docker-down migrate-up migrate-down lint fmt vet

# Variables
BINARY_NAME=stegmaier-api
GO_FILES=$(shell find . -name '*.go' -type f -not -path "./vendor/*")
MAIN_PATH=./cmd/api
BUILD_DIR=./bin

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║          Stegmaier LMS Backend - Available Commands           ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "🚀 Development:"
	@echo "  make dev              - Run server with hot reload (air)"
	@echo "  make run              - Run server without hot reload"
	@echo "  make build            - Build binary for current OS"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test             - Run all tests"
	@echo "  make test-unit        - Run unit tests only"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-e2e         - Run E2E tests"
	@echo "  make test-coverage    - Run tests with coverage report"
	@echo "  make test-verbose     - Run tests with verbose output"
	@echo ""
	@echo "🔍 Code Quality:"
	@echo "  make lint             - Run golangci-lint"
	@echo "  make fmt              - Format code with gofmt"
	@echo "  make vet              - Run go vet"
	@echo "  make tidy             - Run go mod tidy"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make migrate-up       - Run all migrations"
	@echo "  make migrate-down     - Rollback one migration"
	@echo "  make migrate-create   - Create new migration (name=migration_name)"
	@echo "  make db-reset         - Reset database (drop + migrate)"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-up        - Start Docker containers"
	@echo "  make docker-down      - Stop Docker containers"
	@echo "  make docker-logs      - View Docker logs"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean            - Remove build artifacts"
	@echo "  make clean-all        - Remove build artifacts and dependencies"
	@echo ""

# Build commands
build:
	@echo "🔨 Building $(BINARY_NAME)..."
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "✅ Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

build-linux:
	@echo "🔨 Building $(BINARY_NAME) for Linux..."
	@GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-linux $(MAIN_PATH)
	@echo "✅ Build complete: $(BUILD_DIR)/$(BINARY_NAME)-linux"

build-windows:
	@echo "🔨 Building $(BINARY_NAME) for Windows..."
	@GOOS=windows GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME).exe $(MAIN_PATH)
	@echo "✅ Build complete: $(BUILD_DIR)/$(BINARY_NAME).exe"

build-mac:
	@echo "🔨 Building $(BINARY_NAME) for macOS..."
	@GOOS=darwin GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-mac $(MAIN_PATH)
	@echo "✅ Build complete: $(BUILD_DIR)/$(BINARY_NAME)-mac"

# Run commands
run: build
	@echo "🚀 Running $(BINARY_NAME)..."
	@$(BUILD_DIR)/$(BINARY_NAME)

dev:
	@if command -v air > /dev/null; then \
		echo "🔥 Starting development server with hot reload..."; \
		air; \
	else \
		echo "⚠️  'air' not found. Install it with: go install github.com/cosmtrek/air@latest"; \
		echo "📝 Running without hot reload..."; \
		go run $(MAIN_PATH); \
	fi

# Test commands
test:
	@echo "🧪 Running all tests..."
	@go test -v ./...

test-unit:
	@echo "🧪 Running unit tests..."
	@go test -v -short ./...

test-integration:
	@echo "🧪 Running integration tests..."
	@go test -v -run Integration ./tests/integration/...

test-e2e:
	@echo "🧪 Running E2E tests..."
	@go test -v ./tests/e2e/...

test-coverage:
	@echo "📊 Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "✅ Coverage report generated: coverage.html"

test-verbose:
	@echo "🧪 Running tests with verbose output..."
	@go test -v -count=1 ./...

# Code quality commands
lint:
	@if command -v golangci-lint > /dev/null; then \
		echo "🔍 Running golangci-lint..."; \
		golangci-lint run ./...; \
	else \
		echo "⚠️  'golangci-lint' not found. Install it from: https://golangci-lint.run/usage/install/"; \
	fi

fmt:
	@echo "🎨 Formatting code..."
	@gofmt -s -w $(GO_FILES)
	@echo "✅ Code formatted"

vet:
	@echo "🔍 Running go vet..."
	@go vet ./...
	@echo "✅ Vet check passed"

tidy:
	@echo "📦 Tidying go modules..."
	@go mod tidy
	@echo "✅ Dependencies tidied"

# Database commands
migrate-up:
	@echo "⬆️  Running migrations..."
	@go run $(MAIN_PATH) migrate up
	@echo "✅ Migrations applied"

migrate-down:
	@echo "⬇️  Rolling back migration..."
	@go run $(MAIN_PATH) migrate down
	@echo "✅ Migration rolled back"

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "❌ Error: Please provide a migration name"; \
		echo "Usage: make migrate-create name=create_users_table"; \
		exit 1; \
	fi
	@echo "📝 Creating migration: $(name)..."
	@migrate create -ext sql -dir migrations/control -seq $(name)
	@echo "✅ Migration created in migrations/control/"

db-reset:
	@echo "🔄 Resetting database..."
	@echo "⚠️  This will drop all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@go run $(MAIN_PATH) migrate down
	@go run $(MAIN_PATH) migrate up
	@echo "✅ Database reset complete"

# Docker commands
docker-build:
	@echo "🐳 Building Docker image..."
	@docker build -t stegmaier-backend:latest .
	@echo "✅ Docker image built"

docker-up:
	@echo "🐳 Starting Docker containers..."
	@docker-compose up -d
	@echo "✅ Containers started"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	@docker-compose down
	@echo "✅ Containers stopped"

docker-logs:
	@echo "📋 Showing Docker logs..."
	@docker-compose logs -f

docker-restart: docker-down docker-up

# Cleanup commands
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	@echo "✅ Clean complete"

clean-all: clean
	@echo "🧹 Removing dependencies..."
	@rm -rf vendor/
	@go clean -modcache
	@echo "✅ Deep clean complete"

# Install development dependencies
install-deps:
	@echo "📦 Installing development dependencies..."
	@go install github.com/cosmtrek/air@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@echo "✅ Development dependencies installed"

# Generate code
generate:
	@echo "⚙️  Running go generate..."
	@go generate ./...
	@echo "✅ Code generation complete"

# Security scan
security:
	@if command -v gosec > /dev/null; then \
		echo "🔒 Running security scan..."; \
		gosec ./...; \
	else \
		echo "⚠️  'gosec' not found. Install it with: go install github.com/securego/gosec/v2/cmd/gosec@latest"; \
	fi

# Dependency check
deps-check:
	@echo "📦 Checking for outdated dependencies..."
	@go list -u -m all

# Full check before commit
pre-commit: fmt vet lint test
	@echo "✅ All pre-commit checks passed!"

# Production build
build-prod:
	@echo "🏭 Building production binary..."
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
		-ldflags="-w -s -X main.Version=$(shell git describe --tags --always --dirty) -X main.BuildTime=$(shell date -u +%Y-%m-%dT%H:%M:%S)" \
		-o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "✅ Production build complete"

.DEFAULT_GOAL := help
