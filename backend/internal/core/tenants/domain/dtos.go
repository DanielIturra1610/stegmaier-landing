package domain

// CreateTenantDTO represents the data needed to create a new tenant
type CreateTenantDTO struct {
	Name        string  `json:"name" validate:"required,min=3,max=100"`
	Slug        string  `json:"slug" validate:"required,min=3,max=50,alphanum"`
	Description string  `json:"description" validate:"max=500"`
	Email       string  `json:"email" validate:"required,email"`
	Phone       string  `json:"phone" validate:"required,min=9,max=15"`
	Address     *string `json:"address,omitempty"`
	Website     *string `json:"website,omitempty" validate:"omitempty,url"`
}

// CreateTenantResponse represents the response after creating a tenant
type CreateTenantResponse struct {
	TenantID     string `json:"tenant_id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	DatabaseName string `json:"database_name"`
	Role         string `json:"role"`
	Message      string `json:"message"`
}

// InviteUserDTO represents the data needed to invite a user to a tenant
type InviteUserDTO struct {
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required,oneof=admin instructor student"`
}

// InviteUserResponse represents the response after inviting a user
type InviteUserResponse struct {
	InvitationID string `json:"invitation_id"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	Status       string `json:"status"`
	Message      string `json:"message"`
}

// CreateUserInTenantDTO represents data to create a user directly in a tenant (by admin)
type CreateUserInTenantDTO struct {
	FullName string `json:"full_name" validate:"required,min=4,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=admin instructor student"`
}

// CreateUserInTenantResponse represents the response after creating a user in tenant
type CreateUserInTenantResponse struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
	TenantID string `json:"tenant_id"`
	Message  string `json:"message"`
}

// AcceptInvitationDTO represents data to accept an invitation
type AcceptInvitationDTO struct {
	InvitationID string `json:"invitation_id" validate:"required,uuid"`
}

// RejectInvitationDTO represents data to reject an invitation
type RejectInvitationDTO struct {
	InvitationID string `json:"invitation_id" validate:"required,uuid"`
}

// SelectTenantDTO represents data to select a tenant
type SelectTenantDTO struct {
	TenantID string `json:"tenant_id" validate:"required,uuid"`
}

// SelectTenantResponse represents response after selecting a tenant
type SelectTenantResponse struct {
	TenantID  string `json:"tenant_id"`
	TenantName string `json:"tenant_name"`
	Role      string `json:"role"`
	Token     string `json:"token"` // New JWT with tenant_id populated
	Message   string `json:"message"`
}
