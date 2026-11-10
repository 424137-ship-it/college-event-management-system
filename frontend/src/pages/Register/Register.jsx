import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, Mail, Lock, Hash, Building2, GraduationCap, ArrowRight } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    roll_number: '',
    department: '',
    year_of_study: 1,
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
    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        roll_number: formData.roll_number,
        department: formData.department || null,
        year_of_study: parseInt(formData.year_of_study, 10),
        password: formData.password,
      });
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
        minHeight: '80vh',
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
          maxWidth: 580,
          padding: 36,
          background: '#FFFFFF',
          borderRadius: 28,
          boxShadow: '0 20px 45px rgba(168, 85, 247, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #A855F7 0%, #8B9DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              margin: '0 auto 12px auto',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Join CampusX
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-text)', marginTop: 4 }}>
            Create your verified student profile to start discovering campus events
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* First & Last name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>First Name</label>
              <input
                type="text"
                required
                name="first_name"
                placeholder="Harsha"
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
                placeholder="Vardhan"
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
                placeholder="harsha"
                value={formData.username}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>College Email</label>
              <input
                type="email"
                required
                name="email"
                placeholder="harsha@student.edu"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--soft-border)', background: 'var(--bg-primary)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Roll number & Department */}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Department</label>
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
            </div>
          </div>

          {/* Academic Year & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
            {loading ? 'Creating Student Profile...' : 'Complete Registration'}
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
