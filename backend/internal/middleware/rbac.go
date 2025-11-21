package middleware

import (
	"fmt"
	"log"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/gofiber/fiber/v2"
)

// RBACMiddleware checks if the authenticated user has one of the allowed roles
// This middleware must be used AFTER AuthMiddleware since it relies on UserRoleKey being set
//
// Usage:
//   admin.Use(middleware.RBACMiddleware("admin", "superadmin"))
//   superAdminOnly.Use(middleware.RBACMiddleware("superadmin"))
func RBACMiddleware(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get user role from context (set by AuthMiddleware)
		userRole, err := GetAuthenticatedUserRole(c)
		if err != nil {
			log.Printf("⚠️  RBAC: No authenticated user role found: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Authentication required for this resource",
			})
		}

		// Check if user role is in allowed roles
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				log.Printf("✅ RBAC: User role '%s' authorized for %s %s", userRole, c.Method(), c.Path())
				return c.Next()
			}
		}

		// User doesn't have required role
		log.Printf("🚫 RBAC: User role '%s' denied access to %s %s (requires one of: %v)",
			userRole, c.Method(), c.Path(), allowedRoles)

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   fmt.Sprintf("Insufficient permissions. Required role: %v", allowedRoles),
		})
	}
}

// RBACHierarchyMiddleware checks if the user has the minimum required role in the role hierarchy
// Superadmin > Admin > Instructor > Student
//
// Usage:
//   admin.Use(middleware.RBACHierarchyMiddleware("admin")) // allows admin and superadmin
//   instructor.Use(middleware.RBACHierarchyMiddleware("instructor")) // allows instructor, admin, and superadmin
func RBACHierarchyMiddleware(minRole string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get user role from context
		userRole, err := GetAuthenticatedUserRole(c)
		if err != nil {
			log.Printf("⚠️  RBAC Hierarchy: No authenticated user role found: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Authentication required for this resource",
			})
		}

		// Convert to UserRole types
		userRoleEnum := domain.UserRole(userRole)
		minRoleEnum := domain.UserRole(minRole)

		// Check role hierarchy
		userLevel := domain.GetRoleHierarchy(userRoleEnum)
		minLevel := domain.GetRoleHierarchy(minRoleEnum)

		if userLevel >= minLevel {
			log.Printf("✅ RBAC Hierarchy: User role '%s' (level %d) authorized for %s %s (requires level %d+)",
				userRole, userLevel, c.Method(), c.Path(), minLevel)
			return c.Next()
		}

		// User doesn't meet minimum role requirement
		log.Printf("🚫 RBAC Hierarchy: User role '%s' (level %d) denied access to %s %s (requires level %d+)",
			userRole, userLevel, c.Method(), c.Path(), minLevel)

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   fmt.Sprintf("Insufficient permissions. Minimum required role: %s", minRole),
		})
	}
}

// RequireRole is a convenience function for requiring a single specific role
// Equivalent to RBACMiddleware with a single role
func RequireRole(role string) fiber.Handler {
	return RBACMiddleware(role)
}

// RequireAdmin is a convenience function for admin-only routes
func RequireAdmin() fiber.Handler {
	return RBACHierarchyMiddleware(string(domain.RoleAdmin))
}

// RequireSuperAdmin is a convenience function for superadmin-only routes
func RequireSuperAdmin() fiber.Handler {
	return RequireRole(string(domain.RoleSuperAdmin))
}

// RequireInstructor is a convenience function for instructor+ routes
func RequireInstructor() fiber.Handler {
	return RBACHierarchyMiddleware(string(domain.RoleInstructor))
}

// HasAnyRole checks if user has any of the specified roles (used in handlers, not middleware)
func HasAnyRole(c *fiber.Ctx, roles ...string) bool {
	userRole, err := GetAuthenticatedUserRole(c)
	if err != nil {
		return false
	}

	for _, role := range roles {
		if userRole == role {
			return true
		}
	}

	return false
}

// HasMinimumRole checks if user meets minimum role requirement (used in handlers)
func HasMinimumRole(c *fiber.Ctx, minRole string) bool {
	userRole, err := GetAuthenticatedUserRole(c)
	if err != nil {
		return false
	}

	userRoleEnum := domain.UserRole(userRole)
	minRoleEnum := domain.UserRole(minRole)

	return domain.GetRoleHierarchy(userRoleEnum) >= domain.GetRoleHierarchy(minRoleEnum)
}
