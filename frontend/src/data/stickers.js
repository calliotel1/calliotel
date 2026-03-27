// Sticker categories and emojis
export const STICKER_CATEGORIES = {
  reactions: {
    name: "Reactions",
    stickers: [
      { id: "👍", emoji: "👍", name: "Thumbs Up" },
      { id: "❤️", emoji: "❤️", name: "Heart" },
      { id: "😂", emoji: "😂", name: "Laugh" },
      { id: "😍", emoji: "😍", name: "Love" },
      { id: "🔥", emoji: "🔥", name: "Fire" },
      { id: "👏", emoji: "👏", name: "Clap" },
      { id: "🎉", emoji: "🎉", name: "Party" },
      { id: "💯", emoji: "💯", name: "100" },
      { id: "⭐", emoji: "⭐", name: "Star" },
      { id: "✨", emoji: "✨", name: "Sparkles" },
      { id: "💪", emoji: "💪", name: "Strong" },
      { id: "🙏", emoji: "🙏", name: "Thanks" },
    ]
  },
  emotions: {
    name: "Emotions",
    stickers: [
      { id: "😊", emoji: "😊", name: "Happy" },
      { id: "😎", emoji: "😎", name: "Cool" },
      { id: "🤔", emoji: "🤔", name: "Thinking" },
      { id: "😭", emoji: "😭", name: "Crying" },
      { id: "😱", emoji: "😱", name: "Shocked" },
      { id: "🤗", emoji: "🤗", name: "Hug" },
      { id: "😴", emoji: "😴", name: "Sleepy" },
      { id: "🤩", emoji: "🤩", name: "Star Eyes" },
      { id: "😤", emoji: "😤", name: "Triumph" },
      { id: "🥳", emoji: "🥳", name: "Party Face" },
      { id: "😇", emoji: "😇", name: "Angel" },
      { id: "🤪", emoji: "🤪", name: "Crazy" },
    ]
  },
  gestures: {
    name: "Gestures",
    stickers: [
      { id: "👋", emoji: "👋", name: "Wave" },
      { id: "✌️", emoji: "✌️", name: "Peace" },
      { id: "🤝", emoji: "🤝", name: "Handshake" },
      { id: "👊", emoji: "👊", name: "Fist Bump" },
      { id: "🙌", emoji: "🙌", name: "Raise Hands" },
      { id: "👌", emoji: "👌", name: "OK" },
      { id: "🤞", emoji: "🤞", name: "Fingers Crossed" },
      { id: "🤟", emoji: "🤟", name: "Love You" },
      { id: "💪", emoji: "💪", name: "Muscle" },
      { id: "🙏", emoji: "🙏", name: "Pray" },
      { id: "👐", emoji: "👐", name: "Open Hands" },
      { id: "🤲", emoji: "🤲", name: "Palms Up" },
    ]
  },
  symbols: {
    name: "Symbols",
    stickers: [
      { id: "❌", emoji: "❌", name: "X" },
      { id: "✅", emoji: "✅", name: "Check" },
      { id: "❓", emoji: "❓", name: "Question" },
      { id: "❗", emoji: "❗", name: "Exclamation" },
      { id: "💡", emoji: "💡", name: "Idea" },
      { id: "🎯", emoji: "🎯", name: "Target" },
      { id: "⚡", emoji: "⚡", name: "Lightning" },
      { id: "🌟", emoji: "🌟", name: "Glowing Star" },
      { id: "💰", emoji: "💰", name: "Money" },
      { id: "🎁", emoji: "🎁", name: "Gift" },
      { id: "🔔", emoji: "🔔", name: "Bell" },
      { id: "⏰", emoji: "⏰", name: "Alarm" },
    ]
  },
  communication: {
    name: "Communication",
    stickers: [
      { id: "📱", emoji: "📱", name: "Phone" },
      { id: "💬", emoji: "💬", name: "Chat" },
      { id: "✉️", emoji: "✉️", name: "Email" },
      { id: "📞", emoji: "📞", name: "Call" },
      { id: "📧", emoji: "📧", name: "E-mail" },
      { id: "📲", emoji: "📲", name: "Mobile" },
      { id: "💻", emoji: "💻", name: "Laptop" },
      { id: "📡", emoji: "📡", name: "Satellite" },
      { id: "🌐", emoji: "🌐", name: "Globe" },
      { id: "📨", emoji: "📨", name: "Incoming" },
      { id: "📬", emoji: "📬", name: "Mailbox" },
      { id: "📮", emoji: "📮", name: "Postbox" },
    ]
  }
};

export const getAllStickers = () => {
  const all = [];
  Object.values(STICKER_CATEGORIES).forEach(category => {
    all.push(...category.stickers);
  });
  return all;
};

export const getStickerById = (id) => {
  const all = getAllStickers();
  return all.find(s => s.id === id);
};
