package middleware

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
)

// MembershipMiddleware validates that the authenticated user has an active membership in the selected tenant
// This middleware should run AFTER AuthMiddleware (to have user_id) and AFTER TenantMiddleware (to have tenant_id)
func MembershipMiddleware(controlDB *sqlx.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get user_id from context (set by AuthMiddleware)
		userID := c.Locals(UserIDKey)
		if userID == nil {
			log.Printf("⚠️  MembershipMiddleware: userID not found in context")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Unauthorized - user not authenticated",
			})
		}

		// Get tenant_id from context (set by TenantMiddleware)
		tenantID := c.Locals(TenantIDKey)
		if tenantID == nil {
			log.Printf("⚠️  MembershipMiddleware: tenant_id not found in context")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": "Bad Request - tenant not specified",
			})
		}

		userIDStr, ok := userID.(string)
		if !ok {
			log.Printf("⚠️  MembershipMiddleware: user_id is not a string")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Internal error - invalid user_id type",
			})
		}

		tenantIDStr, ok := tenantID.(string)
		if !ok {
			log.Printf("⚠️  MembershipMiddleware: tenant_id is not a string")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Internal error - invalid tenant_id type",
			})
		}

		// Check if user has active membership in this tenant
		membership, err := checkMembership(c.Context(), controlDB, userIDStr, tenantIDStr)
		if err != nil {
			log.Printf("❌ MembershipMiddleware: Error checking membership for user %s in tenant %s: %v", userIDStr, tenantIDStr, err)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "Access denied - you don't have access to this organization",
			})
		}

		if membership.Status != "active" {
			log.Printf("⚠️  MembershipMiddleware: User %s has non-active membership in tenant %s (status: %s)", userIDStr, tenantIDStr, membership.Status)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": fmt.Sprintf("Access denied - your membership is %s", membership.Status),
			})
		}

		// Inject membership info into context for use by handlers
		c.Locals("membership_role", membership.Role)
		c.Locals("membership_status", membership.Status)

		log.Printf("✅ MembershipMiddleware: User %s has active %s membership in tenant %s", userIDStr, membership.Role, tenantIDStr)

		return c.Next()
	}
}

// TenantMembership represents the membership information
type TenantMembership struct {
	ID       string `db:"id"`
	UserID   string `db:"user_id"`
	TenantID string `db:"tenant_id"`
	Role     string `db:"role"`   // admin, instructor, student
	Status   string `db:"status"` // pending, active, inactive, rejected
}

// checkMembership queries the database to check if a user has membership in a tenant
func checkMembership(ctx context.Context, controlDB *sqlx.DB, userID, tenantID string) (*TenantMembership, error) {
	var membership TenantMembership

	query := `
		SELECT id, user_id, tenant_id, role, status
		FROM tenant_memberships
		WHERE user_id = $1 AND tenant_id = $2
		LIMIT 1
	`

	err := controlDB.GetContext(ctx, &membership, query, userID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no membership found")
		}
		return nil, err
	}

	return &membership, nil
}

// OptionalMembershipMiddleware is like MembershipMiddleware but doesn't fail if membership is missing
// Useful for endpoints that should work differently based on membership status
func OptionalMembershipMiddleware(controlDB *sqlx.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals(UserIDKey)
		tenantID := c.Locals(TenantIDKey)

		// If either is missing, continue without membership info
		if userID == nil || tenantID == nil {
			return c.Next()
		}

		userIDStr, ok1 := userID.(string)
		tenantIDStr, ok2 := tenantID.(string)

		if !ok1 || !ok2 {
			return c.Next()
		}

		// Try to get membership, but continue even if it fails
		membership, err := checkMembership(c.Context(), controlDB, userIDStr, tenantIDStr)
		if err == nil {
			c.Locals("membership_role", membership.Role)
			c.Locals("membership_status", membership.Status)
			log.Printf("✅ OptionalMembershipMiddleware: User %s has %s membership (status: %s) in tenant %s", userIDStr, membership.Role, membership.Status, tenantIDStr)
		} else {
			log.Printf("⚠️  OptionalMembershipMiddleware: No membership found for user %s in tenant %s", userIDStr, tenantIDStr)
		}

		return c.Next()
	}
}
