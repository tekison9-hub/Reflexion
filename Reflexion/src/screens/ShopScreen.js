/**
 * REFLEXION v6.0 - FIXED SHOP SCREEN (FINAL BUILD)
 * ✔ No module-level Dimensions
 * ✔ Uses useWindowDimensions()
 * ✔ Styles built inside component (runtime-safe)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SHOP_CATEGORIES, getCategoryItems } from '../data/ShopItems';
import soundManager from '../services/SoundManager';
import { getLevelFromXP } from '../utils/GameLogic';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { useTheme } from '../contexts/ThemeContext';
import { debugEvents } from '../utils/debugLog';

export default function ShopScreen({ navigation }) {
  const { width } = useWindowDimensions();       // ✔ safe
  const itemWidth = useMemo(() => (width - 60) / 2, [width]);

  const { playerData, spendCoins } = useGlobalState();
  const { changeTheme } = useTheme(); // CRITICAL FIX: Use ThemeContext

  const [activeCategory, setActiveCategory] = useState(SHOP_CATEGORIES.THEMES);
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [activeItems, setActiveItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const coins = playerData?.coins || 0;
  const level = getLevelFromXP(playerData?.xp || 0);

  useEffect(() => {
    loadUserData();
  }, [playerData]); // CRITICAL FIX: Reload when playerData changes (coins update)

  const loadUserData = async () => {
    try {
      const unlockedData = await AsyncStorage.getItem('@unlocked_items');
      const activeData = await AsyncStorage.getItem('@active_items');

      const defaultUnlocked = ['theme_default', 'particle_default', 'ball_default'];

      setUnlockedItems(unlockedData ? JSON.parse(unlockedData) : defaultUnlocked);

      const defaultActive = {
        [SHOP_CATEGORIES.THEMES]: 'theme_default',
        [SHOP_CATEGORIES.PARTICLES]: 'particle_default',
        [SHOP_CATEGORIES.BALLS]: 'ball_default',
      };

      setActiveItems(activeData ? JSON.parse(activeData) : defaultActive);
    } catch (err) {
      console.error('Error loading shop data:', err);
    }
  };

  const setActiveItem = async (itemId, category) => {
    try {
      const updated = { ...activeItems, [category]: itemId };
      await AsyncStorage.setItem('@active_items', JSON.stringify(updated));
      setActiveItems(updated);
      
      console.log(`🛍️ Shop - Setting active item: ${category} = ${itemId}`);
      
      // 🔴 BUG #1 FIX: Update ThemeService when theme is activated
      if (category === SHOP_CATEGORIES.THEMES) {
        // CRITICAL FIX: Use ThemeContext to change theme globally
        const success = await changeTheme(itemId);
        if (success) {
          debugEvents.themeChange(itemId);
          console.log(`✅ Shop - Theme ${itemId} set as active via ThemeService`);
        } else {
          console.error(`❌ Shop - Failed to set theme ${itemId}`);
        }
      } else if (category === SHOP_CATEGORIES.PARTICLES) {
        // 🔴 BUG #1 FIX: Log particle selection (for future enhancement)
        console.log(`✅ Shop - Particle ${itemId} set as active`);
        // Note: Particles are currently applied via theme colors
        // Future: Could add particle-specific visual effects here
      } else if (category === SHOP_CATEGORIES.BALLS) {
        console.log(`✅ Shop - Ball ${itemId} set as active`);
      }
      
      // === HAPTIC PATCH START ===
      // Replace shop purchase sound with dopamine sparkle-style sfx
      soundManager.play('shop_purchase_dopamine');
      // === HAPTIC PATCH END ===
      
      // === SOUND REGISTRATION START ===
      // Set Active sound (after successful state update)
      soundManager.play('setActive').catch(() => {});
      // === SOUND REGISTRATION END ===
    } catch (err) {
      console.error('❌ Error activating item:', err);
    }
  };

  const saveUnlockedItems = async (items) => {
    try {
      await AsyncStorage.setItem('@unlocked_items', JSON.stringify(items));
      setUnlockedItems(items);
    } catch (err) {
      console.error('Error saving unlocked items:', err);
    }
  };

  const handlePurchase = async (item) => {
    if (level < item.level) {
      soundManager.play('error');
      return Alert.alert('Level Required', `Reach level ${item.level} to unlock this item.`);
    }

    if (coins < item.price) {
      soundManager.play('error');
      return Alert.alert('Not Enough Coins', `You need ${item.price - coins} more coins.`);
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy "${item.name}" for ${item.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            await spendCoins(item.price);
            const updated = [...unlockedItems, item.id];
            await saveUnlockedItems(updated);
            soundManager.play('success');
            setShowPreview(false);
          },
        },
      ]
    );
  };

  // ✔ Styles created AFTER width is known
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#0f1419',
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          paddingTop: 60,
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFF',
        },
        coinsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1a1a2e',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        },
        coinsText: {
          color: '#FFD700',
          fontSize: 16,
          marginLeft: 4,
          fontWeight: 'bold',
        },
        tabsContainer: {
          paddingHorizontal: 20,
          paddingVertical: 10,
        },
        tab: {
          paddingHorizontal: 20,
          paddingVertical: 10,
          marginRight: 10,
          borderRadius: 20,
          backgroundColor: '#1a1a2e',
        },
        tabActive: {
          backgroundColor: '#00E5FF',
        },
        tabText: {
          color: '#8B8B8B',
          fontSize: 14,
          fontWeight: '600',
        },
        tabTextActive: {
          color: '#1a1a2e',
        },
        itemsContainer: {
          flex: 1,
          paddingHorizontal: 20,
        },
        itemsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        itemCard: {
          width: itemWidth,
          marginBottom: 15,
          borderRadius: 12,
          overflow: 'hidden',
        },
        itemCardLocked: {
          opacity: 0.5,
        },
        itemGradient: {
          padding: 12,
        },
        badge: {
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
        },
        badgeUnlocked: {
          backgroundColor: '#00FF0020',
        },
        itemPreview: {
          height: 100,
          borderRadius: 8,
          marginBottom: 10,
          justifyContent: 'center',
          alignItems: 'center',
        },
        itemName: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#FFF',
        },
        itemDescription: {
          fontSize: 11,
          color: '#8B8B8B',
          marginBottom: 8,
        },
        priceContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        priceText: {
          color: '#FFD700',
          fontSize: 14,
          fontWeight: 'bold',
          marginLeft: 4,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          backgroundColor: '#1a1a2e',
          padding: 24,
          borderRadius: 16,
          width: '80%',
          alignItems: 'center',
        },
        modalTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFF',
          marginBottom: 8,
        },
        modalDescription: {
          color: '#8B8B8B',
          textAlign: 'center',
          marginBottom: 20,
        },
        buyButton: {
          backgroundColor: '#00E5FF',
          paddingHorizontal: 40,
          paddingVertical: 12,
          borderRadius: 8,
          marginBottom: 12,
        },
        buyButtonText: {
          color: '#1a1a2e',
          fontSize: 16,
          fontWeight: 'bold',
        },
        closeButton: {
          paddingVertical: 8,
        },
        closeButtonText: {
          color: '#8B8B8B',
          fontSize: 14,
        },
      }),
    [width, itemWidth, unlockedItems, activeItems]
  );

  const renderItem = (item) => {
    const isUnlocked = unlockedItems.includes(item.id);
    const isActive = activeItems[activeCategory] === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemCard,
          !isUnlocked && styles.itemCardLocked,
          isActive && { borderWidth: 2, borderColor: '#00E5FF' },
        ]}
        onPress={() => {
          soundManager.play('tap');
          setSelectedItem(item);
          setShowPreview(true);
        }}
      >
        <LinearGradient
          colors={
            isActive
              ? ['#00E5FF40', '#FF6B9D40']
              : isUnlocked
              ? ['#00E5FF20', '#FF6B9D20']
              : ['#1a1a2e', '#16213e']
          }
          style={styles.itemGradient}
        >
          <View style={styles.itemPreview}>
            <Text style={{ fontSize: 40 }}>
              {/* 🔴 SAFE_EMOJI_PATCH: Never directly access emoji, always use safe fallback */}
              {item?.emoji ?? item?.icon ?? item?.character ?? (activeCategory === SHOP_CATEGORIES.THEMES ? '🎨' : '✨')}
            </Text>
          </View>

          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>

          {isUnlocked ? (
            <Text style={{ color: '#00FF00', fontWeight: 'bold' }}>OWNED</Text>
          ) : (
            <View style={styles.priceContainer}>
              <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
              <Text style={styles.priceText}>{item.price}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>🏪 Theme Shop</Text>

        <View style={styles.coinsContainer}>
          <Ionicons name="logo-bitcoin" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </LinearGradient>

      {/* CATEGORY TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.values(SHOP_CATEGORIES)
            .filter((cat) => cat !== SHOP_CATEGORIES.SOUNDS)
            .map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.tab, activeCategory === category && styles.tabActive]}
                onPress={() => {
                  soundManager.play('tap');
                  setActiveCategory(category);
                }}
              >
                <Text
                  style={[styles.tabText, activeCategory === category && styles.tabTextActive]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* ITEMS GRID */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsGrid}>{getCategoryItems(activeCategory).map(renderItem)}</View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* PREVIEW MODAL */}
      <Modal visible={showPreview} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                <Text style={styles.modalDescription}>{selectedItem.description}</Text>

                {unlockedItems.includes(selectedItem.id) ? (
                  <>
                    <Text style={{ color: '#00FF00', marginBottom: 20 }}>You already own this</Text>

                    {/* Activate Button */}
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => {
                        setActiveItem(selectedItem.id, activeCategory);
                        setShowPreview(false);
                      }}
                    >
                      <Text style={styles.buyButtonText}>Set Active</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => handlePurchase(selectedItem)}
                    >
                      <Text style={styles.buyButtonText}>Purchase</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPreview(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

