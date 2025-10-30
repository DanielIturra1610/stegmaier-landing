package hasher

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestNewBcryptHasher(t *testing.T) {
	tests := []struct {
		name         string
		cost         int
		expectedCost int
	}{
		{
			name:         "Default cost when 0",
			cost:         0,
			expectedCost: bcrypt.DefaultCost,
		},
		{
			name:         "Custom cost within range",
			cost:         12,
			expectedCost: 12,
		},
		{
			name:         "Cost too low, fallback to default",
			cost:         2,
			expectedCost: bcrypt.DefaultCost,
		},
		{
			name:         "Cost too high, fallback to default",
			cost:         32,
			expectedCost: bcrypt.DefaultCost,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasher := NewBcryptHasher(tt.cost)

			if hasher.GetCost() != tt.expectedCost {
				t.Errorf("expected cost %d, got %d", tt.expectedCost, hasher.GetCost())
			}
		})
	}
}

func TestHash(t *testing.T) {
	hasher := NewBcryptHasher(bcrypt.MinCost) // Use min cost for faster tests

	tests := []struct {
		name      string
		password  string
		wantError bool
	}{
		{
			name:      "Valid password",
			password:  "SecurePassword123!",
			wantError: false,
		},
		{
			name:      "Short password",
			password:  "abc",
			wantError: false,
		},
		{
			name:      "Long password (>72 bytes, bcrypt limit)",
			password:  "ThisIsAVeryLongPasswordThatExceedsTheBcryptLimitOf72BytesAndShouldFailGracefully1234567890!@#$%^&*()",
			wantError: true,
		},
		{
			name:      "Empty password",
			password:  "",
			wantError: true,
		},
		{
			name:      "Password with special characters",
			password:  "P@ssw0rd!#$%",
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := hasher.Hash(tt.password)

			if tt.wantError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if hash == "" {
				t.Errorf("hash should not be empty")
			}

			if hash == tt.password {
				t.Errorf("hash should not equal plain password")
			}
		})
	}
}

func TestCompare(t *testing.T) {
	hasher := NewBcryptHasher(bcrypt.MinCost)
	password := "SecurePassword123!"
	hash, err := hasher.Hash(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	tests := []struct {
		name           string
		hashedPassword string
		password       string
		wantError      bool
	}{
		{
			name:           "Matching password",
			hashedPassword: hash,
			password:       password,
			wantError:      false,
		},
		{
			name:           "Non-matching password",
			hashedPassword: hash,
			password:       "WrongPassword",
			wantError:      true,
		},
		{
			name:           "Empty hashed password",
			hashedPassword: "",
			password:       password,
			wantError:      true,
		},
		{
			name:           "Empty plain password",
			hashedPassword: hash,
			password:       "",
			wantError:      true,
		},
		{
			name:           "Invalid hash format",
			hashedPassword: "not-a-valid-bcrypt-hash",
			password:       password,
			wantError:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := hasher.Compare(tt.hashedPassword, tt.password)

			if tt.wantError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestHashUniqueness(t *testing.T) {
	hasher := NewBcryptHasher(bcrypt.MinCost)
	password := "TestPassword123"

	hash1, err := hasher.Hash(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	hash2, err := hasher.Hash(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	// Hashes should be different due to random salt
	if hash1 == hash2 {
		t.Errorf("hashes should be unique, but got identical hashes")
	}

	// But both should match the original password
	if err := hasher.Compare(hash1, password); err != nil {
		t.Errorf("hash1 should match password: %v", err)
	}

	if err := hasher.Compare(hash2, password); err != nil {
		t.Errorf("hash2 should match password: %v", err)
	}
}

func TestNeedsRehash(t *testing.T) {
	// Hash with cost 4
	hasher4 := NewBcryptHasher(4)
	hash4, err := hasher4.Hash("password123")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	// Hash with cost 10
	hasher10 := NewBcryptHasher(10)

	tests := []struct {
		name           string
		hasher         *BcryptHasher
		hashedPassword string
		wantRehash     bool
	}{
		{
			name:           "Same cost, no rehash needed",
			hasher:         hasher4,
			hashedPassword: hash4,
			wantRehash:     false,
		},
		{
			name:           "Different cost, rehash needed",
			hasher:         hasher10,
			hashedPassword: hash4,
			wantRehash:     true,
		},
		{
			name:           "Invalid hash, rehash needed",
			hasher:         hasher10,
			hashedPassword: "invalid-hash",
			wantRehash:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			needsRehash := tt.hasher.NeedsRehash(tt.hashedPassword)

			if needsRehash != tt.wantRehash {
				t.Errorf("expected NeedsRehash=%v, got %v", tt.wantRehash, needsRehash)
			}
		})
	}
}

func BenchmarkHash(b *testing.B) {
	hasher := NewBcryptHasher(bcrypt.DefaultCost)
	password := "BenchmarkPassword123!"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = hasher.Hash(password)
	}
}

func BenchmarkCompare(b *testing.B) {
	hasher := NewBcryptHasher(bcrypt.DefaultCost)
	password := "BenchmarkPassword123!"
	hash, _ := hasher.Hash(password)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = hasher.Compare(hash, password)
	}
}
