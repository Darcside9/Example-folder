import React, { useState, useMemo } from 'react';
import { BRAND_ICONS, searchBrandIcons, resolveBrandIcon } from '../lib/brandIcons';
import BrandIcon from './BrandIcon';

/**
 * BrandIconPicker: Searchable brand vector icon selector modal with live preview.
 */
export default function BrandIconPicker({
  selectedIcon,
  onSelect,
  isOpen,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(BRAND_ICONS.map(i => i.category));
    return ['All', ...Array.from(cats)];
  }, []);

  // Filtered icons
  const filteredIcons = useMemo(() => {
    let list = searchBrandIcons(searchQuery);
    if (activeCategory !== 'All') {
      list = list.filter(b => b.category === activeCategory);
    }
    return list;
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const currentSelection = resolveBrandIcon(selectedIcon);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #0b0f19, #131b2e)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔍 Search Authentic Platform Logo
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Official brand vector logos rendered on sleek black badges.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Search & Category Filter */}
        <div style={{ padding: '16px 20px 10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder="Search platform (e.g. iCloud, Apple, NordVPN, Facebook, Telegram)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#090d16',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none'
            }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: activeCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: activeCategory === cat ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 20px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '12px',
            alignContent: 'start'
          }}
        >
          {filteredIcons.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
              <p style={{ fontSize: '15px', marginBottom: '8px' }}>No brand logos found matching "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  cursor: 'pointer'
                }}
              >
                Show All Brands
              </button>
            </div>
          ) : (
            filteredIcons.map(brand => {
              const isSelected = currentSelection.id === brand.id;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => {
                    onSelect(brand.id);
                    onClose();
                  }}
                  style={{
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1.5px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    padding: '12px 8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <BrandIcon iconKey={brand.id} size={42} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#38bdf8' : '#cbd5e1',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      maxWidth: '100%'
                    }}
                  >
                    {brand.name}
                  </span>
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#38bdf8'
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer with current selection */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrandIcon iconKey={currentSelection.id} size={32} />
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Active Selection</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                {currentSelection.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
