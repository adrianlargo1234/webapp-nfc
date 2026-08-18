export type Album = {
  id: string;
  name: string;
  emoji: string;
  country_code: string;
  country_name: string;
  slug: string;
  cover_path: string | null;
  created_at: string;
};

export type Media = {
  id: string;
  album_id: string;
  storage_path: string;
  mime_type: string;
  created_at: string;
};

export type AlbumWithCount = Album & {
  media_count: number;
};
