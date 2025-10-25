package utils

import (
	"errors"
	"testing"
)

func TestNewAppError(t *testing.T) {
	innerErr := errors.New("database connection failed")
	appErr := NewAppError(ErrCodeDatabaseError, "Failed to connect", innerErr)

	if appErr.Code != ErrCodeDatabaseError {
		t.Errorf("expected code %s, got %s", ErrCodeDatabaseError, appErr.Code)
	}

	if appErr.Message != "Failed to connect" {
		t.Errorf("expected message 'Failed to connect', got '%s'", appErr.Message)
	}

	if appErr.Err != innerErr {
		t.Errorf("expected inner error to be preserved")
	}
}

func TestAppError_Error(t *testing.T) {
	tests := []struct {
		name     string
		appErr   *AppError
		expected string
	}{
		{
			name: "Error with inner error",
			appErr: &AppError{
				Code:    "TEST_CODE",
				Message: "Test message",
				Err:     errors.New("inner error"),
			},
			expected: "TEST_CODE: Test message (inner error)",
		},
		{
			name: "Error without inner error",
			appErr: &AppError{
				Code:    "TEST_CODE",
				Message: "Test message",
				Err:     nil,
			},
			expected: "TEST_CODE: Test message",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.appErr.Error()
			if result != tt.expected {
				t.Errorf("expected '%s', got '%s'", tt.expected, result)
			}
		})
	}
}

func TestAppError_Unwrap(t *testing.T) {
	innerErr := errors.New("inner error")
	appErr := &AppError{
		Code:    "TEST",
		Message: "Test",
		Err:     innerErr,
	}

	unwrapped := appErr.Unwrap()
	if unwrapped != innerErr {
		t.Errorf("expected unwrapped error to be inner error")
	}
}

func TestIsAppError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "AppError",
			err:      &AppError{Code: "TEST", Message: "Test"},
			expected: true,
		},
		{
			name:     "Standard error",
			err:      errors.New("standard error"),
			expected: false,
		},
		{
			name:     "Nil error",
			err:      nil,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsAppError(tt.err)
			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestGetAppError(t *testing.T) {
	appErr := &AppError{Code: "TEST", Message: "Test"}

	t.Run("Valid AppError", func(t *testing.T) {
		result, ok := GetAppError(appErr)
		if !ok {
			t.Errorf("expected ok to be true")
		}
		if result != appErr {
			t.Errorf("expected same AppError instance")
		}
	})

	t.Run("Standard error", func(t *testing.T) {
		_, ok := GetAppError(errors.New("standard"))
		if ok {
			t.Errorf("expected ok to be false for standard error")
		}
	})
}

func TestWrapError(t *testing.T) {
	innerErr := errors.New("inner error")
	wrapped := WrapError("WRAP_CODE", "Wrapped message", innerErr)

	if wrapped.Code != "WRAP_CODE" {
		t.Errorf("expected code 'WRAP_CODE', got '%s'", wrapped.Code)
	}

	if wrapped.Message != "Wrapped message" {
		t.Errorf("expected message 'Wrapped message', got '%s'", wrapped.Message)
	}

	if wrapped.Err != innerErr {
		t.Errorf("expected inner error to be wrapped")
	}
}

func TestPredefinedErrors(t *testing.T) {
	tests := []struct {
		name     string
		err      *AppError
		wantCode string
	}{
		{"ErrNotFound", ErrNotFound, ErrCodeNotFound},
		{"ErrUnauthorized", ErrUnauthorized, ErrCodeUnauthorized},
		{"ErrForbidden", ErrForbidden, ErrCodeForbidden},
		{"ErrBadRequest", ErrBadRequest, ErrCodeBadRequest},
		{"ErrConflict", ErrConflict, ErrCodeConflict},
		{"ErrInternalError", ErrInternalError, ErrCodeInternalError},
		{"ErrValidationFailed", ErrValidationFailed, ErrCodeValidationError},
		{"ErrDatabaseError", ErrDatabaseError, ErrCodeDatabaseError},
		{"ErrTokenExpired", ErrTokenExpired, ErrCodeTokenExpired},
		{"ErrInvalidToken", ErrInvalidToken, ErrCodeInvalidToken},
		{"ErrUserAlreadyExists", ErrUserAlreadyExists, ErrCodeUserAlreadyExists},
		{"ErrUserNotFound", ErrUserNotFound, ErrCodeUserNotFound},
		{"ErrInvalidCredentials", ErrInvalidCredentials, ErrCodeInvalidCredentials},
		{"ErrEmailNotVerified", ErrEmailNotVerified, ErrCodeEmailNotVerified},
		{"ErrTenantNotFound", ErrTenantNotFound, ErrCodeTenantNotFound},
		{"ErrCourseNotFound", ErrCourseNotFound, ErrCodeCourseNotFound},
		{"ErrLessonNotFound", ErrLessonNotFound, ErrCodeLessonNotFound},
		{"ErrNotEnrolled", ErrNotEnrolled, ErrCodeNotEnrolled},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err.Code != tt.wantCode {
				t.Errorf("expected code %s, got %s", tt.wantCode, tt.err.Code)
			}
			if tt.err.Message == "" {
				t.Errorf("predefined error should have a message")
			}
		})
	}
}
