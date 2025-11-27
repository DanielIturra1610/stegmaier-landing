package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache implements the Cache interface using Redis
type RedisCache struct {
	client redis.UniversalClient
}

// NewRedisCache creates a new Redis cache instance
func NewRedisCache(addr, password string, db int) (*RedisCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           db,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
		MaxRetries:   3,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrConnectionFailed, err)
	}

	return &RedisCache{
		client: client,
	}, nil
}

// NewRedisClusterCache creates a new Redis cluster cache instance
func NewRedisClusterCache(addrs []string, password string) (*RedisCache, error) {
	client := redis.NewClusterClient(&redis.ClusterOptions{
		Addrs:        addrs,
		Password:     password,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
		MaxRetries:   3,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrConnectionFailed, err)
	}

	return &RedisCache{
		client: client,
	}, nil
}

// ============================================================================
// Basic Operations
// ============================================================================

// Get retrieves a value from cache by key
func (r *RedisCache) Get(ctx context.Context, key string) ([]byte, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	val, err := r.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, ErrCacheMiss
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// Set stores a value in cache with the given key and TTL
func (r *RedisCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	if key == "" {
		return ErrInvalidKey
	}
	if value == nil {
		return ErrInvalidValue
	}

	err := r.client.Set(ctx, key, value, ttl).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// Delete removes a key from cache
func (r *RedisCache) Delete(ctx context.Context, key string) error {
	if key == "" {
		return ErrInvalidKey
	}

	err := r.client.Del(ctx, key).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// Exists checks if a key exists in cache
func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	if key == "" {
		return false, ErrInvalidKey
	}

	count, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return count > 0, nil
}

// ============================================================================
// Batch Operations
// ============================================================================

// GetMulti retrieves multiple values from cache
func (r *RedisCache) GetMulti(ctx context.Context, keys []string) (map[string][]byte, error) {
	if len(keys) == 0 {
		return make(map[string][]byte), nil
	}

	pipe := r.client.Pipeline()
	cmds := make(map[string]*redis.StringCmd)

	for _, key := range keys {
		cmds[key] = pipe.Get(ctx, key)
	}

	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	result := make(map[string][]byte)
	for key, cmd := range cmds {
		val, err := cmd.Bytes()
		if err == nil {
			result[key] = val
		}
		// Silently skip missing keys
	}

	return result, nil
}

// SetMulti stores multiple key-value pairs in cache
func (r *RedisCache) SetMulti(ctx context.Context, items map[string][]byte, ttl time.Duration) error {
	if len(items) == 0 {
		return nil
	}

	pipe := r.client.Pipeline()

	for key, value := range items {
		pipe.Set(ctx, key, value, ttl)
	}

	_, err := pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// DeleteMulti removes multiple keys from cache
func (r *RedisCache) DeleteMulti(ctx context.Context, keys []string) error {
	if len(keys) == 0 {
		return nil
	}

	err := r.client.Del(ctx, keys...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// ============================================================================
// Pattern Operations
// ============================================================================

// DeletePattern removes all keys matching a pattern
func (r *RedisCache) DeletePattern(ctx context.Context, pattern string) error {
	if pattern == "" {
		return ErrInvalidKey
	}

	keys, err := r.Keys(ctx, pattern)
	if err != nil {
		return err
	}

	if len(keys) == 0 {
		return nil
	}

	return r.DeleteMulti(ctx, keys)
}

// Keys returns all keys matching a pattern
func (r *RedisCache) Keys(ctx context.Context, pattern string) ([]string, error) {
	if pattern == "" {
		return nil, ErrInvalidKey
	}

	keys, err := r.client.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return keys, nil
}

// FlushPattern clears all keys matching a pattern
func (r *RedisCache) FlushPattern(ctx context.Context, pattern string) error {
	return r.DeletePattern(ctx, pattern)
}

// ============================================================================
// Advanced Operations
// ============================================================================

// Increment atomically increments a counter
func (r *RedisCache) Increment(ctx context.Context, key string) (int64, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	val, err := r.client.Incr(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// IncrementBy atomically increments a counter by a specific value
func (r *RedisCache) IncrementBy(ctx context.Context, key string, value int64) (int64, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	val, err := r.client.IncrBy(ctx, key, value).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// Decrement atomically decrements a counter
func (r *RedisCache) Decrement(ctx context.Context, key string) (int64, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	val, err := r.client.Decr(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// Expire sets a TTL on an existing key
func (r *RedisCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	if key == "" {
		return ErrInvalidKey
	}

	err := r.client.Expire(ctx, key, ttl).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// TTL returns the remaining time to live of a key
func (r *RedisCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	ttl, err := r.client.TTL(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return ttl, nil
}

// ============================================================================
// Hash Operations
// ============================================================================

// HGet retrieves a field from a hash
func (r *RedisCache) HGet(ctx context.Context, key, field string) ([]byte, error) {
	if key == "" || field == "" {
		return nil, ErrInvalidKey
	}

	val, err := r.client.HGet(ctx, key, field).Bytes()
	if err == redis.Nil {
		return nil, ErrCacheMiss
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// HSet stores a field in a hash
func (r *RedisCache) HSet(ctx context.Context, key, field string, value []byte) error {
	if key == "" || field == "" {
		return ErrInvalidKey
	}

	err := r.client.HSet(ctx, key, field, value).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// HGetAll retrieves all fields from a hash
func (r *RedisCache) HGetAll(ctx context.Context, key string) (map[string][]byte, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	vals, err := r.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	result := make(map[string][]byte)
	for field, val := range vals {
		result[field] = []byte(val)
	}

	return result, nil
}

// HDelete removes fields from a hash
func (r *RedisCache) HDelete(ctx context.Context, key string, fields ...string) error {
	if key == "" || len(fields) == 0 {
		return ErrInvalidKey
	}

	err := r.client.HDel(ctx, key, fields...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// ============================================================================
// List Operations
// ============================================================================

// LPush prepends values to a list
func (r *RedisCache) LPush(ctx context.Context, key string, values ...[]byte) error {
	if key == "" || len(values) == 0 {
		return ErrInvalidKey
	}

	vals := make([]interface{}, len(values))
	for i, v := range values {
		vals[i] = v
	}

	err := r.client.LPush(ctx, key, vals...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// RPush appends values to a list
func (r *RedisCache) RPush(ctx context.Context, key string, values ...[]byte) error {
	if key == "" || len(values) == 0 {
		return ErrInvalidKey
	}

	vals := make([]interface{}, len(values))
	for i, v := range values {
		vals[i] = v
	}

	err := r.client.RPush(ctx, key, vals...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// LPop removes and returns the first element from a list
func (r *RedisCache) LPop(ctx context.Context, key string) ([]byte, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	val, err := r.client.LPop(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, ErrCacheMiss
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// RPop removes and returns the last element from a list
func (r *RedisCache) RPop(ctx context.Context, key string) ([]byte, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	val, err := r.client.RPop(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, ErrCacheMiss
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return val, nil
}

// LRange returns a range of elements from a list
func (r *RedisCache) LRange(ctx context.Context, key string, start, stop int64) ([][]byte, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	vals, err := r.client.LRange(ctx, key, start, stop).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	result := make([][]byte, len(vals))
	for i, val := range vals {
		result[i] = []byte(val)
	}

	return result, nil
}

// LLen returns the length of a list
func (r *RedisCache) LLen(ctx context.Context, key string) (int64, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	length, err := r.client.LLen(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return length, nil
}

// ============================================================================
// Set Operations
// ============================================================================

// SAdd adds members to a set
func (r *RedisCache) SAdd(ctx context.Context, key string, members ...[]byte) error {
	if key == "" || len(members) == 0 {
		return ErrInvalidKey
	}

	vals := make([]interface{}, len(members))
	for i, m := range members {
		vals[i] = m
	}

	err := r.client.SAdd(ctx, key, vals...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// SRem removes members from a set
func (r *RedisCache) SRem(ctx context.Context, key string, members ...[]byte) error {
	if key == "" || len(members) == 0 {
		return ErrInvalidKey
	}

	vals := make([]interface{}, len(members))
	for i, m := range members {
		vals[i] = m
	}

	err := r.client.SRem(ctx, key, vals...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// SMembers returns all members of a set
func (r *RedisCache) SMembers(ctx context.Context, key string) ([][]byte, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	vals, err := r.client.SMembers(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	result := make([][]byte, len(vals))
	for i, val := range vals {
		result[i] = []byte(val)
	}

	return result, nil
}

// SIsMember checks if a value is a member of a set
func (r *RedisCache) SIsMember(ctx context.Context, key string, member []byte) (bool, error) {
	if key == "" {
		return false, ErrInvalidKey
	}

	isMember, err := r.client.SIsMember(ctx, key, member).Result()
	if err != nil {
		return false, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return isMember, nil
}

// SCard returns the cardinality (size) of a set
func (r *RedisCache) SCard(ctx context.Context, key string) (int64, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	size, err := r.client.SCard(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return size, nil
}

// ============================================================================
// Sorted Set Operations
// ============================================================================

// ZAdd adds members with scores to a sorted set
func (r *RedisCache) ZAdd(ctx context.Context, key string, members map[string]float64) error {
	if key == "" || len(members) == 0 {
		return ErrInvalidKey
	}

	zMembers := make([]redis.Z, 0, len(members))
	for member, score := range members {
		zMembers = append(zMembers, redis.Z{
			Score:  score,
			Member: member,
		})
	}

	err := r.client.ZAdd(ctx, key, zMembers...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// ZRem removes members from a sorted set
func (r *RedisCache) ZRem(ctx context.Context, key string, members ...string) error {
	if key == "" || len(members) == 0 {
		return ErrInvalidKey
	}

	vals := make([]interface{}, len(members))
	for i, m := range members {
		vals[i] = m
	}

	err := r.client.ZRem(ctx, key, vals...).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// ZRange returns members in a sorted set by rank range
func (r *RedisCache) ZRange(ctx context.Context, key string, start, stop int64) ([]ZMember, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	vals, err := r.client.ZRangeWithScores(ctx, key, start, stop).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	result := make([]ZMember, len(vals))
	for i, val := range vals {
		result[i] = ZMember{
			Member: val.Member.(string),
			Score:  val.Score,
		}
	}

	return result, nil
}

// ZRevRange returns members in reverse order (highest score first)
func (r *RedisCache) ZRevRange(ctx context.Context, key string, start, stop int64) ([]ZMember, error) {
	if key == "" {
		return nil, ErrInvalidKey
	}

	vals, err := r.client.ZRevRangeWithScores(ctx, key, start, stop).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	result := make([]ZMember, len(vals))
	for i, val := range vals {
		result[i] = ZMember{
			Member: val.Member.(string),
			Score:  val.Score,
		}
	}

	return result, nil
}

// ZRank returns the rank of a member (0-based, lowest score first)
func (r *RedisCache) ZRank(ctx context.Context, key, member string) (int64, error) {
	if key == "" || member == "" {
		return 0, ErrInvalidKey
	}

	rank, err := r.client.ZRank(ctx, key, member).Result()
	if err == redis.Nil {
		return 0, ErrCacheMiss
	}
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return rank, nil
}

// ZScore returns the score of a member
func (r *RedisCache) ZScore(ctx context.Context, key, member string) (float64, error) {
	if key == "" || member == "" {
		return 0, ErrInvalidKey
	}

	score, err := r.client.ZScore(ctx, key, member).Result()
	if err == redis.Nil {
		return 0, ErrCacheMiss
	}
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return score, nil
}

// ZCard returns the cardinality (size) of a sorted set
func (r *RedisCache) ZCard(ctx context.Context, key string) (int64, error) {
	if key == "" {
		return 0, ErrInvalidKey
	}

	size, err := r.client.ZCard(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return size, nil
}

// ZIncrBy increments the score of a member
func (r *RedisCache) ZIncrBy(ctx context.Context, key string, increment float64, member string) (float64, error) {
	if key == "" || member == "" {
		return 0, ErrInvalidKey
	}

	newScore, err := r.client.ZIncrBy(ctx, key, increment, member).Result()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return newScore, nil
}

// ============================================================================
// Cache Management
// ============================================================================

// Flush clears all keys in the current database
func (r *RedisCache) Flush(ctx context.Context) error {
	err := r.client.FlushDB(ctx).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	return nil
}

// Ping checks if the cache is available
func (r *RedisCache) Ping(ctx context.Context) error {
	err := r.client.Ping(ctx).Err()
	if err != nil {
		return fmt.Errorf("%w: %v", ErrCacheUnavailable, err)
	}

	return nil
}

// Close closes the cache connection
func (r *RedisCache) Close() error {
	return r.client.Close()
}

// Stats returns cache statistics
func (r *RedisCache) Stats(ctx context.Context) (*CacheStats, error) {
	dbSize, err := r.client.DBSize(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOperationFailed, err)
	}

	// Parse Redis INFO output (simplified)
	stats := &CacheStats{
		Keys: dbSize,
	}

	// Note: Full parsing of Redis INFO would require more complex logic
	// This is a simplified version for demonstration

	return stats, nil
}
