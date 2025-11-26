package domain

import "time"

// TenantMembership represents a user's membership in a tenant
type TenantMembership struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	TenantID  string     `json:"tenant_id"`
	Role      string     `json:"role"` // admin, instructor, student
	Status    string     `json:"status"` // pending, active, inactive, rejected
	InvitedBy *string    `json:"invited_by,omitempty"`
	InvitedAt *time.Time `json:"invited_at,omitempty"`
	JoinedAt  *time.Time `json:"joined_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// TenantWithMembership combines tenant info with user's membership details
type TenantWithMembership struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	DatabaseName string     `json:"database_name"`
	OwnerID      *string    `json:"owner_id,omitempty"`
	IsOwner      bool       `json:"is_owner"`
	Role         string     `json:"role"`
	Status       string     `json:"status"`
	JoinedAt     *time.Time `json:"joined_at,omitempty"`
}

// Invitation represents a pending invitation to join a tenant
type Invitation struct {
	ID              string    `json:"id"`
	TenantID        string    `json:"tenant_id"`
	TenantName      string    `json:"tenant_name"`
	UserID          string    `json:"user_id"`
	UserEmail       string    `json:"user_email"`
	Role            string    `json:"role"`
	InvitedBy       string    `json:"invited_by"`
	InvitedByName   string    `json:"invited_by_name"`
	InvitedByEmail  string    `json:"invited_by_email"`
	InvitedAt       time.Time `json:"invited_at"`
	Status          string    `json:"status"`
}

// MemberWithUser combines tenant membership with user details
// Used for displaying users in the admin panel with their tenant-specific role
type MemberWithUser struct {
	// Membership fields
	MembershipID string     `json:"membership_id"`
	Role         string     `json:"role"`   // Role in THIS tenant (admin, instructor, student)
	Status       string     `json:"status"` // Membership status (active, inactive, pending)
	JoinedAt     *time.Time `json:"joined_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`

	// User fields
	UserID    string  `json:"id"`        // Using "id" for frontend compatibility
	Email     string  `json:"email"`
	FullName  string  `json:"full_name"`
	IsActive  bool    `json:"is_active"` // User's global active status
	Verified  bool    `json:"verified"`
	UserCreatedAt time.Time `json:"user_created_at"`
}
