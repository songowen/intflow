import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  borderRadius?: number;
  style?: CSSProperties;
}

/** 범용 스켈레톤 블록 — shimmer 애니메이션은 index.css */
export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        background: '#e2e8f0',
        ...style,
      }}
    />
  );
}
