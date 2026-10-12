import React from 'react';
import { View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const SkeletonCard = () => {
  return (
    <SkeletonPlaceholder borderRadius={8}>
      <View style={{ marginBottom: 20, marginHorizontal: 15, padding: 15 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 29, height: 29, borderRadius: 15 }} />
            <View style={{ width: 120, height: 15, borderRadius: 4, marginLeft: 10 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10 }} />
            <View style={{ width: 20, height: 20, borderRadius: 10 }} />
          </View>
        </View>

        {/* Task Details */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ width: '80%', height: 12, marginBottom: 6 }} />
          <View style={{ width: '90%', height: 12, marginBottom: 6 }} />
          <View style={{ width: '60%', height: 12, marginBottom: 6 }} />
          <View style={{ width: '70%', height: 12 }} />
        </View>

        {/* Urgent dot */}
        <View style={{ width: 50, height: 12, marginBottom: 10 }} />

        {/* Horizontal scroll tags */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 60, height: 20, borderRadius: 10 }} />
          <View style={{ width: 60, height: 20, borderRadius: 10 }} />
          <View style={{ width: 80, height: 20, borderRadius: 10 }} />
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
          <View style={{ width: '45%', height: 35, borderRadius: 20 }} />
          <View style={{ width: '45%', height: 35, borderRadius: 20 }} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
};

export default SkeletonCard;
