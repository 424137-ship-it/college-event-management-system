import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Maximize2, Camera, Calendar, Plus, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { galleryAPI, BACKEND_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UploadGalleryModal } from '../../components/modals/UploadGalleryModal';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

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
    caption: 'Vulcanzy Pro-Night: Star Concert at Central OAT, NIT',
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
    caption: 'Industry Mentorship session for NIT engineering founders',
    event_title: 'E-Cell Venture Pitch',
  },
];

export const Gallery = () => {
  const { user, isOrganizer, isAdmin } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState('ALL');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
      console.warn('Backend connecting; serving fallback gallery for NIT.', err);
      setAlbums(FALLBACK_ALBUMS);
      setImages(FALLBACK_IMAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handlePhotoUploaded = (newImages, albumId) => {
    if (newImages && newImages.length > 0) {
      setImages((prev) => [...newImages, ...prev]);
    }
    // Refresh albums so new counts and album titles populate
    fetchGallery();
    if (albumId) {
      setSelectedAlbum(albumId);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to permanently delete this photo from the campus gallery?')) {
      return;
    }

    setDeletingId(photoId);
    try {
      await galleryAPI.deleteImage(photoId);
      setImages((prev) => prev.filter((img) => img.id !== photoId));
      if (lightboxImage?.id === photoId) {
        setLightboxImage(null);
      }
      toast.success('Photo removed from campus gallery.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete photo.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteImage = (img) => {
    if (!user || !img) return False;
    if (isAdmin) return true;
    if (img.can_delete) return true;
    return false;
  };

  const filteredImages = selectedAlbum === 'ALL'
    ? images
    : images.filter((img) => String(img.album) === String(selectedAlbum));

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Header & Organizer Upload Action */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 36 }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: 12 }}>
            MEMORIES & MOMENTS
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--dark-navy)', margin: '8px 0 6px 0' }}>
            Campus Memories Gallery
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '1.05rem', margin: 0, maxWidth: 600 }}>
            Official photo captures from hackathons, cultural festivals, sports championships, and club exhibitions.
          </p>
        </div>

        {/* Upload Action Button for Organizers / Admins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isOrganizer || isAdmin ? (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.28)',
                cursor: 'pointer',
              }}
            >
              <Camera size={18} />
              Upload Event Photos
            </button>
          ) : user ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="var(--primary-purple)" />
              Event organizers can upload photos for their events
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: { pathname: '/gallery' } }}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Camera size={16} />
              Organizer Sign In to Upload
            </Link>
          )}
        </div>
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
            cursor: 'pointer',
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
              cursor: 'pointer',
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No photos uploaded yet for this album</h3>
          <p style={{ color: 'var(--muted-text)', marginTop: 4 }}>
            {isOrganizer || isAdmin ? 'Click "Upload Event Photos" above to add the first highlights!' : 'Check back soon for event highlights!'}
          </p>
          {(isOrganizer || isAdmin) && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn-primary"
              style={{ marginTop: 18, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> Upload First Photo
            </button>
          )}
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
                src={img.display_url || img.image_url || (img.image ? `${BACKEND_URL}${img.image}` : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&fit=crop&q=80')}
                alt={img.caption || 'Event moment'}
                style={{
                  width: '100%',
                  display: 'block',
                  borderRadius: '20px 20px 0 0',
                }}
              />
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark-navy)', margin: 0 }}>
                  {img.caption || 'Campus memory'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                    {img.album_title || img.event_title || 'Campus Event'}
                  </span>
                  {canDeleteImage(img) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(img.id);
                      }}
                      title="Delete Photo"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
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
            zIndex: 1100,
            background: 'rgba(23, 21, 43, 0.92)',
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
            {/* Action Buttons Top */}
            <div style={{ position: 'absolute', top: -48, right: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
              {canDeleteImage(lightboxImage) && (
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(lightboxImage.id)}
                  disabled={deletingId === lightboxImage.id}
                  style={{
                    background: 'rgba(239, 68, 68, 0.85)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  {deletingId === lightboxImage.id ? 'Deleting...' : 'Delete Photo'}
                </button>
              )}

              <button
                onClick={() => setLightboxImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={lightboxImage.display_url || lightboxImage.image_url || (lightboxImage.image ? `${BACKEND_URL}${lightboxImage.image}` : '')}
              alt="Lightbox"
              style={{
                width: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: 16,
              }}
            />
            <div style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 14 }}>
              {lightboxImage.caption && (
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {lightboxImage.caption}
                </div>
              )}
              <div style={{ fontSize: '0.82rem', color: '#D8B4FE', marginTop: 4 }}>
                {lightboxImage.album_title || lightboxImage.event_title || 'Campus Event Highlights'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photos Modal for Organizers & Admins */}
      <UploadGalleryModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploaded={handlePhotoUploaded}
      />

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
