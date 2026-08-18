// Lista curada de emojis de viaje/álbum para elegir al crear un álbum.
export const ALBUM_EMOJIS: string[] = [
  "📷",
  "✈️",
  "🌍",
  "🌎",
  "🌏",
  "🗺️",
  "🧳",
  "🏖️",
  "🏔️",
  "🏝️",
  "🏕️",
  "🏙️",
  "🗼",
  "🗽",
  "🗾",
  "🏯",
  "🏰",
  "⛰️",
  "🌋",
  "🏜️",
  "🌅",
  "🌆",
  "🚗",
  "🚂",
  "🚢",
  "🛶",
  "🎡",
  "🎢",
  "🍹",
  "🍜",
  "❤️",
  "⭐",
];

export const DEFAULT_ALBUM_EMOJI = ALBUM_EMOJIS[0];

export function isValidAlbumEmoji(value: string): boolean {
  return ALBUM_EMOJIS.includes(value);
}
