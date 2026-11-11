import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, ArrowRight, LayoutGrid, List
} from 'lucide-react';
import { eventsAPI } from '../../services/api';
import { FALLBACK_EVENTS } from '../../utils/fallbackData';

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('month'); // month or list
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setLoading(true);
      try {
        const res = await eventsAPI.getCalendar({ year, month: month + 1 });
        const list = res.data?.results || res.data || [];
        const finalEvents = list.length > 0 ? list : FALLBACK_EVENTS.map((e) => ({
          ...e,
          start_date: e.start_date.split('T')[0],
          end_date: e.end_date.split('T')[0],
        }));
        setEvents(finalEvents);

        // Filter events for selectedDateStr
        const onDay = finalEvents.filter((e) => e.start_date === selectedDateStr);
        setSelectedDayEvents(onDay);
      } catch (err) {
        console.warn('Backend connecting; serving fallback calendar data for NIT.', err);
        const finalEvents = FALLBACK_EVENTS.map((e) => ({
          ...e,
          start_date: e.start_date.split('T')[0],
          end_date: e.end_date.split('T')[0],
        }));
        setEvents(finalEvents);
        const onDay = finalEvents.filter((e) => e.start_date === selectedDateStr);
        setSelectedDayEvents(onDay);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarEvents();
  }, [year, month, selectedDateStr]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(formatted);
    const matched = events.filter((e) => e.start_date === formatted);
    setSelectedDayEvents(matched);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: 8 }}>CAMPUS SCHEDULE</span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Event Calendar
          </h1>
        </div>

        {/* Navigation & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', padding: '6px 14px', borderRadius: 14, border: '1px solid var(--soft-border)' }}>
            <button onClick={handlePrevMonth} style={{ background: 'transparent', color: 'var(--dark-navy)' }}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontSize: '1rem', fontWeight: 700, minWidth: 140, textAlign: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={handleNextMonth} style={{ background: 'transparent', color: 'var(--dark-navy)' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', padding: 4, borderRadius: 12, border: '1px solid var(--soft-border)' }}>
            <button
              onClick={() => setViewMode('month')}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: viewMode === 'month' ? 'var(--primary-purple)' : 'transparent',
                color: viewMode === 'month' ? '#FFFFFF' : 'var(--muted-text)',
              }}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: viewMode === 'list' ? 'var(--primary-purple)' : 'transparent',
                color: viewMode === 'list' ? '#FFFFFF' : 'var(--muted-text)',
              }}
            >
              Timeline View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {/* Calendar Grid */}
          <div
            className="glass-panel"
            style={{
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 24,
              gridColumn: 'span 2',
            }}
          >
            {/* Weekday labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted-text)', marginBottom: 12 }}>
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {/* Empty offset days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: 80, borderRadius: 12, background: 'transparent' }} />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const dayEvents = events.filter((e) => e.start_date === dateStr);

                return (
                  <div
                    key={day}
                    onClick={() => handleSelectDay(day)}
                    style={{
                      height: 85,
                      padding: 8,
                      borderRadius: 14,
                      background: isSelected ? '#F3EEFF' : isToday ? 'rgba(139, 157, 255, 0.08)' : '#FAFAFC',
                      border: isSelected
                        ? '2px solid var(--primary-purple)'
                        : isToday
                        ? '1.5px solid var(--accent-blue)'
                        : '1px solid var(--soft-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: isToday || isSelected ? 800 : 600,
                          color: isSelected ? 'var(--primary-purple)' : isToday ? 'var(--accent-blue)' : 'var(--dark-navy)',
                        }}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Event indicators */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 4px',
                            borderRadius: 4,
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#9333EA',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted-text)', fontWeight: 600 }}>
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Drawer */}
          <div
            className="glass-panel"
            style={{
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              height: 'fit-content',
            }}
          >
            <div style={{ borderBottom: '1px solid var(--soft-border)', paddingBottom: 16, marginBottom: 20 }}>
              <span className="badge badge-purple" style={{ marginBottom: 6 }}>SELECTED DAY</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
                {new Date(selectedDateStr).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--muted-text)' }}>
                <CalendarIcon size={36} color="var(--light-violet)" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '0.92rem' }}>No events scheduled for this day.</p>
                <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Select another date on the calendar.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--soft-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>
                      {ev.category_name}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                      {ev.title}
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted-text)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--primary-purple)" />
                        <span>{ev.start_time} - {ev.end_time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} color="var(--accent-blue)" />
                        <span>{ev.venue_name}</span>
                      </div>
                    </div>
                    <Link
                      to={`/events/${ev.id}`}
                      className="btn-primary"
                      style={{ marginTop: 8, padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      View Details & Pass
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Timeline List View */
        <div className="glass-panel" style={{ padding: 32, background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 24 }}>Upcoming Events Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 20,
                  borderRadius: 16,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--soft-border)',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <span className="badge badge-purple" style={{ marginBottom: 6 }}>{ev.category_name}</span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--dark-navy)' }}>{ev.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-text)', marginTop: 4 }}>
                    {ev.start_date} • {ev.venue_name}
                  </p>
                </div>
                <Link to={`/events/${ev.id}`} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  Register / Details <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
