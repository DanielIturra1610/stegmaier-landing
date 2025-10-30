package mocks

import "fmt"

// MockPasswordHasher implements hasher.PasswordHasher for testing
type MockPasswordHasher struct {
	HashFunc    func(password string) (string, error)
	CompareFunc func(hashedPassword, password string) error
	HashCalls   int
	CompareCalls int
}

// NewMockPasswordHasher creates a new mock password hasher
func NewMockPasswordHasher() *MockPasswordHasher {
	return &MockPasswordHasher{
		HashFunc:    defaultHash,
		CompareFunc: defaultCompare,
	}
}

// Hash mocks password hashing
func (m *MockPasswordHasher) Hash(password string) (string, error) {
	m.HashCalls++
	return m.HashFunc(password)
}

// Compare mocks password comparison
func (m *MockPasswordHasher) Compare(hashedPassword, password string) error {
	m.CompareCalls++
	return m.CompareFunc(hashedPassword, password)
}

// Default implementations
func defaultHash(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}

	// Return a mock hash (not a real bcrypt hash, just for testing)
	return "mock$hashed$" + password, nil
}

func defaultCompare(hashedPassword, password string) error {
	if hashedPassword == "" {
		return fmt.Errorf("hashed password cannot be empty")
	}

	if password == "" {
		return fmt.Errorf("password cannot be empty")
	}

	// Simple mock comparison: check if hash contains the password
	expectedHash := "mock$hashed$" + password
	if hashedPassword != expectedHash {
		return fmt.Errorf("password does not match")
	}

	return nil
}

// WithHashFunc sets a custom hash function
func (m *MockPasswordHasher) WithHashFunc(fn func(string) (string, error)) *MockPasswordHasher {
	m.HashFunc = fn
	return m
}

// WithCompareFunc sets a custom compare function
func (m *MockPasswordHasher) WithCompareFunc(fn func(string, string) error) *MockPasswordHasher {
	m.CompareFunc = fn
	return m
}

// WithAlwaysMatch makes comparison always succeed
func (m *MockPasswordHasher) WithAlwaysMatch() *MockPasswordHasher {
	m.CompareFunc = func(hashedPassword, password string) error {
		return nil
	}
	return m
}

// WithNeverMatch makes comparison always fail
func (m *MockPasswordHasher) WithNeverMatch() *MockPasswordHasher {
	m.CompareFunc = func(hashedPassword, password string) error {
		return fmt.Errorf("password does not match")
	}
	return m
}

// WithHashError makes hashing always return an error
func (m *MockPasswordHasher) WithHashError(err error) *MockPasswordHasher {
	m.HashFunc = func(password string) (string, error) {
		return "", err
	}
	return m
}

// Reset resets the call counters
func (m *MockPasswordHasher) Reset() {
	m.HashCalls = 0
	m.CompareCalls = 0
}

// GetCalls returns the number of calls for each method
func (m *MockPasswordHasher) GetCalls() (hash, compare int) {
	return m.HashCalls, m.CompareCalls
}
