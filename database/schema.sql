-- SOFIYA Database Schema
-- Phase 12.1: PostgreSQL schema for all features

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, phone)
);

CREATE INDEX idx_contacts_user ON contacts(user_id);

-- Social contacts (birthdays, gifts)
CREATE TABLE social_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    birthday DATE,
    anniversary DATE,
    preferences JSONB DEFAULT '{}',
    gift_ideas JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_time TIMESTAMP NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    triggered_at TIMESTAMP,
    completed_at TIMESTAMP,
    snoozed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_status ON reminders(user_id, status);
CREATE INDEX idx_reminders_due ON reminders(due_time);

-- Location reminders
CREATE TABLE location_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    radius INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'pending',
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scenes
CREATE TABLE scenes (
    id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    actions JSONB NOT NULL,
    atomic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE scene_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    results JSONB,
    errors JSONB,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Health data
CREATE TABLE health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL,
    value DECIMAL NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_user_metric ON health_data(user_id, metric);
CREATE INDEX idx_health_date ON health_data(date);

-- Item locations (spatial awareness)
CREATE TABLE item_locations (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    room VARCHAR(50),
    confidence DECIMAL DEFAULT 1,
    last_seen TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, item_name)
);

-- Fridge inventory
CREATE TABLE fridge_inventory (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    scanned_at TIMESTAMP DEFAULT NOW()
);

-- Action history (habits)
CREATE TABLE action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    context JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_action_user_action ON action_history(user_id, action);

-- User preferences
CREATE TABLE user_preferences (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    value JSONB,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, category)
);

-- Privacy settings
CREATE TABLE privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice profiles (identity)
CREATE TABLE voice_profiles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User values (ethics)
CREATE TABLE user_values (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    values JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation history
CREATE TABLE conversation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transcript TEXT,
    response TEXT,
    intent VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conv_user ON conversation_history(user_id);

-- Reading history (knowledge)
CREATE TABLE reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    read_at TIMESTAMP DEFAULT NOW()
);

-- Learning paths
CREATE TABLE learning_paths (
    path_id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    path_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Learning progress
CREATE TABLE learning_progress (
    path_id VARCHAR(255) REFERENCES learning_paths(path_id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    progress DECIMAL NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (path_id, step_number)
);

-- Security events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Event RSVPs
CREATE TABLE event_rsvps (
    event_id VARCHAR(255) NOT NULL,
    attendee VARCHAR(255) NOT NULL,
    response VARCHAR(20) NOT NULL,
    responded_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (event_id, attendee)
);

-- Phase 16: Feedback & Support
CREATE TABLE feature_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feature VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    is_feature_request BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_feature ON feature_feedback(feature);
CREATE INDEX idx_feedback_created ON feature_feedback(created_at);

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_support_user ON support_tickets(user_id);
CREATE INDEX idx_support_status ON support_tickets(status);

-- A/B test assignments (Phase 16.2)
CREATE TABLE ab_test_assignments (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experiment_id VARCHAR(100) NOT NULL,
    variant VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, experiment_id)
);

CREATE TABLE ab_test_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    experiment_id VARCHAR(100) NOT NULL,
    variant VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ab_events_experiment ON ab_test_events(experiment_id, variant);
