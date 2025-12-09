import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { primaryColor } from './AGTools';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Base Skeleton component with shimmer animation
const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        shimmer.start();
        return () => shimmer.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[styles.skeletonBox, { width, height, borderRadius }, style]}>
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            />
        </View>
    );
};

// Skeleton for Upcoming Booking Card
export const UpcomingCardSkeleton = () => (
    <View style={skeletonStyles.upcomingCard}>
        <SkeletonBox width={70} height={70} borderRadius={12} />
        <View style={skeletonStyles.upcomingInfo}>
            <SkeletonBox width={120} height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width={150} height={12} style={{ marginBottom: 6 }} />
            <SkeletonBox width={100} height={12} style={{ marginBottom: 6 }} />
            <SkeletonBox width={80} height={12} />
        </View>
    </View>
);

// Skeleton for Upcoming Section (multiple cards)
export const UpcomingSkeleton = ({ count = 2 }) => (
    <View style={skeletonStyles.horizontalList}>
        {[...Array(count)].map((_, index) => (
            <UpcomingCardSkeleton key={index} />
        ))}
    </View>
);

// Skeleton for Banner
export const BannerSkeleton = () => (
    <View style={skeletonStyles.bannerSection}>
        <View style={skeletonStyles.bannerWrapper}>
            <SkeletonBox 
                width={SCREEN_WIDTH - 40} 
                height={183} 
                borderRadius={12} 
            />
            <View style={skeletonStyles.paginationSkeleton}>
                <SkeletonBox width={20} height={8} borderRadius={4} style={{ marginRight: 6 }} />
                <SkeletonBox width={8} height={8} borderRadius={4} style={{ marginRight: 6 }} />
                <SkeletonBox width={8} height={8} borderRadius={4} />
            </View>
        </View>
    </View>
);

// Skeleton for My Shop item (circular logo + name)
export const MyShopItemSkeleton = () => (
    <View style={skeletonStyles.shopItem}>
        <SkeletonBox width={88} height={88} borderRadius={44} />
        <SkeletonBox width={60} height={12} style={{ marginTop: 8 }} />
    </View>
);

// Skeleton for My Shop Section
export const MyShopSkeleton = ({ count = 3 }) => (
    <View style={skeletonStyles.horizontalList}>
        {[...Array(count)].map((_, index) => (
            <MyShopItemSkeleton key={index} />
        ))}
    </View>
);

// Skeleton for Gift Card
export const GiftCardSkeleton = () => (
    <View style={skeletonStyles.giftCard}>
        <View style={skeletonStyles.giftIconContainer}>
            <SkeletonBox width={40} height={40} borderRadius={20} />
        </View>
        <View style={skeletonStyles.giftInfo}>
            <SkeletonBox width={80} height={12} style={{ marginBottom: 6 }} />
            <SkeletonBox width={100} height={16} style={{ marginBottom: 4 }} />
            <SkeletonBox width={60} height={10} />
        </View>
    </View>
);

// Skeleton for My Gifts Section
export const MyGiftsSkeleton = ({ count = 2 }) => (
    <View style={skeletonStyles.horizontalList}>
        {[...Array(count)].map((_, index) => (
            <GiftCardSkeleton key={index} />
        ))}
    </View>
);

// Skeleton for Trending Card (Beauty)
export const TrendingCardSkeleton = () => (
    <View style={skeletonStyles.trendingCard}>
        <SkeletonBox width={180} height={120} borderRadius={12} style={{ marginBottom: 10 }} />
        <View style={skeletonStyles.trendingInfo}>
            <SkeletonBox width={140} height={14} style={{ marginBottom: 6 }} />
            <SkeletonBox width={120} height={12} style={{ marginBottom: 6 }} />
            <SkeletonBox width={100} height={12} style={{ marginBottom: 8 }} />
            <SkeletonBox width={70} height={22} borderRadius={6} />
        </View>
    </View>
);

// Skeleton for Beauty Trending Section
export const TrendingSkeleton = ({ count = 2 }) => (
    <View style={skeletonStyles.horizontalList}>
        {[...Array(count)].map((_, index) => (
            <TrendingCardSkeleton key={index} />
        ))}
    </View>
);

// Generic Section Skeleton (header + content)
export const SectionSkeleton = ({ children, title = true }) => (
    <View style={skeletonStyles.section}>
        {title && (
            <View style={skeletonStyles.sectionHeader}>
                <SkeletonBox width={120} height={18} />
            </View>
        )}
        {children}
    </View>
);

const styles = StyleSheet.create({
    skeletonBox: {
        backgroundColor: '#E8E8E8',
        overflow: 'hidden',
    },
    shimmer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F5F5',
        opacity: 0.5,
    },
});

const skeletonStyles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    horizontalList: {
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    
    // Upcoming
    upcomingCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        width: 243,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    upcomingInfo: {
        marginLeft: 12,
        flex: 1,
        justifyContent: 'center',
    },
    
    // Banner
    bannerSection: {
        marginBottom: 24,
    },
    bannerWrapper: {
        marginHorizontal: 20,
        position: 'relative',
    },
    paginationSkeleton: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
    },
    
    // My Shop
    shopItem: {
        alignItems: 'center',
        marginRight: 16,
    },
    
    // Gifts
    giftCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        width: 180,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    giftIconContainer: {
        marginRight: 10,
    },
    giftInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    
    // Trending
    trendingCard: {
        width: 180,
        marginRight: 12,
    },
    trendingInfo: {
        paddingHorizontal: 4,
    },
});

export default {
    UpcomingSkeleton,
    BannerSkeleton,
    MyShopSkeleton,
    MyGiftsSkeleton,
    TrendingSkeleton,
    SectionSkeleton,
};

