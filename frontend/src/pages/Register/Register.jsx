import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, User, Mail, Lock, Hash, Building2, GraduationCap,
  ArrowRight, ShieldCheck, Briefcase, PlusCircle, Check
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('STUDENT'); // 'STUDENT' | 'ORGANIZER' | 'ADMIN'
  const [isNewDepartment, setIsNewDepartment] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    roll_number: '',
    department: '',
    department_name: '',
    department_code: '',
    year_of_study: 1,
    organization_name: '',
    designation: '',
    admin_secret_key: 'ADMIN2026',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await authAPI.getDepartments();
        const list = res.data.results || res.data || [];
        setDepartments(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, department: list[0].id }));
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }

    if (selectedRole === 'ADMIN' && !formData.admin_secret_key.trim()) {
      toast.error('Admin Secret Key is required for Super Admin registration.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: selectedRole,
      };

      if (selectedRole === 'STUDENT') {
        payload.roll_number = formData.roll_number.trim();
        payload.year_of_study = parseInt(formData.year_of_study, 10);
        payload.department = isNewDepartment ? null : (formData.department || null);
        if (isNewDepartment) {
          payload.department_name = formData.department_name.trim();
          payload.department_code = formData.department_code.trim();
        }
      } else if (selectedRole === 'ORGANIZER') {
        payload.organization_name = formData.organization_name.trim();
        payload.designation = formData.designation.trim() || 'Club Coordinator';
        payload.department = isNewDepartment ? null : (formData.department || null);
        if (isNewDepartment) {
          payload.department_name = formData.department_name.trim();
          payload.department_code = formData.department_code.trim();
        }
      } else if (selectedRole === 'ADMIN') {
        payload.admin_secret_key = formData.admin_secret_key.trim();
        payload.organization_name = formData.organization_name.trim() || 'College Central Administration';
        payload.designation = formData.designation.trim() || 'Super Administrator';
      }

      await register(payload);
      navigate('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 640,
          padding: '40px 36px',
          background: '#FFFFFF',
          borderRadius: 28,
          boxShadow: '0 20px 45px rgba(168, 85, 247, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #A855F7 0%, #8B9DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              margin: '0 auto 12px auto',
            }}
          >
            <Sparkles size={26} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Join CampusX Platform
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--muted-text)', marginTop: 4 }}>
            Choose your account role to access your dedicated dashboard & capabilities
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            background: 'var(--bg-primary)',
            padding: 6,
            borderRadius: 16,
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedRole('STUDENT')}
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              border: 'none',
              background: selectedRole === 'STUDENT' ? '#FFFFFF' : 'transparent',
              color: selectedRole === 'STUDENT' ? 'var(--primary-purple)' : 'var(--muted-text)',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: selectedRole === 'STUDENT' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <GraduationCap size={16} /> Student
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('ORGANIZER')}
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              border: 'none',
              background: selectedRole === 'ORGANIZER' ? '#FFFFFF' : 'transparent',
              color: selectedRole === 'ORGANIZER' ? 'var(--primary-purple)' : 'var(--muted-text)',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: selectedRole === 'ORGANIZER' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Building2 size={16} /> Organizer
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              border: 'none',
              background: selectedRole === 'ADMIN' ? '#FFFFFF' : 'transparent',
              color: selectedRole === 'ADMIN' ? 'var(--primary-purple)' : 'var(--muted-text)',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: selectedRole === 'ADMIN' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ShieldCheck size={16} /> Super Admin
          </button>
        </div>

        {/* Informational Banner */}
        {selectedRole === 'ADMIN' && (
          <div
            style={{
              padding: '12px 16px',
              background: '#FDF4FF',
              border: '1px solid #F0ABFC',
              borderRadius: 14,
              marginBottom: 20,
              fontSize: '0.85rem',
              color: '#86198F',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ShieldCheck size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>Super Administrator Mode:</strong> Grants full system permissions to approve/edit all events, manage clubs, oversee attendance, and configure venues.
            </span>
          </div>
        )}

        {selectedRole === 'ORGANIZER' && (
          <div
            style={{
              padding: '12px 16px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 14,
              marginBottom: 20,
              fontSize: '0.85rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Building2 size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>Organizer Account:</strong> Host and manage college events, create your own clubs and department associations, and monitor live attendance.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* First & Last name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>First Name</label>
              <input
                type="text"
                required
                name="first_name"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Last Name</label>
              <input
                type="text"
                name="last_name"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Username & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Username</label>
              <input
                type="text"
                required
                name="username"
                placeholder="username"
                value={formData.username}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Official Email</label>
              <input
                type="email"
                required
                name="email"
                placeholder="user@college.edu"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Role-Specific Fields */}
          {selectedRole === 'STUDENT' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Roll No / Student ID</label>
                  <input
                    type="text"
                    required
                    name="roll_number"
                    placeholder="21BCE1042"
                    value={formData.roll_number}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Year of Study</label>
                  <select
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior)</option>
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Department Association</label>
                  <button
                    type="button"
                    onClick={() => setIsNewDepartment(!isNewDepartment)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {isNewDepartment ? '← Select Existing' : '+ Add New Department'}
                  </button>
                </div>
                {!isNewDepartment ? (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      name="department_name"
                      placeholder="e.g. Artificial Intelligence & DS"
                      value={formData.department_name}
                      onChange={handleChange}
                      style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                    />
                    <input
                      type="text"
                      name="department_code"
                      placeholder="e.g. AIDS"
                      value={formData.department_code}
                      onChange={handleChange}
                      style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {selectedRole === 'ORGANIZER' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Organization / Club / Council Name</label>
                  <input
                    type="text"
                    required
                    name="organization_name"
                    placeholder="e.g. Google Developer Student Club"
                    value={formData.organization_name}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Your Designation / Role</label>
                  <input
                    type="text"
                    required
                    name="designation"
                    placeholder="e.g. Club President / Lead"
                    value={formData.designation}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Associated Department / Wing</label>
                  <button
                    type="button"
                    onClick={() => setIsNewDepartment(!isNewDepartment)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {isNewDepartment ? '← Select Existing' : '+ Create New Department Association'}
                  </button>
                </div>
                {!isNewDepartment ? (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      name="department_name"
                      placeholder="e.g. Computer Science Student Association"
                      value={formData.department_name}
                      onChange={handleChange}
                      style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                    />
                    <input
                      type="text"
                      name="department_code"
                      placeholder="e.g. CSSA"
                      value={formData.department_code}
                      onChange={handleChange}
                      style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {selectedRole === 'ADMIN' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                  Admin Secret Key <span style={{ color: 'var(--primary-purple)' }}>(Master Passkey)</span>
                </label>
                <input
                  type="password"
                  required
                  name="admin_secret_key"
                  placeholder="Enter admin passcode (e.g. ADMIN2026)"
                  value={formData.admin_secret_key}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginTop: 4, display: 'block' }}>
                  Default master authorization key: <code>ADMIN2026</code>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Administrative Branch</label>
                  <input
                    type="text"
                    name="organization_name"
                    placeholder="e.g. Office of Student Affairs"
                    value={formData.organization_name}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Title / Office Designation</label>
                  <input
                    type="text"
                    name="designation"
                    placeholder="e.g. Dean / Super Administrator"
                    value={formData.designation}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Contact Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Contact Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="+91 9123456789"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
            />
          </div>

          {/* Password & Confirm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Password</label>
              <input
                type="password"
                required
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Confirm Password</label>
              <input
                type="password"
                required
                name="confirm_password"
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 10 }}
          >
            {loading ? 'Creating Account...' : `Register as ${selectedRole === 'ADMIN' ? 'Super Admin' : selectedRole === 'ORGANIZER' ? 'Organizer' : 'Student'}`}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--muted-text)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-purple)', fontWeight: 700 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
