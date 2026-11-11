import React, { useState, useEffect, useRef } from 'react';
import {
  X, UploadCloud, Link as LinkIcon, Image as ImageIcon,
  CheckCircle2, AlertCircle, Loader2, Sparkles, Plus, Trash2
} from 'lucide-react';
import { galleryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

export const UploadGalleryModal = ({ isOpen, onClose, onUploaded, initialEventId = null }) => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Prevent background scrolling while open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Load organizer's events
  useEffect(() => {
    if (!isOpen) return;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await galleryAPI.getUploadableEvents();
        const list = res.data || [];
        setEvents(list);
        if (list.length > 0) {
          if (initialEventId && list.some((e) => String(e.id) === String(initialEventId))) {
            setSelectedEventId(String(initialEventId));
          } else {
            setSelectedEventId(String(list[0].id));
          }
        }
      } catch (err) {
        console.warn('Could not fetch uploadable events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [isOpen, initialEventId]);

  // Handle selected files & generate previews
  const handleFilesSelected = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      toast.error('Please select valid image files (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const combined = [...files, ...valid];
    setFiles(combined);

    const urls = combined.map((f) => URL.createObjectURL(f));
    // Clean up old preview URLs
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls(urls);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(updatedUrls);
  };

  // Drag and Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event to upload photos for.');
      return;
    }

    if (uploadMode === 'file' && files.length === 0) {
      toast.error('Please choose at least one image file to upload.');
      return;
    }

    if (uploadMode === 'url' && !imageUrl.trim()) {
      toast.error('Please enter a valid image web URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('event_id', selectedEventId);
      if (caption.trim()) formData.append('caption', caption.trim());

      if (uploadMode === 'file') {
        files.forEach((f) => {
          formData.append('images', f);
        });
      } else {
        formData.append('image_url', imageUrl.trim());
      }

      const res = await galleryAPI.uploadImage(formData);
      toast.success(res.data.message || 'Photos uploaded successfully to campus gallery!');
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#8B9DFF', '#10B981', '#F59E0B'],
      });

      if (onUploaded) {
        onUploaded(res.data.images || [], res.data.album_id);
      }

      // Cleanup
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setFiles([]);
      setPreviewUrls([]);
      setImageUrl('');
      setCaption('');
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to upload photo. Please check your inputs.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(23, 21, 43, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#FFFFFF',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 25px 60px rgba(23, 21, 43, 0.25)',
          border: '1.5px solid var(--soft-border)',
          position: 'relative',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-primary)',
            border: '1px solid var(--soft-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--dark-navy)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', fontSize: '0.78rem', fontWeight: 800, marginBottom: 8 }}>
            <Sparkles size={14} /> ORGANIZER GALLERY PORTAL
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-navy)', margin: '0 0 6px 0' }}>
            Upload Event Photos
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted-text)', lineHeight: 1.5 }}>
            Upload official photo captures, highlights, and memories for events that you organize.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          {/* 1. Event Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 8 }}>
              Select Your Event <span style={{ color: '#EF4444' }}>*</span>
            </label>
            {loadingEvents ? (
              <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-primary)', fontSize: '0.85rem', color: 'var(--muted-text)' }}>
                Loading your organized events...
              </div>
            ) : events.length === 0 ? (
              <div style={{ padding: 14, borderRadius: 14, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#B45309', fontSize: '0.86rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>You do not currently lead or organize any registered events. Only event presidents or administrators can post official event photos.</span>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1.5px solid var(--soft-border)',
                  background: 'var(--bg-primary)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--dark-navy)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} • {ev.club_name} ({ev.start_date})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Upload Source Mode Tabs */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 8 }}>
              Upload Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, background: 'var(--bg-primary)', borderRadius: 12 }}>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: uploadMode === 'file' ? '#FFFFFF' : 'transparent',
                  color: uploadMode === 'file' ? 'var(--primary-purple)' : 'var(--muted-text)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: uploadMode === 'file' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <UploadCloud size={16} /> Device Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: uploadMode === 'url' ? '#FFFFFF' : 'transparent',
                  color: uploadMode === 'url' ? 'var(--primary-purple)' : 'var(--muted-text)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: uploadMode === 'url' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <LinkIcon size={16} /> Image Web URL
              </button>
            </div>
          </div>

          {/* 3. Upload Zone or URL Input */}
          {uploadMode === 'file' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(e.target.files);
                }}
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: dragActive ? '2px dashed var(--primary-purple)' : '2px dashed #D8B4FE',
                  borderRadius: 18,
                  background: dragActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(243, 238, 255, 0.4)',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    color: 'var(--primary-purple)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)',
                  }}
                >
                  <UploadCloud size={26} />
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                  Click to select photos or drag & drop
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-text)' }}>
                  PNG, JPG, JPEG or WEBP (Multiple photos supported)
                </p>
              </div>

              {/* Thumbnails preview */}
              {previewUrls.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                      Selected Photos ({previewUrls.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        previewUrls.forEach((u) => URL.revokeObjectURL(u));
                        setFiles([]);
                        setPreviewUrls([]);
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                    {previewUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative', height: 80, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--soft-border)' }}>
                        <img src={url} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(i);
                          }}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'rgba(23, 21, 43, 0.75)',
                            color: '#FFFFFF',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--dark-navy)', marginBottom: 6 }}>
                Direct Image Web URL (HTTPS)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or cloud image link"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1.5px solid var(--soft-border)',
                  background: 'var(--bg-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              {imageUrl.trim() && (
                <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', height: 160, border: '1px solid var(--soft-border)' }}>
                  <img
                    src={imageUrl.trim()}
                    alt="URL preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 4. Caption Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: 6 }}>
              Photo Caption / Moment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Prize Distribution Ceremony, Live Band performance, RoboWars Arena"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={250}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 14,
                border: '1.5px solid var(--soft-border)',
                background: 'var(--bg-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--muted-text)', display: 'block', marginTop: 4 }}>
              This will be displayed beneath your photo in the public gallery and lightbox.
            </span>
          </div>

          {/* Footer Submit Button */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 16, borderTop: '1px solid var(--soft-border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || events.length === 0}
              className="btn-primary"
              style={{ flex: 1.5, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Uploading Photos...
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  {uploadMode === 'file' && files.length > 1
                    ? `Upload ${files.length} Photos`
                    : 'Publish to Gallery'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
