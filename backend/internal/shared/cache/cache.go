package cache

import (
	"context"
	"time"
)

// Cache defines the interface for caching operations
// This abstraction allows us to switch between different cache implementations (Redis, Memcached, In-Memory, etc.)
type Cache interface {
	// ========================================================================
	// Basic Operations
	// ========================================================================

	// Get retrieves a value from cache by key
	// Returns ErrCacheMiss if key doesn't exist
	Get(ctx context.Context, key string) ([]byte, error)

	// Set stores a value in cache with the given key and TTL
	// If ttl is 0, the key will not expire
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error

	// Delete removes a key from cache
	Delete(ctx context.Context, key string) error

	// Exists checks if a key exists in cache
	Exists(ctx context.Context, key string) (bool, error)

	// ========================================================================
	// Batch Operations
	// ========================================================================

	// GetMulti retrieves multiple values from cache
	// Returns a map of key -> value for keys that exist
	GetMulti(ctx context.Context, keys []string) (map[string][]byte, error)

	// SetMulti stores multiple key-value pairs in cache
	// All keys will have the same TTL
	SetMulti(ctx context.Context, items map[string][]byte, ttl time.Duration) error

	// DeleteMulti removes multiple keys from cache
	DeleteMulti(ctx context.Context, keys []string) error

	// ========================================================================
	// Pattern Operations
	// ========================================================================

	// DeletePattern removes all keys matching a pattern
	// Pattern uses Redis-style glob patterns (e.g., "user:*", "course:123:*")
	DeletePattern(ctx context.Context, pattern string) error

	// Keys returns all keys matching a pattern
	// WARNING: Use with caution in production as it can be slow
	Keys(ctx context.Context, pattern string) ([]string, error)

	// ========================================================================
	// Advanced Operations
	// ========================================================================

	// Increment atomically increments a counter
	// Returns the new value after increment
	Increment(ctx context.Context, key string) (int64, error)

	// IncrementBy atomically increments a counter by a specific value
	IncrementBy(ctx context.Context, key string, value int64) (int64, error)

	// Decrement atomically decrements a counter
	Decrement(ctx context.Context, key string) (int64, error)

	// Expire sets a TTL on an existing key
	Expire(ctx context.Context, key string, ttl time.Duration) error

	// TTL returns the remaining time to live of a key
	// Returns -1 if key has no expiration, -2 if key doesn't exist
	TTL(ctx context.Context, key string) (time.Duration, error)

	// ========================================================================
	// Hash Operations (for structured data)
	// ========================================================================

	// HGet retrieves a field from a hash
	HGet(ctx context.Context, key, field string) ([]byte, error)

	// HSet stores a field in a hash
	HSet(ctx context.Context, key, field string, value []byte) error

	// HGetAll retrieves all fields from a hash
	HGetAll(ctx context.Context, key string) (map[string][]byte, error)

	// HDelete removes fields from a hash
	HDelete(ctx context.Context, key string, fields ...string) error

	// ========================================================================
	// List Operations (for queues/collections)
	// ========================================================================

	// LPush prepends values to a list
	LPush(ctx context.Context, key string, values ...[]byte) error

	// RPush appends values to a list
	RPush(ctx context.Context, key string, values ...[]byte) error

	// LPop removes and returns the first element from a list
	LPop(ctx context.Context, key string) ([]byte, error)

	// RPop removes and returns the last element from a list
	RPop(ctx context.Context, key string) ([]byte, error)

	// LRange returns a range of elements from a list
	LRange(ctx context.Context, key string, start, stop int64) ([][]byte, error)

	// LLen returns the length of a list
	LLen(ctx context.Context, key string) (int64, error)

	// ========================================================================
	// Set Operations (for unique collections)
	// ========================================================================

	// SAdd adds members to a set
	SAdd(ctx context.Context, key string, members ...[]byte) error

	// SRem removes members from a set
	SRem(ctx context.Context, key string, members ...[]byte) error

	// SMembers returns all members of a set
	SMembers(ctx context.Context, key string) ([][]byte, error)

	// SIsMember checks if a value is a member of a set
	SIsMember(ctx context.Context, key string, member []byte) (bool, error)

	// SCard returns the cardinality (size) of a set
	SCard(ctx context.Context, key string) (int64, error)

	// ========================================================================
	// Sorted Set Operations (for leaderboards)
	// ========================================================================

	// ZAdd adds members with scores to a sorted set
	ZAdd(ctx context.Context, key string, members map[string]float64) error

	// ZRem removes members from a sorted set
	ZRem(ctx context.Context, key string, members ...string) error

	// ZRange returns members in a sorted set by rank range
	// Returns members with scores
	ZRange(ctx context.Context, key string, start, stop int64) ([]ZMember, error)

	// ZRevRange returns members in reverse order (highest score first)
	ZRevRange(ctx context.Context, key string, start, stop int64) ([]ZMember, error)

	// ZRank returns the rank of a member (0-based, lowest score first)
	ZRank(ctx context.Context, key, member string) (int64, error)

	// ZScore returns the score of a member
	ZScore(ctx context.Context, key, member string) (float64, error)

	// ZCard returns the cardinality (size) of a sorted set
	ZCard(ctx context.Context, key string) (int64, error)

	// ZIncrBy increments the score of a member
	ZIncrBy(ctx context.Context, key string, increment float64, member string) (float64, error)

	// ========================================================================
	// Cache Management
	// ========================================================================

	// Flush clears all keys in the current database
	// WARNING: Use with extreme caution
	Flush(ctx context.Context) error

	// FlushPattern clears all keys matching a pattern
	FlushPattern(ctx context.Context, pattern string) error

	// Ping checks if the cache is available
	Ping(ctx context.Context) error

	// Close closes the cache connection
	Close() error

	// Stats returns cache statistics
	Stats(ctx context.Context) (*CacheStats, error)
}

// ZMember represents a member in a sorted set with its score
type ZMember struct {
	Member string
	Score  float64
}

// CacheStats represents cache statistics
type CacheStats struct {
	Hits              int64  `json:"hits"`
	Misses            int64  `json:"misses"`
	Keys              int64  `json:"keys"`
	UsedMemory        int64  `json:"used_memory_bytes"`
	UsedMemoryHuman   string `json:"used_memory_human"`
	MaxMemory         int64  `json:"max_memory_bytes"`
	MaxMemoryHuman    string `json:"max_memory_human"`
	ConnectedClients  int64  `json:"connected_clients"`
	Uptime            int64  `json:"uptime_seconds"`
	HitRate           float64 `json:"hit_rate"`
}
