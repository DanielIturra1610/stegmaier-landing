package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// CacheHelper provides convenient methods for working with cache
type CacheHelper struct {
	cache Cache
}

// NewCacheHelper creates a new cache helper
func NewCacheHelper(cache Cache) *CacheHelper {
	return &CacheHelper{
		cache: cache,
	}
}

// ============================================================================
// JSON Serialization Helpers
// ============================================================================

// GetJSON retrieves a value from cache and unmarshals it into the target
func (h *CacheHelper) GetJSON(ctx context.Context, key string, target interface{}) error {
	data, err := h.cache.Get(ctx, key)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("failed to unmarshal cached data: %w", err)
	}

	return nil
}

// SetJSON marshals the value to JSON and stores it in cache
func (h *CacheHelper) SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	return h.cache.Set(ctx, key, data, ttl)
}

// GetOrSetJSON tries to get a value from cache, if it doesn't exist, calls the loader function
// This implements the cache-aside pattern
func (h *CacheHelper) GetOrSetJSON(ctx context.Context, key string, target interface{}, ttl time.Duration, loader func() (interface{}, error)) error {
	// Try to get from cache
	err := h.GetJSON(ctx, key, target)
	if err == nil {
		return nil // Cache hit
	}

	if err != ErrCacheMiss {
		// Log error but continue to load from source
		// This ensures the system continues to work even if cache fails
	}

	// Cache miss - load from source
	data, err := loader()
	if err != nil {
		return fmt.Errorf("failed to load data: %w", err)
	}

	// Store in cache for next time (don't fail if cache write fails)
	_ = h.SetJSON(ctx, key, data, ttl)

	// Marshal the loaded data into target
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal loaded data: %w", err)
	}

	return json.Unmarshal(jsonData, target)
}

// ============================================================================
// Hash JSON Helpers
// ============================================================================

// HGetJSON retrieves a field from a hash and unmarshals it
func (h *CacheHelper) HGetJSON(ctx context.Context, key, field string, target interface{}) error {
	data, err := h.cache.HGet(ctx, key, field)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("failed to unmarshal cached data: %w", err)
	}

	return nil
}

// HSetJSON marshals the value to JSON and stores it in a hash field
func (h *CacheHelper) HSetJSON(ctx context.Context, key, field string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	return h.cache.HSet(ctx, key, field, data)
}

// ============================================================================
// Batch JSON Helpers
// ============================================================================

// GetMultiJSON retrieves multiple values and unmarshals them
func (h *CacheHelper) GetMultiJSON(ctx context.Context, keys []string, targetMap map[string]interface{}) error {
	data, err := h.cache.GetMulti(ctx, keys)
	if err != nil {
		return err
	}

	for key, value := range data {
		if target, ok := targetMap[key]; ok {
			if err := json.Unmarshal(value, target); err != nil {
				return fmt.Errorf("failed to unmarshal data for key %s: %w", key, err)
			}
		}
	}

	return nil
}

// SetMultiJSON marshals multiple values to JSON and stores them
func (h *CacheHelper) SetMultiJSON(ctx context.Context, items map[string]interface{}, ttl time.Duration) error {
	data := make(map[string][]byte)

	for key, value := range items {
		jsonData, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal data for key %s: %w", key, err)
		}
		data[key] = jsonData
	}

	return h.cache.SetMulti(ctx, data, ttl)
}

// ============================================================================
// Invalidation Helpers
// ============================================================================

// InvalidatePattern deletes all keys matching a pattern
func (h *CacheHelper) InvalidatePattern(ctx context.Context, pattern string) error {
	return h.cache.DeletePattern(ctx, pattern)
}

// InvalidateMultiple deletes multiple keys
func (h *CacheHelper) InvalidateMultiple(ctx context.Context, keys ...string) error {
	return h.cache.DeleteMulti(ctx, keys)
}

// ============================================================================
// Common Cache Strategies
// ============================================================================

// CacheAsideGet implements cache-aside read strategy
// 1. Try to read from cache
// 2. If miss, load from DB
// 3. Store in cache
// 4. Return data
func (h *CacheHelper) CacheAsideGet(ctx context.Context, key string, ttl time.Duration, loader func() (interface{}, error)) (interface{}, error) {
	// Try cache first
	var cachedData interface{}
	err := h.GetJSON(ctx, key, &cachedData)
	if err == nil {
		return cachedData, nil // Cache hit
	}

	// Cache miss - load from source
	data, err := loader()
	if err != nil {
		return nil, err
	}

	// Store in cache (don't fail if cache write fails)
	_ = h.SetJSON(ctx, key, data, ttl)

	return data, nil
}

// WriteThroughSet implements write-through cache strategy
// 1. Write to DB
// 2. Write to cache
// Returns error if either operation fails
func (h *CacheHelper) WriteThroughSet(ctx context.Context, key string, ttl time.Duration, data interface{}, writer func(data interface{}) error) error {
	// Write to database first
	if err := writer(data); err != nil {
		return fmt.Errorf("failed to write to database: %w", err)
	}

	// Write to cache
	if err := h.SetJSON(ctx, key, data, ttl); err != nil {
		// Log error but don't fail - data is in DB
		return fmt.Errorf("warning: failed to write to cache: %w", err)
	}

	return nil
}

// WriteAroundDelete implements write-around cache strategy
// 1. Write to DB
// 2. Invalidate cache
// Useful when writes are more frequent than reads
func (h *CacheHelper) WriteAroundDelete(ctx context.Context, key string, data interface{}, writer func(data interface{}) error) error {
	// Write to database
	if err := writer(data); err != nil {
		return fmt.Errorf("failed to write to database: %w", err)
	}

	// Invalidate cache
	_ = h.cache.Delete(ctx, key)

	return nil
}

// RefreshAhead implements refresh-ahead cache strategy
// Updates cache before TTL expires based on access patterns
func (h *CacheHelper) RefreshAhead(ctx context.Context, key string, ttl time.Duration, refreshThreshold time.Duration, loader func() (interface{}, error)) (interface{}, error) {
	// Check TTL
	remainingTTL, err := h.cache.TTL(ctx, key)
	if err != nil && err != ErrCacheMiss {
		// Continue even if TTL check fails
	}

	// Try to get from cache
	var cachedData interface{}
	err = h.GetJSON(ctx, key, &cachedData)
	if err == nil {
		// If TTL is below threshold, refresh in background
		if remainingTTL > 0 && remainingTTL < refreshThreshold {
			go func() {
				data, err := loader()
				if err == nil {
					_ = h.SetJSON(context.Background(), key, data, ttl)
				}
			}()
		}
		return cachedData, nil
	}

	// Cache miss - load synchronously
	data, err := loader()
	if err != nil {
		return nil, err
	}

	// Store in cache
	_ = h.SetJSON(ctx, key, data, ttl)

	return data, nil
}

// ============================================================================
// Warming Helpers
// ============================================================================

// WarmCache preloads data into cache
func (h *CacheHelper) WarmCache(ctx context.Context, items map[string]interface{}, ttl time.Duration) error {
	return h.SetMultiJSON(ctx, items, ttl)
}

// WarmCacheWithLoader loads and caches data using provided loaders
func (h *CacheHelper) WarmCacheWithLoader(ctx context.Context, keys []string, ttl time.Duration, loader func(key string) (interface{}, error)) error {
	items := make(map[string]interface{})

	for _, key := range keys {
		data, err := loader(key)
		if err != nil {
			// Skip failed loads but continue with others
			continue
		}
		items[key] = data
	}

	if len(items) == 0 {
		return fmt.Errorf("no data to warm cache")
	}

	return h.SetMultiJSON(ctx, items, ttl)
}
