/**
 * REFLEXION v5.0 - SHOP ITEMS DATABASE
 * Complete catalog of purchasable cosmetics and customizations
 * 40+ items across 4 categories
 */

export const SHOP_CATEGORIES = {
  THEMES: 'themes',
  PARTICLES: 'particles',
  SOUNDS: 'sounds',
  BALLS: 'balls',
};

export const SHOP_ITEMS = {
  themes: [
    {
      id: 'theme_default',
      name: 'Classic Dark',
      description: 'Original Reflexion theme',
      price: 0,
      unlocked: true,
      level: 1,
      colors: {
        background: ['#1a1a2e', '#16213e', '#0f3460'],
        primary: '#00E5FF',
        secondary: '#FF6B9D',
      }
    },
    {
      id: 'theme_neon_city',
      name: 'Neon City',
      description: 'Cyberpunk vibes',
      price: 500,
      unlocked: false,
      level: 5,
      colors: {
        background: ['#0a0e27', '#1a1f4d', '#2d3561'],
        primary: '#FF1744',
        secondary: '#00E5FF',
      }
    },
    {
      id: 'theme_ocean',
      name: 'Deep Ocean',
      description: 'Underwater serenity',
      price: 800,
      unlocked: false,
      level: 8,
      colors: {
        background: ['#001f3f', '#003d7a', '#0056a3'],
        primary: '#00CED1',
        secondary: '#1E90FF',
      }
    },
    {
      id: 'theme_sunset',
      name: 'Sunset Dreams',
      description: 'Warm evening colors',
      price: 700,
      unlocked: false,
      level: 10,
      colors: {
        background: ['#ff6b6b', '#ff8e53', '#ffd93d'],
        primary: '#FF4500',
        secondary: '#FFD700',
      }
    },
    {
      id: 'theme_forest',
      name: 'Mystic Forest',
      description: 'Nature\'s embrace',
      price: 900,
      unlocked: false,
      level: 12,
      colors: {
        background: ['#1a3a1a', '#2d5a2d', '#407a40'],
        primary: '#90EE90',
        secondary: '#FFD700',
      }
    },
    {
      id: 'theme_space',
      name: 'Space Odyssey',
      description: 'Among the stars',
      price: 1200,
      unlocked: false,
      level: 15,
      colors: {
        background: ['#000000', '#0a0a2e', '#1a1a4e'],
        primary: '#FFFFFF',
        secondary: '#4169E1',
      }
    },
    {
      id: 'theme_volcano',
      name: 'Volcano',
      description: 'Burning intensity',
      price: 1500,
      unlocked: false,
      level: 18,
      colors: {
        background: ['#2d0a0a', '#4d1414', '#6d1e1e'],
        primary: '#FF4500',
        secondary: '#FFD700',
      }
    },
    {
      id: 'theme_ice',
      name: 'Ice Palace',
      description: 'Frozen beauty',
      price: 1400,
      unlocked: false,
      level: 20,
      colors: {
        background: ['#b8e6f5', '#87ceeb', '#4682b4'],
        primary: '#00CED1',
        secondary: '#FFFFFF',
      }
    },
    {
      id: 'theme_matrix',
      name: 'Matrix Code',
      description: 'Enter the Matrix',
      price: 1800,
      unlocked: false,
      level: 22,
      colors: {
        background: ['#000000', '#001100', '#003300'],
        primary: '#00FF00',
        secondary: '#00FF00',
      }
    },
    {
      id: 'theme_galaxy',
      name: 'Galaxy',
      description: 'Beyond the cosmos',
      price: 2000,
      unlocked: false,
      level: 25,
      colors: {
        background: ['#1a0033', '#33006b', '#4d00a3'],
        primary: '#FF00FF',
        secondary: '#00FFFF',
      }
    },
    {
      id: 'theme_gold',
      name: 'Golden Empire',
      description: 'Ultimate luxury',
      price: 3000,
      unlocked: false,
      level: 30,
      premium: true,
      colors: {
        background: ['#1a1a00', '#332d00', '#4d4000'],
        primary: '#FFD700',
        secondary: '#FFA500',
      }
    },
  ],

  particles: [
    {
      id: 'particle_default',
      name: 'Classic Circles',
      description: 'Simple and clean',
      price: 0,
      unlocked: true,
      level: 1,
      emoji: '⚪',
    },
    {
      id: 'particle_stars',
      name: 'Star Burst',
      description: 'Twinkling stars',
      price: 300,
      unlocked: false,
      level: 3,
      emoji: '⭐',
    },
    {
      id: 'particle_hearts',
      name: 'Love Hearts',
      description: 'Romantic vibes',
      price: 400,
      unlocked: false,
      level: 5,
      emoji: '💖',
    },
    {
      id: 'particle_fire',
      name: 'Flames',
      description: 'Burning hot',
      price: 500,
      unlocked: false,
      level: 8,
      emoji: '🔥',
    },
    {
      id: 'particle_lightning',
      name: 'Lightning Bolts',
      description: 'Electric energy',
      price: 600,
      unlocked: false,
      level: 12,
      emoji: '⚡',
    },
    {
      id: 'particle_confetti',
      name: 'Confetti',
      description: 'Party time!',
      price: 500,
      unlocked: false,
      level: 10,
      emoji: '🎉',
    },
    {
      id: 'particle_sparkles',
      name: 'Sparkles',
      description: 'Magical shine',
      price: 550,
      unlocked: false,
      level: 14,
      emoji: '✨',
    },
    {
      id: 'particle_snow',
      name: 'Snowflakes',
      description: 'Winter wonder',
      price: 600,
      unlocked: false,
      level: 16,
      emoji: '❄️',
    },
  ],

  sounds: [
    {
      id: 'sound_default',
      name: 'Classic',
      description: 'Original sounds',
      price: 0,
      unlocked: true,
      level: 1,
    },
    {
      id: 'sound_8bit',
      name: '8-Bit Retro',
      description: 'Nostalgic vibes',
      price: 400,
      unlocked: false,
      level: 7,
    },
    {
      id: 'sound_scifi',
      name: 'Sci-Fi',
      description: 'Futuristic beeps',
      price: 600,
      unlocked: false,
      level: 12,
    },
    {
      id: 'sound_nature',
      name: 'Nature',
      description: 'Organic sounds',
      price: 500,
      unlocked: false,
      level: 10,
    },
  ],

  balls: [
    {
      id: 'ball_default',
      name: 'Classic Ball',
      description: 'Standard target',
      price: 0,
      unlocked: true,
      level: 1,
      emoji: '⚪',
      color: '#00E5FF',
    },
    {
      id: 'ball_soccer',
      name: 'Soccer Ball',
      description: 'Football style',
      price: 300,
      unlocked: false,
      level: 5,
      emoji: '⚽',
      color: '#FFFFFF',
    },
    {
      id: 'ball_basketball',
      name: 'Basketball',
      description: 'Hoop dreams',
      price: 300,
      unlocked: false,
      level: 6,
      emoji: '🏀',
      color: '#FF6B35',
    },
    {
      id: 'ball_fire',
      name: 'Fire Ball',
      description: 'Blazing hot',
      price: 500,
      unlocked: false,
      level: 10,
      emoji: '🔥',
      color: '#FF4500',
    },
    {
      id: 'ball_galaxy',
      name: 'Galaxy Ball',
      description: 'Cosmic power',
      price: 800,
      unlocked: false,
      level: 18,
      emoji: '🌌',
      color: '#9B59B6',
    },
  ],
};

export const getCategoryItems = (category) => {
  return SHOP_ITEMS[category] || [];
};

export const getAllItems = () => {
  return Object.values(SHOP_ITEMS).flat();
};

export const getItemById = (itemId) => {
  return getAllItems().find(item => item.id === itemId);
};
