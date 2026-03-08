import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  const { width, height } = useWindowDimensions();
  const targetRatio = 9 / 16;
  const screenRatio = width / height;

  const isWiderThanTarget = screenRatio > targetRatio;
  const frameWidth = isWiderThanTarget ? height * targetRatio : width;
  const frameHeight = isWiderThanTarget ? height : width / targetRatio;

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.frame,
          {
            width: frameWidth,
            height: Math.min(frameHeight, height),
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});
