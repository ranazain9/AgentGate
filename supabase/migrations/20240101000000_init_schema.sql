-- Migration: Initialize AgentGate Schema

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule TEXT NOT NULL,
    trust_score INTEGER DEFAULT 100,
    session_request_count INTEGER DEFAULT 0,
    is_built_in BOOLEAN DEFAULT false,
    mock_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    risk_justification TEXT,
    decision TEXT CHECK (decision IN ('approved', 'rejected', 'pending')),
    note TEXT,
    timestamp BIGINT NOT NULL
);

CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metadata JSONB NOT NULL,
    spec JSONB NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    handler TEXT NOT NULL,
    method TEXT,
    requires_approval BOOLEAN DEFAULT false,
    approval_threshold INTEGER,
    timeout INTEGER DEFAULT 10000,
    rate_limit TEXT,
    input_schema JSONB,
    output_schema JSONB
);

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    bright_data_zone TEXT,
    host TEXT,
    port INTEGER,
    database TEXT,
    username TEXT,
    query_template TEXT,
    allowed_tables JSONB,
    refresh_policy TEXT
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (for development purposes, secure later)
CREATE POLICY "Enable read access for all users" ON agents FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agents FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON audit_log FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON audit_log FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON agent_configs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agent_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agent_configs FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON tools FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tools FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON data_sources FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON data_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON data_sources FOR UPDATE USING (true);
