import React from 'react';
import { resolveBrandIcon } from '../lib/brandIcons';

/**
 * Renders an authentic platform brand logo on a sleek, premium black background.
 * Automatically resolves emoji strings or brand keys to official vector SVGs.
 */
export default function BrandIcon({
  iconKey,
  name = '',
  size = 44,
  iconSize = null,
  colorMode = 'brand', // 'brand' | 'white'
  className = '',
  style = {}
}) {
  const brand = resolveBrandIcon(iconKey || name);
  const IconComponent = brand.component;

  const actualIconSize = iconSize || Math.round(size * 0.54);
  const iconColor = colorMode === 'white' ? '#FFFFFF' : (brand.color || '#FFFFFF');

  return (
    <div
      className={`brand-icon-badge ${className}`}
      title={brand.name || name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        backgroundColor: '#0a0d14',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: `${Math.max(10, Math.round(size * 0.26))}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
        ...style
      }}
    >
      <IconComponent
        size={actualIconSize}
        style={{
          color: iconColor,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          display: 'block'
        }}
      />
    </div>
  );
}
