package tokens

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenService defines the interface for JWT token operations
type TokenService interface {
	Generate(claims *Claims) (string, error)
	Validate(tokenString string) (*Claims, error)
	Refresh(tokenString string) (string, error)
}

// Claims represents the JWT claims with custom fields
type Claims struct {
	UserID     string   `json:"user_id"`
	TenantID   string   `json:"tenant_id"`
	Email      string   `json:"email"`
	Role       string   `json:"role"`        // Primary role for backwards compatibility
	ActiveRole string   `json:"active_role"` // Currently active role (for multi-role users)
	Roles      []string `json:"roles"`       // All assigned roles
	jwt.RegisteredClaims
}

// JWTService implements TokenService using JWT
type JWTService struct {
	secretKey  string
	expiration time.Duration
	issuer     string
}

// NewJWTService creates a new JWTService
func NewJWTService(secretKey string, expiration time.Duration, issuer string) *JWTService {
	if secretKey == "" {
		panic("JWT secret key cannot be empty")
	}

	if expiration == 0 {
		expiration = 24 * time.Hour // Default 24 hours
	}

	if issuer == "" {
		issuer = "stegmaier-lms"
	}

	return &JWTService{
		secretKey:  secretKey,
		expiration: expiration,
		issuer:     issuer,
	}
}

// Generate creates a new JWT token with the provided claims
func (s *JWTService) Generate(claims *Claims) (string, error) {
	if claims == nil {
		return "", fmt.Errorf("claims cannot be nil")
	}

	if claims.UserID == "" {
		return "", fmt.Errorf("user_id claim is required")
	}

	// Note: TenantID is optional - users can register without a tenant
	// and select one later via tenant selection flow

	// Set registered claims
	now := time.Now()
	claims.IssuedAt = jwt.NewNumericDate(now)
	claims.ExpiresAt = jwt.NewNumericDate(now.Add(s.expiration))
	claims.Issuer = s.issuer
	claims.ID = generateJTI()

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString([]byte(s.secretKey))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// Validate verifies and parses a JWT token
func (s *JWTService) Validate(tokenString string) (*Claims, error) {
	if tokenString == "" {
		return nil, fmt.Errorf("token string cannot be empty")
	}

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.secretKey), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Validate issuer
	if claims.Issuer != s.issuer {
		return nil, fmt.Errorf("invalid token issuer")
	}

	return claims, nil
}

// Refresh generates a new token from an existing valid token
func (s *JWTService) Refresh(tokenString string) (string, error) {
	// Validate existing token
	claims, err := s.Validate(tokenString)
	if err != nil {
		return "", fmt.Errorf("cannot refresh invalid token: %w", err)
	}

	// Generate new token with same user info but new expiration
	newClaims := &Claims{
		UserID:   claims.UserID,
		TenantID: claims.TenantID,
		Email:    claims.Email,
		Role:     claims.Role,
	}

	return s.Generate(newClaims)
}

// GetExpiration returns the expiration duration used by this service
func (s *JWTService) GetExpiration() time.Duration {
	return s.expiration
}

// generateJTI generates a unique JWT ID
func generateJTI() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// ExtractTokenFromHeader extracts the token from an Authorization header
// Expects format: "Bearer <token>"
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is empty")
	}

	const bearerPrefix = "Bearer "
	if len(authHeader) < len(bearerPrefix) {
		return "", fmt.Errorf("invalid authorization header format")
	}

	if authHeader[:len(bearerPrefix)] != bearerPrefix {
		return "", fmt.Errorf("authorization header must start with 'Bearer '")
	}

	token := authHeader[len(bearerPrefix):]
	if token == "" {
		return "", fmt.Errorf("token is empty")
	}

	return token, nil
}
