import React, { useState, useEffect } from 'react';
import { Search, Users, Sparkles, Filter, PlusCircle, Building2 } from 'lucide-react';
import { clubsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClubCard } from '../../components/cards/ClubCard';
import { CreateClubModal } from '../../components/modals/CreateClubModal';
import { FALLBACK_CLUBS } from '../../utils/fallbackData';

export const Clubs = () => {
  const { user, isOrganizer, isAdmin } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [createClubModalOpen, setCreateClubModalOpen] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await clubsAPI.getAll();
        const clubList = res.data?.results || res.data || [];
        setClubs(clubList.length > 0 ? clubList : FALLBACK_CLUBS);
      } catch (err) {
        console.warn('Backend connecting; loading NIT Andhra Pradesh clubs showcase.', err);
        setClubs(FALLBACK_CLUBS);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const categories = ['ALL', 'Department Associations', 'Technical', 'Cultural', 'Art & Painting', 'Photography', 'Music & Dance', 'Sports'];

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="badge badge-purple" style={{ marginBottom: 12 }}>
          NIT ANDHRA PRADESH • COMMUNITIES
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--dark-navy)' }}>
          Clubs & Department Associations
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '1.05rem', marginTop: 8, maxWidth: 620, margin: '8px auto 0 auto' }}>
          Explore departmental associations (ASCII, ECEA, MESA) and student societies (Coding Club, Kala, Swara, Pixel, Robotics, E-Cell) at NIT Andhra Pradesh.
        </p>
        {(isOrganizer || isAdmin) && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setCreateClubModalOpen(true)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <PlusCircle size={18} />
              + Launch a Club or Department Association
            </button>
          </div>
        )}
      </div>

      {/* Search & Category Tabs */}
      <div
        className="glass-panel"
        style={{
          padding: 20,
          background: '#FFFFFF',
          marginBottom: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--muted-text)" style={{ position: 'absolute', left: 16 }} />
          <input
            type="text"
            placeholder="Search clubs by name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 46px',
              borderRadius: 14,
              border: '1px solid var(--soft-border)',
              background: 'var(--bg-primary)',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: selectedCategory === cat ? 'var(--primary-purple)' : 'var(--bg-primary)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--muted-text)',
              }}
            >
              {cat === 'ALL' ? 'All Clubs' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted-text)' }}>
          Loading campus clubs...
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center', background: '#FFFFFF' }}>
          <Users size={48} color="var(--light-violet)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No clubs found</h3>
          <p style={{ color: 'var(--muted-text)', marginTop: 6 }}>Try clearing your search query or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 28 }}>
          {filteredClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onMembershipChange={(id, isJoined) => {
                setClubs((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? {
                          ...c,
                          is_joined: isJoined,
                          members_count: isJoined ? (c.members_count || 0) + 1 : Math.max(0, (c.members_count || 0) - 1),
                        }
                      : c
                  )
                );
              }}
            />
          ))}
        </div>
      )}

      {/* Create Club Modal */}
      {createClubModalOpen && (
        <CreateClubModal
          isOpen={createClubModalOpen}
          onClose={() => setCreateClubModalOpen(false)}
          onClubCreated={(newClub) => {
            setClubs((prev) => [newClub, ...prev]);
          }}
        />
      )}
    </div>
  );
};
