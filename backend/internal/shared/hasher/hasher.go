package hasher

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// PasswordHasher defines the interface for password hashing operations
type PasswordHasher interface {
	Hash(password string) (string, error)
	Compare(hashedPassword, password string) error
}

// BcryptHasher implements PasswordHasher using bcrypt algorithm
type BcryptHasher struct {
	cost int
}

// NewBcryptHasher creates a new BcryptHasher with the specified cost
// Cost should be between 4 and 31. Default (0) will use bcrypt.DefaultCost (10)
func NewBcryptHasher(cost int) *BcryptHasher {
	if cost == 0 {
		cost = bcrypt.DefaultCost
	}

	// Validate cost range
	if cost < bcrypt.MinCost || cost > bcrypt.MaxCost {
		cost = bcrypt.DefaultCost
	}

	return &BcryptHasher{
		cost: cost,
	}
}

// Hash generates a bcrypt hash from a plain text password
func (h *BcryptHasher) Hash(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}

	// Bcrypt has a maximum password length of 72 bytes
	if len(password) > 72 {
		return "", fmt.Errorf("password length exceeds 72 bytes (bcrypt limit)")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), h.cost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashedBytes), nil
}

// Compare compares a bcrypt hashed password with a plain text password
// Returns nil if they match, error otherwise
func (h *BcryptHasher) Compare(hashedPassword, password string) error {
	if hashedPassword == "" {
		return fmt.Errorf("hashed password cannot be empty")
	}

	if password == "" {
		return fmt.Errorf("password cannot be empty")
	}

	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return fmt.Errorf("password does not match")
		}
		return fmt.Errorf("failed to compare password: %w", err)
	}

	return nil
}

// GetCost returns the cost factor used by this hasher
func (h *BcryptHasher) GetCost() int {
	return h.cost
}

// NeedsRehash checks if a hashed password needs to be rehashed
// Returns true if the hash was created with a different cost factor
func (h *BcryptHasher) NeedsRehash(hashedPassword string) bool {
	cost, err := bcrypt.Cost([]byte(hashedPassword))
	if err != nil {
		return true
	}

	return cost != h.cost
}
