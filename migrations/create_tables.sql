-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  game_date TIMESTAMP NOT NULL,
  max_attendees INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  game_time TEXT DEFAULT '5:00 PM',
  location TEXT DEFAULT 'City Park Fields'
);

-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id SERIAL PRIMARY KEY,
  week_id INTEGER NOT NULL REFERENCES games(id),
  name TEXT NOT NULL,
  signup_time TIMESTAMP NOT NULL DEFAULT NOW(),
  is_waitlist BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create initial game for today if no games exist
INSERT INTO games (game_date, max_attendees, is_active, game_time, location)
SELECT CURRENT_DATE, 10, TRUE, '5:00 PM', 'City Park Fields'
WHERE NOT EXISTS (SELECT 1 FROM games);