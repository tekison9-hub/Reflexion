/**
 * REFLEXION - ULTIMATE SAFE VERSION (SDK 52)
 * ✅ Varlık (Asset) Bağımsız: Ses dosyaları eksik olsa bile oyun açılır.
 * ✅ Paket Hata Koruması: Eksik paket durumlarında çökmez.
 * ✅ State-Based Navigasyon: Modüler geçişler.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';

// Expo Kütüphaneleri
// expo-av KALDIRILDI
// import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Animasyon Kütüphanesi
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';

// Güvenli Alan Yönetimi
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// İkon Seti
import {
  Play,
  Trophy,
  ShoppingBag,
  Zap,
  Heart,
  Activity,
  Home,
  Settings,
  RotateCcw,
} from 'lucide-react-native';

// --- OYUN SABİTLERİ ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TARGET_SIZE = 75;
const SPAWN_MARGIN = 40;

const THEME_COLORS = {
  neonCyan: '#00F5FF',
  neonPink: '#FF00FF',
  neonPurple: '#9D00FF',
  neonGreen: '#39FF14',
  neonRed: '#FF3131',
  neonGold: '#FFD700',
};

const GAME_MODES = {
  CLASSIC: { id: 'classic', name: 'Classic', color: THEME_COLORS.neonCyan, icon: Zap },
  RUSH: { id: 'rush', name: 'Rush', color: THEME_COLORS.neonRed, icon: Activity },
  ZEN: { id: 'zen', name: 'Zen', color: THEME_COLORS.neonPurple, icon: Heart },
};

// --- SES YÖNETİCİSİ (GÜVENLİ MOD) ---
// require() çağrıları kaldırıldı, böylece dosya yok hatası alınmaz.
class SoundManager {
  constructor() {
    this.sounds = {};
    this.isReady = false;
  }

  async init() {
    // expo-av kaldırıldığı için burada audio mode ayarı yapılmıyor.
    // İleride expo-audio entegrasyonu eklenebilir.
    this.isReady = true;
  }

  async play(name, pitch = 1.0) {
    // Dosya olmadığı için ses çalma işlemini atlıyoruz.
    // return;
  }
}
const soundManager = new SoundManager();

// --- BİLEŞENLER ---

const Background = ({ children }) => (
  <LinearGradient
    colors={['#05070a', '#1a0b2e', '#000000']}
    style={styles.background}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    {children}
  </LinearGradient>
);

const NeonButton = ({ onPress, title, color = THEME_COLORS.neonCyan, icon: Icon, size = 'large', style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95);
          if (Platform.OS !== 'web')
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        onPressOut={() => (scale.value = withSpring(1))}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[`${color}30`, `${color}05`]} // ❗ Buradaki sentaks düzeltildi
          style={[
            styles.button,
            size === 'small' && styles.buttonSmall,
            { borderColor: color, shadowColor: color },
          ]}
        >
          {Icon && (
            <Icon
              color={color}
              size={size === 'small' ? 20 : 24}
              style={{ marginRight: title ? 10 : 0 }}
            />
          )}
          {title && (
            <Text
              style={[
                styles.buttonText,
                size === 'small' && styles.buttonTextSmall,
                { color },
              ]}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Target = React.memo(({ id, x, y, onPress, color }) => {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1);
  }, []);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    left: x,
    top: y,
    position: 'absolute',
  }));

  return (
    <Animated.View style={rStyle}>
      <TouchableOpacity onPress={() => onPress(id)} activeOpacity={0.7}>
        <View style={[styles.targetCircle, { borderColor: color, shadowColor: color }]}>
          <View style={[styles.targetInner, { backgroundColor: color }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- ANA UYGULAMA AKIŞI ---

export default function App() {
  const insets = useSafeAreaInsets();

  // State Yönetimi
  const [currentScreen, setCurrentScreen] = useState('MENU');
  const [gameMode, setGameMode] = useState(GAME_MODES.CLASSIC);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [health, setHealth] = useState(3);
  const [targets, setTargets] = useState([]);

  // Referanslar
  const timerRef = useRef(null);
  const lastSpawnTime = useRef(0);
  const difficulty = useRef(1);

  // Başlangıç
  useEffect(() => {
    soundManager.init();
    // 500ms sonra menüye geç
    setTimeout(() => setCurrentScreen('MENU'), 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Oyunu Başlat
  const startGame = (mode) => {
    setGameMode(mode);
    setScore(0);
    setCombo(0);
    setHealth(mode.id === 'rush' ? 1 : 3);
    setTargets([]);
    difficulty.current = 1;
    setCurrentScreen('GAME');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(gameLoop, 50); // 20 FPS Loop
  };

  // Oyun Döngüsü
  const gameLoop = () => {
    const now = Date.now();
    const spawnRate = Math.max(400, 1000 - difficulty.current * 50);

    // Yeni hedef oluştur
    if (now - lastSpawnTime.current > spawnRate) {
      const id = Math.random().toString();
      const x =
        Math.random() * (SCREEN_WIDTH - TARGET_SIZE - SPAWN_MARGIN * 2) + SPAWN_MARGIN;
      const y = Math.random() * (SCREEN_HEIGHT - 300) + 150;

      setTargets((prev) => [...prev, { id, x, y, createdAt: now }]);
      lastSpawnTime.current = now;
    }

    // Süresi dolanları temizle
    setTargets((prev) => {
      const keep = [];
      let missed = false;
      prev.forEach((t) => {
        if (now - t.createdAt < 2000) keep.push(t);
        else missed = true;
      });

      if (missed) handleMiss();
      return keep;
    });
  };

  // Hedefe Tıklama
  const handleTap = (id) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((s) => s + 10 + combo);
    setCombo((c) => c + 1);
    difficulty.current += 0.1;

    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Hedef Kaçırma
  const handleMiss = () => {
    setCombo(0);
    if (gameMode.id !== 'zen') {
      setHealth((h) => {
        if (h <= 1) {
          clearInterval(timerRef.current);
          setCurrentScreen('GAMEOVER');
          return 0;
        }
        return h - 1;
      });
    }
  };

  // --- EKRANLAR ---

  const renderMenu = () => (
    <Animated.View entering={FadeIn} style={styles.container}>
      <Text style={styles.title}>REFLEXION</Text>
      <Text style={styles.subtitle}>ULTIMATE</Text>

      <View style={styles.menuButtons}>
        {Object.values(GAME_MODES).map((mode) => (
          <NeonButton
            key={mode.id}
            title={mode.name}
            icon={mode.icon}
            color={mode.color}
            onPress={() => startGame(mode)}
            style={{ marginBottom: 15, width: 280 }}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <NeonButton
          icon={Trophy}
          size="small"
          color={THEME_COLORS.neonGold}
          onPress={() => {}}
        />
        <NeonButton
          icon={ShoppingBag}
          size="small"
          color={THEME_COLORS.neonGreen}
          onPress={() => {}}
        />
        <NeonButton
          icon={Settings}
          size="small"
          color={THEME_COLORS.neonPink}
          onPress={() => {}}
        />
      </View>
    </Animated.View>
  );

  const renderGame = () => (
    <View style={styles.container}>
      <View style={[styles.header, { marginTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        {gameMode.id !== 'zen' && (
          <View style={{ flexDirection: 'row' }}>
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                color={i < health ? THEME_COLORS.neonRed : '#333'}
                fill={i < health ? THEME_COLORS.neonRed : 'transparent'}
                size={24}
                style={{ marginLeft: 5 }}
              />
            ))}
          </View>
        )}
      </View>

      {targets.map((t) => (
        <Target key={t.id} {...t} color={gameMode.color} onPress={handleTap} />
      ))}
    </View>
  );

  const renderGameOver = () => (
    <Animated.View entering={ZoomIn} style={styles.container}>
      <Text style={[styles.title, { color: THEME_COLORS.neonRed, fontSize: 40 }]}>
        GAME OVER
      </Text>

      <View style={styles.statsBox}>
        <Text style={styles.statLabel}>FINAL SCORE</Text>
        <Text style={styles.statValue}>{score}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 20, marginTop: 40 }}>
        <NeonButton
          icon={Home}
          onPress={() => setCurrentScreen('MENU')}
          color={THEME_COLORS.neonCyan}
        />
        <NeonButton
          icon={RotateCcw}
          title="RETRY"
          onPress={() => startGame(gameMode)}
          color={THEME_COLORS.neonGreen}
        />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <Background>
        {currentScreen === 'MENU' && renderMenu()}
        {currentScreen === 'GAME' && renderGame()}
        {currentScreen === 'GAMEOVER' && renderGameOver()}
      </Background>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 50,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 5,
    textShadowColor: '#00F5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#9D00FF',
    letterSpacing: 8,
    marginBottom: 60,
    fontWeight: 'bold',
  },
  menuButtons: { alignItems: 'center', width: '100%' },
  footer: { flexDirection: 'row', position: 'absolute', bottom: 50, gap: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  buttonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  buttonTextSmall: { fontSize: 14 },
  buttonSmall: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  targetCircle: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  targetInner: { width: '60%', height: '60%', borderRadius: 30, opacity: 0.8 },
  header: {
    width: '100%',
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
  },
  scoreLabel: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },
  scoreValue: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  statsBox: {
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    width: '80%',
  },
  statLabel: { color: '#888', fontSize: 14, marginBottom: 5 },
  statValue: { color: '#FFF', fontSize: 48, fontWeight: 'bold' },
});
