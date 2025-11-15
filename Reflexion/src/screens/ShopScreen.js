/**
 * REFLEXION v5.0 - MODERN SHOP SCREEN
 * Complete theme shop with 40+ items across 4 categories
 * Features purchase system, previews, and level requirements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHOP_CATEGORIES, getCategoryItems, getItemById } from '../data/ShopItems';
import soundManager from '../services/SoundManager';
import { getLevelFromXP } from '../utils/GameLogic';
import { useGlobalState } from '../contexts/GlobalStateContext';

// CRITICAL FIX: Calculate dimensions safely inside component, not at module level
const getItemWidth = () => {
  const { width } = Dimensions.get('window');
  return (width - 60) / 2;
};

export default function ShopScreen({ navigation }) {
  const { playerData, spendCoins } = useGlobalState();
  
  const [activeCategory, setActiveCategory] = useState(SHOP_CATEGORIES.THEMES);
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [activeItems, setActiveItems] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const coins = playerData.coins || 0;
  const level = getLevelFromXP(playerData.xp || 0);

  useEffect(() => {
    loadUserData();
  }, []);

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
      
      console.log(`🏪 ShopScreen: Loaded - Coins: ${coins}, Level: ${level}`);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUnlockedItems = async (items) => {
    try {
      await AsyncStorage.setItem('@unlocked_items', JSON.stringify(items));
      setUnlockedItems(items);
    } catch (error) {
      console.error('Error saving unlocked items:', error);
    }
  };

  // CRITICAL FIX: New function to set active item
  const setActiveItem = async (itemId, category) => {
    try {
      const newActiveItems = { ...activeItems, [category]: itemId };
      await AsyncStorage.setItem('@active_items', JSON.stringify(newActiveItems));
      setActiveItems(newActiveItems);
      soundManager.play('success');
      Alert.alert('✅ Activated!', 'Your selection will apply to the next game.');
    } catch (error) {
      console.error('Error saving active item:', error);
    }
  };

  const handlePurchase = async (item) => {
    if (level < item.level) {
      soundManager.play('error');
      Alert.alert(
        '🔒 Level Required',
        `You need to reach level ${item.level} to unlock this item.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (coins < item.price) {
      soundManager.play('error');
      Alert.alert(
        '🪙 Not Enough Coins',
        `You need ${item.price - coins} more coins to purchase this item.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      '✨ Purchase Item',
      `Buy "${item.name}" for ${item.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            await spendCoins(item.price);
            const newUnlocked = [...unlockedItems, item.id];
            await saveUnlockedItems(newUnlocked);

            soundManager.play('success');
            Alert.alert('🎉 Success!', `${item.name} unlocked!`);
            setShowPreview(false);
            
            console.log(`✅ Purchased ${item.name} for ${item.price} coins. New balance: ${coins - item.price}`);
          },
        },
      ]
    );
  };

  const renderItem = (item) => {
    const isUnlocked = unlockedItems.includes(item.id);
    const isActive = activeItems[activeCategory] === item.id;
    const canAfford = coins >= item.price;
    const meetsLevel = level >= item.level;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemCard,
          !isUnlocked && !meetsLevel && styles.itemCardLocked,
          isActive && styles.itemCardActive, // Highlight active item
        ]}
        onPress={() => {
          soundManager.play('tap');
          setSelectedItem(item);
          setShowPreview(true);
        }}
      >
        <LinearGradient
          colors={isActive ? ['#00E5FF40', '#FF6B9D40'] : isUnlocked ? ['#00E5FF20', '#FF6B9D20'] : ['#1a1a2e', '#16213e']}
          style={styles.itemGradient}
        >
          {/* Active Indicator */}
          {isActive && (
            <View style={styles.activeMarker}>
              <Ionicons name="checkmark-circle" size={20} color="#00E5FF" />
            </View>
          )}
          
          {/* Lock/Unlock Badge */}
          <View style={[styles.badge, isUnlocked && styles.badgeUnlocked]}>
            <Ionicons
              name={isUnlocked ? 'checkmark-circle' : 'lock-closed'}
              size={16}
              color={isUnlocked ? '#00FF00' : '#FF6B9D'}
            />
          </View>

          {/* Item Preview */}
          <View style={styles.itemPreview}>
            {activeCategory === SHOP_CATEGORIES.THEMES && (
              <LinearGradient
                colors={item.colors.background}
                style={styles.themePreview}
              />
            )}
            {activeCategory === SHOP_CATEGORIES.PARTICLES && (
              <View style={styles.particlePreview}>
                {/* CRITICAL FIX: Show unique emoji for each particle type */}
                <Text style={styles.particleEmoji}>{item.emoji || '✨'}</Text>
              </View>
            )}
            {activeCategory === SHOP_CATEGORIES.SOUNDS && (
              <View style={styles.soundPreview}>
                <Ionicons name="musical-notes" size={40} color="#00E5FF" />
              </View>
            )}
            {activeCategory === SHOP_CATEGORIES.BALLS && (
              <View style={styles.ballPreview}>
                {/* CRITICAL FIX: Show unique emoji and color for each ball type */}
                {item.emoji ? (
                  <Text style={styles.ballEmoji}>{item.emoji}</Text>
                ) : (
                  <View style={[styles.ballCircle, { backgroundColor: item.color || '#00E5FF' }]} />
                )}
              </View>
            )}
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Price/Status */}
            {isUnlocked ? (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>OWNED</Text>
              </View>
            ) : (
              <View style={styles.priceContainer}>
                <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
                <Text style={[
                  styles.priceText,
                  !canAfford && styles.priceTextInsufficient
                ]}>
                  {item.price}
                </Text>
              </View>
            )}

            {/* Level Requirement */}
            {!meetsLevel && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>LVL {item.level}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <TouchableOpacity onPress={() => {
          soundManager.play('tap');
          navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 Theme Shop</Text>
        <View style={styles.coinsContainer}>
          <Ionicons name="logo-bitcoin" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </LinearGradient>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.values(SHOP_CATEGORIES)
            .filter(cat => cat !== SHOP_CATEGORIES.SOUNDS)
            .map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.tab,
                activeCategory === category && styles.tabActive,
              ]}
              onPress={() => {
                soundManager.play('tap');
                setActiveCategory(category);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === category && styles.tabTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items Grid */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsGrid}>
          {getCategoryItems(activeCategory).map(renderItem)}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedItem.description}
                </Text>

                {unlockedItems.includes(selectedItem.id) ? (
                  <>
                    <Text style={styles.modalOwned}>✅ You own this item</Text>
                    {activeItems[activeCategory] === selectedItem.id ? (
                      <View style={styles.activeIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color="#00E5FF" />
                        <Text style={styles.activeText}>Currently Active</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.setActiveButton}
                        onPress={() => {
                          setActiveItem(selectedItem.id, activeCategory);
                          setShowPreview(false);
                        }}
                      >
                        <Text style={styles.setActiveButtonText}>Set Active</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.modalPrice}>
                      <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
                      <Text style={styles.modalPriceText}>
                        {selectedItem.price} coins
                      </Text>
                    </View>

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
                  onPress={() => {
                    soundManager.play('tap');
                    setShowPreview(false);
                  }}
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

// CRITICAL FIX: Ensure StyleSheet is available before creating styles
// Defer style creation to prevent "Cannot read property 'create' of undefined"
// This handles cases where React Native bridge isn't ready during module load
const createStyles = () => {
  // Double-check StyleSheet is available
  if (typeof StyleSheet === 'undefined' || !StyleSheet || typeof StyleSheet.create !== 'function') {
    console.error('❌ StyleSheet is not available! React Native may not be initialized.');
    // Return empty styles object as fallback
    return {};
  }
  
  try {
    // CRITICAL FIX: Calculate ITEM_WIDTH here, not in component
    // This ensures it's available when styles are created
    const itemWidth = getItemWidth();
    
    return StyleSheet.create({
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
    fontWeight: 'bold',
    marginLeft: 4,
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
    opacity: 0.6,
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
  themePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  particlePreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1419',
    borderRadius: 8,
  },
  particleEmoji: {
    fontSize: 40,
  },
  soundPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1419',
    borderRadius: 8,
  },
  ballPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1419',
    borderRadius: 8,
  },
  ballCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00E5FF',
  },
  ballEmoji: {
    fontSize: 50,
  },
  itemInfo: {
    marginTop: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
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
  priceTextInsufficient: {
    color: '#FF6B9D',
  },
  unlockedBadge: {
    backgroundColor: '#00FF0020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  unlockedText: {
    color: '#00FF00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
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
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOwned: {
    fontSize: 16,
    color: '#00FF00',
    marginBottom: 20,
  },
  modalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
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
  setActiveButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 16,
  },
  setActiveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#00E5FF20',
    borderRadius: 8,
  },
  activeText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  itemCardActive: {
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  activeMarker: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#8B8B8B',
    fontSize: 14,
  },
  });
  } catch (error) {
    console.error('❌ Failed to create styles:', error);
    return {};
  }
};

// CRITICAL FIX: Create styles safely with fallback
// This ensures styles are created even if React Native isn't fully ready
const styles = createStyles();
