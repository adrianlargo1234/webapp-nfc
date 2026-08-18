-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📷',
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on media table
CREATE INDEX IF NOT EXISTS media_album_id_created_at_idx ON media(album_id, created_at DESC);

-- Enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums (allow all anon access)
DROP POLICY IF EXISTS "Albums: anon can view" ON albums;
CREATE POLICY "Albums: anon can view" ON albums
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Albums: anon can create" ON albums;
CREATE POLICY "Albums: anon can create" ON albums
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Albums: anon can update" ON albums;
CREATE POLICY "Albums: anon can update" ON albums
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Albums: anon can delete" ON albums;
CREATE POLICY "Albums: anon can delete" ON albums
  FOR DELETE
  USING (true);

-- RLS Policies for media (allow all anon access)
DROP POLICY IF EXISTS "Media: anon can view" ON media;
CREATE POLICY "Media: anon can view" ON media
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Media: anon can create" ON media;
CREATE POLICY "Media: anon can create" ON media
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Media: anon can update" ON media;
CREATE POLICY "Media: anon can update" ON media
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Media: anon can delete" ON media;
CREATE POLICY "Media: anon can delete" ON media
  FOR DELETE
  USING (true);
