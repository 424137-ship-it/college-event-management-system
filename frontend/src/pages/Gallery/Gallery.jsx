import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Maximize2, Camera, Calendar } from 'lucide-react';
import { galleryAPI, BACKEND_URL } from '../../services/api';

const FALLBACK_ALBUMS = [
  { id: 1, title: 'Vulcanzy Socio-Cultural Fest' },
  { id: 2, title: 'ASCII CodeSprint Hackathon' },
  { id: 3, title: 'Technodaya Tech Expo' },
  { id: 4, title: 'Kala Utsav Fine Arts' },
];

const FALLBACK_IMAGES = [
  {
    id: 1,
    album: 1,
    image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&fit=crop&q=80',
    caption: 'Vulcanzy Pro-Night: Star Concert at Central OAT, NIT AP',
    event_title: 'Vulcanzy 2026',
  },
  {
    id: 2,
    album: 2,
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&fit=crop&q=80',
    caption: 'ASCII 24H CodeSprint: Teams debugging algorithmic problems in Labs',
    event_title: 'ASCII CodeSprint 2026',
  },
  {
    id: 3,
    album: 1,
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&fit=crop&q=80',
    caption: 'Vulcanzy Choreography Battle: Electrifying live dance performance',
    event_title: 'Step Up - Dance Night',
  },
  {
    id: 4,
    album: 3,
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&fit=crop&q=80',
    caption: 'Technodaya: Autonomous Combat Bot testing in the arena',
    event_title: 'RoboWars 2026',
  },
  {
    id: 5,
    album: 4,
    image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&fit=crop&q=80',
    caption: 'Kala Utsav: Canvas painting and charcoal sketching exhibition at SAC',
    event_title: 'Kala Kriti Exhibition',
  },
  {
    id: 6,
    album: 2,
    image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&fit=crop&q=80',
    caption: 'Industry Mentorship session for NIT AP engineering founders',
    event_title: 'E-Cell Venture Pitch',
  },
];

export const Gallery = () => {
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState('ALL');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const [albumRes, imageRes] = await Promise.all([
          galleryAPI.getAlbums().catch(() => ({ data: [] })),
          galleryAPI.getImages().catch(() => ({ data: [] })),
        ]);
        const albumList = albumRes.data?.results || albumRes.data || [];
        const imageList = imageRes.data?.results || imageRes.data || [];
        setAlbums(albumList.length > 0 ? albumList : FALLBACK_ALBUMS);
        setImages(imageList.length > 0 ? imageList : FALLBACK_IMAGES);
      } catch (err) {
        console.warn('Backend connecting; serving fallback gallery for NIT AP.', err);
        setAlbums(FALLBACK_ALBUMS);
        setImages(FALLBACK_IMAGES);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredImages = selectedAlbum === 'ALL'
    ? images
    : images.filter((img) => String(img.album) === String(selectedAlbum));

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="badge badge-purple" style={{ marginBottom: 12 }}>
          MEMORIES & MOMENTS
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--dark-navy)' }}>
          Campus Memories Gallery
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '1.05rem', marginTop: 8, maxWidth: 560, margin: '8px auto 0 auto' }}>
          Explore vibrant photo captures from hackathons, cultural festivals, sports meets, and club showcases.
        </p>
      </div>

      {/* Album Filter Buttons */}
      <div
        className="glass-panel"
        style={{
          padding: 16,
          background: '#FFFFFF',
          marginBottom: 36,
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setSelectedAlbum('ALL')}
          style={{
            padding: '8px 18px',
            borderRadius: 9999,
            fontSize: '0.88rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            background: selectedAlbum === 'ALL' ? 'var(--primary-purple)' : 'var(--bg-primary)',
            color: selectedAlbum === 'ALL' ? '#FFFFFF' : 'var(--muted-text)',
            border: 'none',
          }}
        >
          All Memories ({images.length})
        </button>
        {albums.map((alb) => (
          <button
            key={alb.id}
            onClick={() => setSelectedAlbum(alb.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              fontSize: '0.88rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: String(selectedAlbum) === String(alb.id) ? 'var(--primary-purple)' : 'var(--bg-primary)',
              color: String(selectedAlbum) === String(alb.id) ? '#FFFFFF' : 'var(--muted-text)',
              border: 'none',
            }}
          >
            {alb.title}
          </button>
        ))}
      </div>

      {/* Masonry Image Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted-text)' }}>
          Loading photos...
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center', background: '#FFFFFF' }}>
          <ImageIcon size={48} color="var(--light-violet)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No photos uploaded yet</h3>
          <p style={{ color: 'var(--muted-text)', marginTop: 4 }}>Check back after upcoming events!</p>
        </div>
      ) : (
        <div
          style={{
            columnCount: 3,
            columnGap: 24,
          }}
          className="masonry-grid"
        >
          {filteredImages.map((img) => (
            <div
              key={img.id}
              onClick={() => setLightboxImage(img)}
              className="glass-panel glass-panel-hover"
              style={{
                marginBottom: 24,
                breakInside: 'avoid',
                overflow: 'hidden',
                borderRadius: 20,
                cursor: 'pointer',
                position: 'relative',
                background: '#FFFFFF',
              }}
            >
              <img
                src={img.image_url || (img.image ? `${BACKEND_URL}${img.image}` : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&fit=crop&q=80')}
                alt={img.caption || 'Event moment'}
                style={{
                  width: '100%',
                  display: 'block',
                  borderRadius: '20px 20px 0 0',
                }}
              />
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark-navy)' }}>
                  {img.caption || 'Campus memory'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 2 }}>
                  {img.album_title}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(23, 21, 43, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: 900, width: '100%', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: -44,
                right: 0,
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={lightboxImage.image_url || (lightboxImage.image ? `${BACKEND_URL}${lightboxImage.image}` : '')}
              alt="Lightbox"
              style={{
                width: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 16,
              }}
            />
            {lightboxImage.caption && (
              <div style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 12, fontSize: '1rem', fontWeight: 600 }}>
                {lightboxImage.caption}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .masonry-grid { column-count: 2 !important; }
        }
        @media (max-width: 600px) {
          .masonry-grid { column-count: 1 !important; }
        }
      `}</style>
    </div>
  );
};
