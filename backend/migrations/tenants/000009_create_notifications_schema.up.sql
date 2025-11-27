-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unread',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    metadata JSONB DEFAULT '{}'::jsonb,
    action_url TEXT,
    action_label VARCHAR(50),
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    course_completion_enabled BOOLEAN NOT NULL DEFAULT true,
    progress_enabled BOOLEAN NOT NULL DEFAULT true,
    enrollment_enabled BOOLEAN NOT NULL DEFAULT true,
    quiz_completion_enabled BOOLEAN NOT NULL DEFAULT true,
    announcement_enabled BOOLEAN NOT NULL DEFAULT true,
    system_update_enabled BOOLEAN NOT NULL DEFAULT true,
    reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    achievement_enabled BOOLEAN NOT NULL DEFAULT true,
    assignment_enabled BOOLEAN NOT NULL DEFAULT true,
    certificate_enabled BOOLEAN NOT NULL DEFAULT true,
    digest_frequency VARCHAR(20) NOT NULL DEFAULT 'immediate',
    quiet_hours_start VARCHAR(5),
    quiet_hours_end VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_preferences_tenant ON notification_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON notification_preferences(user_id, tenant_id);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint, tenant_id)
);

-- Create indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON push_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON push_subscriptions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON push_subscriptions(is_active, user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_endpoint ON push_subscriptions(endpoint, tenant_id);

-- Add comments to tables
COMMENT ON TABLE notifications IS 'Stores user notifications for all types of events';
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences and settings';
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions for web push';

-- Add comments to key columns
COMMENT ON COLUMN notifications.type IS 'Type of notification: course_completion, progress, enrollment, quiz_completion, announcement, system_update, reminder, achievement, assignment, certificate';
COMMENT ON COLUMN notifications.status IS 'Status: unread, read, archived';
COMMENT ON COLUMN notifications.priority IS 'Priority: low, normal, high, urgent';
COMMENT ON COLUMN notifications.metadata IS 'Additional context data in JSON format';
COMMENT ON COLUMN notification_preferences.digest_frequency IS 'Frequency: immediate, hourly, daily, weekly';
