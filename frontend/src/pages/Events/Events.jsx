import React, { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, List, SlidersHorizontal, Calendar, MapPin, X, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { eventsAPI } from '../../services/api';
import { EventCard } from '../../components/cards/EventCard';
import { FALLBACK_EVENTS, FALLBACK_CATEGORIES, FALLBACK_VENUES } from '../../utils/fallbackData';

export const Events = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [timeframe, setTimeframe] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, venRes] = await Promise.all([
          eventsAPI.getCategories().catch(() => ({ data: [] })),
          eventsAPI.getVenues().catch(() => ({ data: [] })),
        ]);
        const catList = catRes.data?.results || catRes.data || [];
        setCategories(catList.length > 0 ? catList : FALLBACK_CATEGORIES);

        const venList = venRes.data?.results || venRes.data || [];
        setVenues(venList.length > 0 ? venList : FALLBACK_VENUES);
      } catch (err) {
        setCategories(FALLBACK_CATEGORIES);
        setVenues(FALLBACK_VENUES);
      }
    };
    loadMetadata();
  }, []);

  const getFilteredFallbackEvents = (cat, ven, query, tf) => {
    let list = [...FALLBACK_EVENTS];
    const today = new Date().toISOString().split('T')[0];

    if (tf === 'upcoming') {
      list = list.filter((e) => {
        const s = e.start_date ? e.start_date.split('T')[0] : '';
        return s > today && e.status !== 'COMPLETED';
      });
    } else if (tf === 'ongoing') {
      list = list.filter((e) => {
        const s = e.start_date ? e.start_date.split('T')[0] : '';
        const end = (e.end_date || e.start_date) ? (e.end_date || e.start_date).split('T')[0] : '';
        return s <= today && end >= today && e.status !== 'COMPLETED';
      });
    } else if (tf === 'completed' || tf === 'past') {
      list = list.filter((e) => {
        const end = (e.end_date || e.start_date) ? (e.end_date || e.start_date).split('T')[0] : '';
        return (end && end < today) || e.status === 'COMPLETED';
      });
    }

    if (cat) {
      list = list.filter((e) =>
        e.category?.toLowerCase() === cat.toLowerCase() ||
        e.category_name?.toLowerCase() === cat.toLowerCase()
      );
    }
    if (ven) {
      list = list.filter((e) => e.venue_name?.toLowerCase().includes(ven.toLowerCase()));
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((e) =>
        e.title?.toLowerCase().includes(q) ||
        e.short_description?.toLowerCase().includes(q) ||
        e.club_name?.toLowerCase().includes(q)
      );
    }
    return list;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = {
          ordering: sortBy,
        };
        if (selectedCategory) params.category = selectedCategory;
        if (selectedVenue) params.venue = selectedVenue;
        if (timeframe) params.timeframe = timeframe;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await eventsAPI.getAll(params);
        const results = res.data?.results || res.data || [];
        if (results.length > 0) {
          setEvents(results);
        } else {
          setEvents(getFilteredFallbackEvents(selectedCategory, selectedVenue, searchQuery, timeframe));
        }
      } catch (err) {
        console.warn('Backend connecting; serving fallback events for NIT campus.', err);
        setEvents(getFilteredFallbackEvents(selectedCategory, selectedVenue, searchQuery, timeframe));
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedVenue, timeframe, searchQuery, sortBy]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <span className="badge badge-purple" style={{ marginBottom: 12 }}>
          CAMPUS EXPERIENCES
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--dark-navy)' }}>
          Find Your Next Campus Experience
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '1.05rem', marginTop: 8, maxWidth: 600, margin: '8px auto 0 auto' }}>
          Discover competitions, tech hackathons, workshops, and fests happening all across campus.
        </p>
      </div>

      {/* Main Status Segment Tabs (Upcoming / Ongoing / Completed / All) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <div
          className="glass-panel"
          style={{
            display: 'inline-flex',
            padding: 6,
            background: '#FFFFFF',
            borderRadius: 20,
            boxShadow: '0 4px 20px rgba(23, 21, 43, 0.06)',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setTimeframe('upcoming')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 14,
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              background: timeframe === 'upcoming' ? 'var(--primary-purple)' : 'transparent',
              color: timeframe === 'upcoming' ? '#FFFFFF' : 'var(--muted-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: timeframe === 'upcoming' ? '0 4px 12px rgba(168, 85, 247, 0.35)' : 'none',
            }}
          >
            <Sparkles size={16} />
            Upcoming Events
          </button>

          <button
            onClick={() => setTimeframe('ongoing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 14,
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              background: timeframe === 'ongoing' ? '#EF4444' : 'transparent',
              color: timeframe === 'ongoing' ? '#FFFFFF' : 'var(--muted-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: timeframe === 'ongoing' ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: timeframe === 'ongoing' ? '#FFFFFF' : '#EF4444',
                animation: 'pulse 1.5s infinite',
              }}
            />
            Live & Ongoing
          </button>

          <button
            onClick={() => setTimeframe('completed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 14,
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              background: (timeframe === 'completed' || timeframe === 'past') ? '#1F2937' : 'transparent',
              color: (timeframe === 'completed' || timeframe === 'past') ? '#FFFFFF' : 'var(--muted-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (timeframe === 'completed' || timeframe === 'past') ? '0 4px 12px rgba(31, 41, 55, 0.35)' : 'none',
            }}
          >
            <CheckCircle2 size={16} />
            Completed Events
          </button>

          <button
            onClick={() => setTimeframe('')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 14,
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              background: timeframe === '' ? 'var(--dark-navy)' : 'transparent',
              color: timeframe === '' ? '#FFFFFF' : 'var(--muted-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: timeframe === '' ? '0 4px 12px rgba(23, 21, 43, 0.25)' : 'none',
            }}
          >
            <Calendar size={16} />
            All Events
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        className="glass-panel"
        style={{
          padding: 20,
          background: '#FFFFFF',
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Top search input */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={18}
              color="var(--muted-text)"
              style={{ position: 'absolute', left: 16 }}
            />
            <input
              type="text"
              placeholder="Search by event title, description, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 46px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--soft-border)',
                background: 'var(--bg-primary)',
                fontSize: '0.95rem',
                color: 'var(--dark-navy)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  background: 'transparent',
                  color: 'var(--muted-text)',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Grid/List View Toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-primary)', padding: 4, borderRadius: 12 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? 'var(--primary-purple)' : 'var(--muted-text)',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary-purple)' : 'var(--muted-text)',
                boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Timeframe Filter */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--soft-border)',
                background: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--dark-navy)',
              }}
            >
              <option value="upcoming">✨ Upcoming Events</option>
              <option value="ongoing">🔴 Live & Ongoing</option>
              <option value="completed">🏁 Completed Events</option>
              <option value="">🌐 All Events</option>
            </select>

            {/* Venue Filter */}
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--soft-border)',
                background: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--dark-navy)',
              }}
            >
              <option value="">All Venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--soft-border)',
                background: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--dark-navy)',
              }}
            >
              <option value="start_date">Date: Earliest First</option>
              <option value="-start_date">Date: Latest First</option>
              <option value="-max_participants">Largest Capacity</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--muted-text)', fontWeight: 600 }}>
            Showing {events.length} event{events.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 6,
            borderTop: '1px solid var(--soft-border)',
            paddingTop: 16,
          }}
        >
          <button
            onClick={() => setSelectedCategory('')}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: selectedCategory === '' ? 'var(--primary-purple)' : 'var(--bg-primary)',
              color: selectedCategory === '' ? '#FFFFFF' : 'var(--muted-text)',
              border: 'none',
            }}
          >
            All Events
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: selectedCategory === cat.id ? 'var(--primary-purple)' : 'var(--bg-primary)',
                color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--muted-text)',
                border: 'none',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid / List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted-text)' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E9E1F7', borderTopColor: '#A855F7', borderRadius: '50%', margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
          Loading campus events...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', background: '#FFFFFF' }}>
          <Calendar size={48} color="var(--light-violet)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
            No events found matching your criteria
          </h3>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 8 }}>
            Try adjusting your search terms, categories, or filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedVenue('');
              setTimeframe('');
              setSearchQuery('');
            }}
            className="btn-primary"
            style={{ marginTop: 20 }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              viewMode === 'grid'
                ? 'repeat(auto-fill, minmax(280px, 1fr))'
                : '1fr',
            gap: 28,
          }}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
