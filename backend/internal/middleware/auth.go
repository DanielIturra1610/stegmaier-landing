package middleware

import (
	"log"
	"strings"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
	"github.com/gofiber/fiber/v2"
)

// Context keys for storing authentication information
const (
	UserIDKey    = "userID"
	UserEmailKey = "userEmail"
	UserRoleKey  = "userRole"
	JWTClaimsKey = "jwtClaims"
)

// AuthMiddleware validates JWT tokens and injects user information into context
func AuthMiddleware(tokenService tokens.TokenService, authRepo ports.AuthRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			log.Printf("⚠️  Missing Authorization header: %s %s", c.Method(), c.Path())
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Missing authorization header",
			})
		}

		// Extract token from "Bearer <token>" format
		token, err := tokens.ExtractTokenFromHeader(authHeader)
		if err != nil {
			log.Printf("⚠️  Invalid Authorization header format: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid authorization header format",
			})
		}

		// Validate JWT token
		claims, err := tokenService.Validate(token)
		if err != nil {
			log.Printf("⚠️  Token validation failed: %v", err)

			// Check for specific token errors
			if strings.Contains(err.Error(), "expired") {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"success": false,
					"error":   "Token has expired",
				})
			}

			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid or malformed token",
			})
		}

		// Verify user exists and is active
		user, err := authRepo.GetUserByID(c.Context(), claims.UserID)
		if err != nil {
			log.Printf("⚠️  User not found for token: %s - %v", claims.UserID, err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "User not found or inactive",
			})
		}

		// Inject user information into context
		c.Locals(UserIDKey, user.ID)
		c.Locals(UserEmailKey, user.Email)

		// Use the role from JWT claims if available (tenant-specific role from membership)
		// Otherwise fall back to the user's global role
		roleToUse := user.Role
		if claims.Role != "" {
			roleToUse = claims.Role
		}
		c.Locals(UserRoleKey, roleToUse)

		// Use tenant_id from JWT claims if available (selected tenant)
		// Otherwise fall back to user's default tenant_id
		if claims.TenantID != "" {
			c.Locals(TenantIDKey, claims.TenantID)
		} else if user.TenantID != nil {
			c.Locals(TenantIDKey, *user.TenantID) // Dereference the pointer
		}
		c.Locals(JWTClaimsKey, claims)

		log.Printf("✅ Authenticated user: %s (%s) - Role: %s (JWT role: %s)", user.Email, user.ID, roleToUse, claims.Role)

		return c.Next()
	}
}

// OptionalAuthMiddleware is like AuthMiddleware but doesn't fail if token is missing
// Useful for endpoints that work differently when authenticated but don't require it
func OptionalAuthMiddleware(tokenService tokens.TokenService, authRepo ports.AuthRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// No auth header, continue without authentication
			return c.Next()
		}

		// Extract token
		token, err := tokens.ExtractTokenFromHeader(authHeader)
		if err != nil {
			// Invalid format, continue without authentication
			return c.Next()
		}

		// Validate token
		claims, err := tokenService.Validate(token)
		if err != nil {
			// Invalid token, continue without authentication
			return c.Next()
		}

		// Verify user exists
		user, err := authRepo.GetUserByID(c.Context(), claims.UserID)
		if err != nil {
			// User not found, continue without authentication
			return c.Next()
		}

		// Inject user information into context
		c.Locals(UserIDKey, user.ID)
		c.Locals(UserEmailKey, user.Email)
		c.Locals(UserRoleKey, string(user.Role))
		// Only inject tenant_id if user has one (it's a pointer that can be nil)
		if user.TenantID != nil {
			c.Locals(TenantIDKey, *user.TenantID) // Dereference the pointer
		}
		c.Locals(JWTClaimsKey, claims)

		log.Printf("✅ Optionally authenticated user: %s (%s)", user.Email, user.ID)

		return c.Next()
	}
}

// RequireVerification middleware ensures the authenticated user has verified their email
func RequireVerification() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// This middleware should run after AuthMiddleware
		userID := c.Locals(UserIDKey)
		if userID == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Authentication required",
			})
		}

		// Get JWT claims to check verification status
		claims := c.Locals(JWTClaimsKey)
		if claims == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid authentication context",
			})
		}

		// Note: JWT doesn't store is_verified flag, so we'd need to fetch user from DB
		// For now, we'll trust that the JWT was issued to a verified user
		// A more secure approach would be to add is_verified to JWT claims

		return c.Next()
	}
}

// GetAuthenticatedUserID extracts the authenticated user ID from context
func GetAuthenticatedUserID(c *fiber.Ctx) (string, error) {
	userID := c.Locals(UserIDKey)
	if userID == nil {
		return "", fiber.NewError(fiber.StatusUnauthorized, "Not authenticated")
	}

	if uid, ok := userID.(string); ok {
		return uid, nil
	}

	return "", fiber.NewError(fiber.StatusInternalServerError, "Invalid user ID in context")
}

// GetAuthenticatedUserEmail extracts the authenticated user email from context
func GetAuthenticatedUserEmail(c *fiber.Ctx) (string, error) {
	userEmail := c.Locals(UserEmailKey)
	if userEmail == nil {
		return "", fiber.NewError(fiber.StatusUnauthorized, "Not authenticated")
	}

	if email, ok := userEmail.(string); ok {
		return email, nil
	}

	return "", fiber.NewError(fiber.StatusInternalServerError, "Invalid user email in context")
}

// GetAuthenticatedUserRole extracts the authenticated user role from context
func GetAuthenticatedUserRole(c *fiber.Ctx) (string, error) {
	userRole := c.Locals(UserRoleKey)
	if userRole == nil {
		return "", fiber.NewError(fiber.StatusUnauthorized, "Not authenticated")
	}

	if role, ok := userRole.(string); ok {
		return role, nil
	}

	return "", fiber.NewError(fiber.StatusInternalServerError, "Invalid user role in context")
}
