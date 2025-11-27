package cache

import "errors"

var (
	// ErrCacheMiss indicates that a key was not found in cache
	ErrCacheMiss = errors.New("cache: key not found")

	// ErrCacheUnavailable indicates that the cache service is not available
	ErrCacheUnavailable = errors.New("cache: service unavailable")

	// ErrInvalidKey indicates that the provided key is invalid
	ErrInvalidKey = errors.New("cache: invalid key")

	// ErrInvalidValue indicates that the provided value is invalid
	ErrInvalidValue = errors.New("cache: invalid value")

	// ErrOperationFailed indicates that a cache operation failed
	ErrOperationFailed = errors.New("cache: operation failed")

	// ErrConnectionFailed indicates that connection to cache failed
	ErrConnectionFailed = errors.New("cache: connection failed")
)
