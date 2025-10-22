-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('university', 'government', 'school')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);