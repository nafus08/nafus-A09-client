import { Component, createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Wrench, Menu, X, Search, ArrowRight, Smartphone, Laptop, Snowflake, Refrigerator, Tv, WashingMachine, Zap, ShieldCheck, Clock3, BadgeDollarSign, LayoutDashboard, UserRound, LogOut, ChevronDown, CalendarDays, MapPin, Star, type LucideIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { authClient } from './lib/auth-client';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: API });

interface FixMateUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
  image?: string;
  phone?: string;
  area?: string;
  bio?: string;
}

interface AuthContextValue {
  user: FixMateUser | null;
  login: (user: FixMateUser, token: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
function AuthProvider({ children }) {
  const [user, setUser] = useState<FixMateUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const { data: session } = await authClient.getSession({ query: {} });
        if (!session) return;
        const { data: tokenData, error } = await authClient.token({ query: {} });
        if (error || !tokenData) throw new Error(error?.message || 'Could not restore your session');
        api.defaults.headers.common.Authorization = `Bearer ${tokenData.token}`;
        const { data: profile } = await api.get('/api/me');
        if (active) setUser(profile);
      } catch (error) {
        if (active) toast.error(error.message || 'Could not restore your session');
      } finally {
        if (active) setLoading(false);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, []);
  const login = (profile: FixMateUser, token: string) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(profile);
  };
  const logout = async () => {
    await authClient.signOut({});
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };
  const refreshUser = async () => {
    const { data } = await api.get('/api/me');
    setUser(data);
  };
  return <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>{children}</AuthContext.Provider>;
}
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

function Logo({ light = false }) {
  return <Link className={`logo ${light ? 'logo-light' : ''}`} to="/"><span className="logo-mark"><Wrench size={21} /></span><span>Fix<span>Mate</span></span></Link>;
}

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const navigate = useNavigate();
  const dashboard = user ? `/dashboard/${user.role}` : '/dashboard/customer';
  const signOut = async () => {
    try { await logout(); toast.success('Signed out successfully'); navigate('/'); }
    catch { toast.error('Could not sign out'); }
  };
  return <header className="navbar">
    <div className="nav-inner">
      <Logo />
      <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
        {[['/', 'Home'], ['/services', 'Services'], ['/about', 'How It Works']].map(([to, label]) =>
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}
      </nav>
      <div className="nav-actions">
        {user ? <div className="profile-wrap">
          <button className="profile-button" onClick={() => setProfile(!profile)} aria-label="Profile menu">
            <img src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0d9488&color=fff`} alt="" />
            <ChevronDown size={16} />
          </button>
          {profile && <div className="profile-menu">
            <div className="profile-head"><strong>{user.name}</strong><span className={`role-badge ${user.role}`}>{user.role}</span></div>
            <Link to={dashboard} onClick={() => setProfile(false)}><LayoutDashboard size={16} /> Dashboard</Link>
            <Link to="/dashboard/profile" onClick={() => setProfile(false)}><UserRound size={16} /> Update Profile</Link>
            <button onClick={signOut}><LogOut size={16} /> Sign Out</button>
          </div>}
        </div> : <><Link className="btn btn-ghost" to="/sign-in">Sign In</Link><Link className="btn btn-primary" to="/sign-up">Sign Up</Link></>}
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </div>
    </div>
  </header>;
}

function Footer() {
  const categories = ['Smartphone', 'Laptop & PC', 'AC', 'Refrigerator', 'TV', 'Washing Machine', 'Electrical'];
  return <footer className="footer">
    <div className="footer-grid container">
      <div><Logo light /><p className="footer-tagline">Trusted repair experts, clear job tracking, and payment only after completion.</p></div>
      <div><h4>Quick Links</h4><Link to="/">Home</Link><Link to="/services">Services</Link><Link to="/about">How It Works</Link></div>
      <div><h4>Popular Categories</h4>{categories.slice(0, 5).map((c) => <Link key={c} to={`/services?category=${encodeURIComponent(c)}`}>{c}</Link>)}</div>
      <div><h4>Contact</h4><p>hello@fixmate.com</p><p>+880 1700-000000</p><p>Dhaka, Bangladesh</p><div className="social"><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="Instagram">◎</a><a href="#" aria-label="X">𝕏</a></div></div>
    </div>
    <div className="copyright container">© {new Date().getFullYear()} FixMate. All rights reserved.</div>
  </footer>;
}

function PublicLayout({ children }) { return <><Navbar /><main>{children}</main><Footer /></>; }

function Home() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get('/api/services', { params: { limit: 6 } }).then(({ data }) => setServices(data.items)).catch(() => setServices([])); }, []);
  const categories: [string, LucideIcon][] = [
    ['Smartphone', Smartphone], ['Laptop & PC', Laptop], ['AC', Snowflake], ['Refrigerator', Refrigerator],
    ['TV', Tv], ['Washing Machine', WashingMachine], ['Electrical', Zap],
  ];
  return <PublicLayout><>
    <section className="hero-section">
      <div className="container hero-grid">
        <div className="hero-copy"><span className="eyebrow">Trusted local repair experts</span><h1>Broken Device?<br /><em>Get It Fixed</em> by Verified Technicians</h1><p>Book reliable repairs for your devices and home appliances. Track every step and pay only after the job is complete.</p>
          <div className="hero-actions"><Link className="btn btn-primary btn-large" to="/services">Find a Repair <ArrowRight size={18} /></Link><Link className="btn btn-ghost btn-large" to="/about">How It Works</Link></div>
          <div className="hero-trust"><div><strong>1.2k+</strong><span>Jobs completed</span></div><div><strong>4.9/5</strong><span>Customer rating</span></div><div><strong>24/7</strong><span>Support</span></div></div>
        </div>
        <div className="hero-visual"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000" alt="Technician repairing equipment" /><div className="floating-card"><ShieldCheck /><div><strong>Verified Experts</strong><span>Background checked</span></div></div></div></div>
      </div>
    </section>
    <section className="section container"><div className="section-head"><div><span className="eyebrow">Popular right now</span><h2>Featured Services</h2></div><Link to="/services">View all services <ArrowRight size={17} /></Link></div><div className="service-grid">{services.map((s) => <ServiceCard key={s._id} service={s} />)}</div></section>
    <section className="steps-section"><div className="container"><div className="section-head centered"><div><span className="eyebrow">Simple & transparent</span><h2>How FixMate Works</h2></div></div><div className="steps-grid">{[
      ['01', 'Find a Service', 'Browse verified specialists for your device.'], ['02', 'Send a Request', 'Choose a date and describe the problem.'], ['03', 'Technician Fixes It', 'Track progress from acceptance to completion.'], ['04', 'Pay After Completion', 'Pay securely only when the work is done.']
    ].map(([n, title, text]) => <div className="step" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
    <section className="section container"><div className="section-head"><div><span className="eyebrow">Browse by category</span><h2>Popular Categories</h2></div></div><div className="category-grid">{categories.map(([name, Icon]) => <Link className="category-card" key={name} to={`/services?category=${encodeURIComponent(name)}`}><span><Icon /></span><strong>{name}</strong><ArrowRight size={16} /></Link>)}</div></section>
  </></PublicLayout>;
}

function ServiceCard({ service }) {
  return <article className="service-card"><Link className="card-image" to={`/services/${service._id}`}><img src={service.image} alt={service.title} /><span>{service.category}</span></Link><div className="card-body"><h3><Link to={`/services/${service._id}`}>{service.title}</Link></h3><p className="technician-name">by {service.technicianName}</p><div className="card-meta"><span><MapPin size={14} /> {service.serviceArea}</span><span>{service.serviceMode}</span></div><div className="card-footer"><div><small>Starting from</small><strong>${service.basePrice}</strong></div><Link className="btn btn-primary" to={`/services/${service._id}`}>View Details</Link></div></div></article>;
}

function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false); const [retry, setRetry] = useState(0);
  const search = searchParams.get('search') || ''; const category = searchParams.get('category') || ''; const mode = searchParams.get('mode') || ''; const sort = searchParams.get('sort') || 'newest';
  const pageSize = 9;
  const requestedPage = Number(searchParams.get('page')) || 1;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const update = (key, value) => { const next = new URLSearchParams(searchParams); value ? next.set(key, value) : next.delete(key); next.set('page', '1'); setSearchParams(next); };
  const changePage = (nextPage) => { const next = new URLSearchParams(searchParams); next.set('page', String(nextPage)); setSearchParams(next); };
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    api.get('/api/services', { params: { search, category, mode, sort, page, limit: pageSize } })
      .then(({ data }) => { if (active) { setServices(data.items); setTotal(data.total); } })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, category, mode, sort, page, retry]);
  return <PublicLayout><section className="page-hero"><div className="container"><span className="eyebrow">Expert help near you</span><h1>Browse Repair Services</h1></div></section><section className="section container">
    <div className="filter-bar"><label className="search-input"><Search size={18} /><input value={search} onChange={(e) => update('search', e.target.value)} placeholder="Search services or categories" /></label><select value={category} onChange={(e) => update('category', e.target.value)}><option value="">All categories</option>{['Smartphone','Laptop & PC','AC','Refrigerator','TV','Washing Machine','Electrical'].map((c) => <option key={c}>{c}</option>)}</select><select value={mode} onChange={(e) => update('mode', e.target.value)}><option value="">All modes</option><option>Home Visit</option><option>Shop Drop-off</option></select><select value={sort} onChange={(e) => update('sort', e.target.value)}><option value="newest">Newest</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
    {loading ? <div className="loading"><span></span></div> : loadError ? <div className="empty-state" role="alert"><Search /><h3>Services couldn’t be loaded</h3><p>Check your connection and try again.</p><button className="btn btn-primary" onClick={() => setRetry((attempt) => attempt + 1)}>Retry</button></div> : !services.length ? <div className="empty-state"><Search /><h3>No services found</h3><p>Try changing your search or filters.</p><button className="btn btn-primary" onClick={() => setSearchParams({})}>Clear filters</button></div> : <><p className="results-count">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} services</p><div className="service-grid">{services.map((s) => <ServiceCard key={s._id} service={s} />)}</div><nav className="pagination" aria-label="Service pages"><button className="btn btn-ghost" onClick={() => changePage(page - 1)} disabled={page <= 1}>Previous</button><span>Page {page} of {pageCount}</span><button className="btn btn-ghost" onClick={() => changePage(page + 1)} disabled={page >= pageCount}>Next</button></nav></>}
  </section></PublicLayout>;
}

function ServiceDetails() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const [service, setService] = useState(null); const [loadError, setLoadError] = useState(false); const [retry, setRetry] = useState(0); const [open, setOpen] = useState(false); const [submitting, setSubmitting] = useState(false); const [form, setForm] = useState({ phone: user?.phone || '', address: '', preferredDate: '', problemDescription: '' });
  useEffect(() => {
    let active = true;
    setService(null);
    setLoadError(false);
    api.get(`/api/services/${id}`)
      .then(({ data }) => { if (active) setService(data); })
      .catch((error) => { if (active) { setLoadError(error.response?.status !== 404); setService(error.response?.status === 404 ? false : null); } });
    return () => { active = false; };
  }, [id, retry]);
  if (loadError) return <PublicLayout><section className="empty-state container" role="alert"><h3>Service details couldn’t be loaded</h3><p>Check your connection and try again.</p><button className="btn btn-primary" onClick={() => setRetry((attempt) => attempt + 1)}>Retry</button></section></PublicLayout>;
  if (service === null) return <PublicLayout><div className="loading"><span /></div></PublicLayout>;
  if (!service) return <Navigate to="/404" replace />;
  const requestRepair = () => { if (!user) navigate(`/sign-in?redirect=/services/${id}`); else if (user.role === 'customer') setOpen(true); };
  const submit = async (e) => { e.preventDefault(); setSubmitting(true); try { await api.post('/api/bookings', { ...form, serviceId: id }); toast.success('Repair request submitted'); setOpen(false); navigate('/dashboard/customer/bookings'); } catch (error) { toast.error(error.response?.data?.message || 'Could not submit request'); } finally { setSubmitting(false); } };
  const technician = service.technician || {};
  return <PublicLayout><section className="section container detail-layout"><div className="detail-main"><img className="detail-image" src={service.image} alt={service.title} /><span className="detail-category">{service.category}</span><h1>{service.title}</h1><p className="detail-description">{service.description}</p><div className="detail-specs"><div><small>Starting price</small><strong>${service.basePrice}</strong></div><div><small>Duration</small><strong>{service.estimatedDuration}</strong></div><div><small>Service mode</small><strong>{service.serviceMode}</strong></div><div><small>Area</small><strong>{service.serviceArea}</strong></div></div></div><aside className="booking-card"><h3>Repair summary</h3><div className="booking-technician"><img src={technician.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(service.technicianName)}`} alt="" /><div><strong>{service.technicianName}</strong><span><Star size={14} fill="currentColor" /> 4.9 verified</span></div></div><p>{technician.area || service.serviceArea}</p><p>{technician.bio || 'Verified repair specialist.'}</p><div className="booking-price"><span>Starting at</span><strong>${service.basePrice}</strong></div>{user?.role === 'customer' ? <button className="btn btn-primary btn-full" onClick={requestRepair}>Request Repair</button> : user ? <button className="btn btn-disabled btn-full" disabled>Only customers can request</button> : <button className="btn btn-primary btn-full" onClick={requestRepair}>Request Repair</button>}</aside>
    {open && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>Request a Repair</h2><button disabled={submitting} onClick={() => setOpen(false)}><X /></button></div><form onSubmit={submit} className="form-grid"><label>Name<input value={user.name} readOnly /></label><label>Email<input value={user.email} readOnly /></label><label>Phone<input required value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} /></label><label>Preferred Date<input required type="date" min={new Date().toISOString().split('T')[0]} value={form.preferredDate} onChange={(e) => setForm({...form, preferredDate:e.target.value})} /></label><label className="span-2">Address<input required value={form.address} onChange={(e) => setForm({...form, address:e.target.value})} /></label><label className="span-2">Problem Description<textarea required minLength={20} value={form.problemDescription} onChange={(e) => setForm({...form, problemDescription:e.target.value})} /></label><button className="btn btn-primary span-2" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</button></form></div></div>}
  </section></PublicLayout>;
}

function About() {
  return <PublicLayout><section className="page-hero"><div className="container"><span className="eyebrow">Built on trust</span><h1>Repair help, made simple</h1></div></section><section className="section container"><div className="about-grid"><div><h2>One place for every repair</h2><p>FixMate connects customers with skilled and verified technicians. Every booking has a clear status, and customers pay securely only after work is completed.</p></div><div className="trust-panel"><div><ShieldCheck /><strong>Verified technicians</strong></div><div><Clock3 /><strong>Real-time job tracking</strong></div><div><BadgeDollarSign /><strong>Pay after service</strong></div></div></div></section></PublicLayout>;
}

function AuthPage({ mode }) {
  const { user, login } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' }); const [error, setError] = useState('');
  if (user) return <Navigate to={`/dashboard/${user.role}`} replace />;
  const submit = async (e) => { e.preventDefault(); setError('');
    if (mode === 'signup' && (form.password.length < 6 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password))) { setError('Use 6+ characters with uppercase and lowercase letters'); return; }
    try {
      const result = mode === 'signup'
        ? await authClient.signUp.email({ name: form.name, email: form.email, password: form.password })
        : await authClient.signIn.email({ email: form.email, password: form.password });
      if (result.error) throw new Error(result.error.message);
      const { data: tokenData, error: tokenError } = await authClient.token({ query: {} });
      if (tokenError || !tokenData) throw new Error(tokenError?.message || 'Could not create an API session');
      api.defaults.headers.common.Authorization = `Bearer ${tokenData.token}`;
      if (mode === 'signup') await api.patch('/api/profile/role', { role: form.role });
      const { data: profile } = await api.get('/api/me');
      login(profile, tokenData.token);
      toast.success(mode === 'signup' ? 'Account created successfully' : 'Signed in successfully');
      const returnPath = location.state?.from;
      const requestedPath = typeof returnPath === 'string'
        ? returnPath
        : returnPath ? `${returnPath.pathname || ''}${returnPath.search || ''}${returnPath.hash || ''}` : params.get('redirect');
      navigate(requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : `/dashboard/${profile.role}`, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Authentication failed';
      setError(message); toast.error(message);
    }
  };
  return <PublicLayout><section className="auth-section"><div className="auth-card"><Logo /><span className="eyebrow">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</span><h1>{mode === 'signup' ? 'Join FixMate' : 'Sign in to FixMate'}</h1>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}>
    {mode === 'signup' && <label>Full Name<input required value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} /></label>}
    <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} /></label>
    <label>Password<input required type="password" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} />{mode === 'signup' && <small>At least 6 characters, 1 uppercase, 1 lowercase</small>}</label>
    {mode === 'signup' && <div className="role-options">{['customer','technician'].map((role) => <label key={role} className={form.role === role ? 'selected' : ''}><input type="radio" name="role" value={role} checked={form.role === role} onChange={(e) => setForm({...form,role:e.target.value})} /><strong>{role === 'customer' ? 'Customer' : 'Technician'}</strong><span>{role === 'customer' ? 'Book repair services' : 'Offer and manage services'}</span></label>)}</div>}
    <button className="btn btn-primary btn-full" type="submit">{mode === 'signup' ? 'Create Account' : 'Sign In'}</button>
  </form><p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to FixMate?'} <Link to={mode === 'signup' ? '/sign-in' : '/sign-up'}>{mode === 'signup' ? 'Sign In' : 'Create account'}</Link></p></div></section></PublicLayout>;
}

function ProtectedRoute({ role, children }: { role?: FixMateUser['role']; children: ReactNode }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="loading"><span /></div>;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={`/dashboard/${user.role}`} replace />;
  return children;
}

function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const navigate = useNavigate();
  const role = user?.role;
  const menus = {
    customer: [['Overview','/dashboard/customer','LayoutDashboard'],['My Bookings','/dashboard/customer/bookings','CalendarDays'],['Payment History','/dashboard/customer/payments','BadgeDollarSign']],
    technician: [['Overview','/dashboard/technician','LayoutDashboard'],['Add a Service','/dashboard/technician/add-service','Wrench'],['My Services','/dashboard/technician/my-services','Wrench'],['Manage Requests','/dashboard/technician/requests','CalendarDays']],
    admin: [['Overview','/dashboard/admin','LayoutDashboard'],['Manage Users','/dashboard/admin/users','UserRound'],['Service Approval','/dashboard/admin/services','Wrench'],['All Bookings','/dashboard/admin/bookings','CalendarDays'],['Transactions','/dashboard/admin/transactions','BadgeDollarSign']],
  };
  const signOut = async () => {
    try { await logout(); toast.success('Signed out successfully'); navigate('/'); }
    catch { toast.error('Could not sign out'); }
  };
  return <div className="dashboard-shell"><aside className={open ? 'sidebar open' : 'sidebar'}><div className="sidebar-head"><Logo /><button onClick={() => setOpen(false)}><X /></button></div><nav>{(menus[role] || []).map(([label,to]) => <NavLink key={to} to={to} end={to === `/dashboard/${role}`} onClick={() => setOpen(false)}><LayoutDashboard size={18} />{label}</NavLink>)}</nav><div className="sidebar-profile"><img src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} alt="" /><div><strong>{user?.name}</strong><span>{role}</span></div></div></aside><div className="dashboard-main"><header className="dashboard-topbar"><button className="menu-button" onClick={() => setOpen(true)}><Menu /></button><Link className="back-home" to="/">← Back to Home</Link><Link to="/dashboard/profile" className="top-profile"><img src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} alt="" /><div><strong>{user?.name}</strong><span>{role}</span></div></Link><button className="icon-button" onClick={signOut}><LogOut size={18} /></button></header><main className="dashboard-content"><div className="dashboard-heading"><div><span>Dashboard</span><h1>{title}</h1></div></div>{children}</main></div></div>;
}

function StatCards({ items }) {
  const icons = [CalendarDays, Clock3, ShieldCheck];
  return <div className="stats-grid">{items.map((item,i) => { const Icon = icons[i % icons.length]; return <div className="stat-card" key={item.label}><span><Icon /></span><div><strong>{item.value}</strong><p>{item.label}</p></div></div>; })}</div>;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status?.replace(' ', '-')}`}>{status}</span>;
}

function BookingStatusHistory({ history }) {
  const entries = Array.isArray(history) ? history : [];
  return <details className="booking-history">
    <summary>View history</summary>
    {entries.length ? <ol>{entries.map((entry, index) => {
      const date = entry.changedAt || entry.updatedAt || entry.timestamp || entry.createdAt;
      const parsedDate = date ? new Date(date) : null;
      const validDate = parsedDate && !Number.isNaN(parsedDate.getTime());
      return <li key={`${entry.status}-${date || index}`}><StatusBadge status={entry.status} />{validDate && <time dateTime={parsedDate.toISOString()}>{parsedDate.toLocaleString()}</time>}</li>;
    })}</ol> : <p>No status changes recorded yet.</p>}
  </details>;
}

function CustomerDashboard() {
  const [stats,setStats] = useState({ total:0, active:0, completed:0 });
  useEffect(()=>{ api.get('/api/customer/stats').then(({data})=>setStats(data)).catch(()=>{}); },[]);
  const chartData = [{name:'Requests',value:stats.total},{name:'Active',value:stats.active},{name:'Completed',value:stats.completed}];
  return <DashboardLayout title="Customer Overview"><StatCards items={[{value:stats.total,label:'Total Requests'},{value:stats.active,label:'Active Jobs'},{value:stats.completed,label:'Completed Jobs'}]} /><div className="dashboard-grid"><div className="panel"><h3>Job Activity</h3><div className="chart-box"><ResponsiveContainer width="100%" height={260}><BarChart data={chartData}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#0d9488" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div><div className="panel quick-panel"><h3>Quick actions</h3><Link className="btn btn-primary" to="/services">Browse Services</Link><Link className="btn btn-ghost" to="/dashboard/customer/bookings">View My Bookings</Link></div></div></DashboardLayout>;
}

function CustomerBookings() {
  const [items,setItems]=useState([]); const [confirm,setConfirm]=useState(null); const [loading,setLoading]=useState(true); const [loadError,setLoadError]=useState(false);
  const load=async()=>{setLoading(true);setLoadError(false);try{const {data}=await api.get('/api/bookings/my');setItems(data);}catch{setLoadError(true);toast.error('Could not load bookings')}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const cancel=async(id)=>{try{await api.patch(`/api/bookings/${id}/cancel`);toast.success('Booking cancelled');setConfirm(null);load();}catch(e){toast.error(e.response?.data?.message||'Could not cancel')}};
  const pay=async(id)=>{try{const {data}=await api.post('/api/payments/create-checkout-session',{bookingId:id});window.location.href=data.url;}catch(e){toast.error(e.response?.data?.message||'Could not start payment')}};
  return <DashboardLayout title="My Bookings"><div className="table-panel">{loading?<div className="loading" aria-label="Loading bookings"><span/></div>:loadError?<div className="empty-state" role="alert"><h3>Bookings couldn’t be loaded</h3><button className="btn btn-primary" onClick={load}>Retry</button></div>:items.length?<div className="responsive-table"><table><thead><tr><th>Service</th><th>Technician</th><th>Preferred date</th><th>Amount</th><th>Status</th><th>Payment</th><th>History</th><th>Action</th></tr></thead><tbody>{items.map(b=><tr key={b._id}><td><div className="table-service"><img src={b.serviceImage} alt="" /><strong>{b.serviceTitle}</strong></div></td><td>{b.technicianName}</td><td>{new Date(b.preferredDate).toLocaleDateString()}</td><td>${b.finalAmount || b.basePrice}</td><td><StatusBadge status={b.status}/></td><td><StatusBadge status={b.paymentStatus}/></td><td><BookingStatusHistory history={b.statusHistory}/></td><td>{b.status==='requested'?<button className="btn btn-danger btn-small" onClick={()=>setConfirm(b)}>Cancel</button>:b.status==='completed'&&b.paymentStatus==='unpaid'?<button className="btn btn-primary btn-small" onClick={()=>pay(b._id)}>Pay Now</button>:b.paymentStatus==='paid'?<span className="paid-text">Paid</span>:<span>—</span>}</td></tr>)}</tbody></table></div>:<div className="empty-state"><CalendarDays/><h3>No bookings yet</h3><p>Find a trusted technician and make your first repair request.</p><Link className="btn btn-primary" to="/services">Browse Services</Link></div>}</div>{confirm&&<div className="modal-backdrop"><div className="modal confirm-modal"><h2>Cancel this booking?</h2><p>This action cannot be undone.</p><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Keep Booking</button><button className="btn btn-danger" onClick={()=>cancel(confirm._id)}>Yes, Cancel</button></div></div></div>}</DashboardLayout>;
}

function CustomerPayments() {
  const [items,setItems]=useState([]);
  useEffect(()=>{api.get('/api/payments/my').then(({data})=>setItems(data)).catch(()=>toast.error('Could not load payments'));},[]);
  return <DashboardLayout title="Payment History"><div className="table-panel"><table><thead><tr><th>Service</th><th>Technician</th><th>Amount</th><th>Transaction ID</th><th>Payment date</th></tr></thead><tbody>{items.map(p=><tr key={p._id}><td>{p.serviceTitle}</td><td>{p.technicianName}</td><td>${p.amount}</td><td className="mono">{p.transactionId}</td><td>{new Date(p.paidAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!items.length&&<div className="empty-state"><BadgeDollarSign/><h3>No payments yet</h3><p>Your completed payments will appear here.</p></div>}</div></DashboardLayout>;
}

function TechnicianDashboard() {
  const [stats,setStats]=useState({totalServices:0,approvedServices:0,pendingRequests:0});
  useEffect(()=>{api.get('/api/technician/stats').then(({data})=>setStats(data)).catch(()=>{});},[]);
  const chartData=[{name:'Total',value:stats.totalServices},{name:'Approved',value:stats.approvedServices},{name:'Pending',value:stats.pendingRequests}];
  return <DashboardLayout title="Technician Overview"><StatCards items={[{value:stats.totalServices,label:'Total Services'},{value:stats.approvedServices,label:'Approved Services'},{value:stats.pendingRequests,label:'Pending Requests'}]} /><div className="panel"><h3>Service & Request Summary</h3><div className="chart-box"><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#0d9488" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div></DashboardLayout>;
}

function AddService() {
  const {user}=useAuth(); const [form,setForm]=useState({title:'',category:'Smartphone',description:'',image:'',basePrice:'',estimatedDuration:'',serviceMode:'Home Visit',serviceArea:''});
  const [uploading,setUploading]=useState(false);
  const upload=async(e)=>{const file=e.target.files?.[0];if(!file)return;const body=new FormData();body.append('image',file);setUploading(true);try{const {data}=await api.post('/api/upload/image',body);setForm({...form,image:data.url});toast.success('Image uploaded');}catch(err){toast.error(err.response?.data?.message||'Upload failed');}finally{setUploading(false)}};
  const submit=async(e)=>{e.preventDefault();try{await api.post('/api/services',{...form,basePrice:Number(form.basePrice)});toast.success('Service submitted. Waiting for admin approval.');setForm({title:'',category:'Smartphone',description:'',image:'',basePrice:'',estimatedDuration:'',serviceMode:'Home Visit',serviceArea:''});}catch(err){toast.error(err.response?.data?.message||'Could not add service')}};
  return <DashboardLayout title="Add a Service"><div className="form-panel"><form onSubmit={submit} className="form-grid"><label>Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['Smartphone','Laptop & PC','AC','Refrigerator','TV','Washing Machine','Electrical'].map(c=><option key={c}>{c}</option>)}</select></label><label className="span-2">Description<textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Base Price ($)<input required type="number" min="1" value={form.basePrice} onChange={e=>setForm({...form,basePrice:e.target.value})}/></label><label>Estimated Duration<input required placeholder="e.g. 2-3 hours" value={form.estimatedDuration} onChange={e=>setForm({...form,estimatedDuration:e.target.value})}/></label><label>Service Mode<select value={form.serviceMode} onChange={e=>setForm({...form,serviceMode:e.target.value})}><option>Home Visit</option><option>Shop Drop-off</option></select></label><label>Service Area<input required value={form.serviceArea} onChange={e=>setForm({...form,serviceArea:e.target.value})}/></label><label>Technician Name<input value={user.name} readOnly/></label><label>Technician Email<input value={user.email} readOnly/></label><label className="span-2">Service Image<input required={!form.image} type="file" accept="image/*" onChange={upload}/>{uploading&&<small>Uploading...</small>} {form.image&&<img className="upload-preview" src={form.image} alt="Preview"/>}</label><button className="btn btn-primary span-2" disabled={uploading||!form.image}>Submit for Approval</button></form></div></DashboardLayout>;
}

function TechnicianServices() {
  const [items,setItems]=useState([]); const [edit,setEdit]=useState(null); const [confirm,setConfirm]=useState(null);
  const load=()=>api.get('/api/services/technician/mine').then(({data})=>setItems(data)).catch(()=>toast.error('Could not load services'));
  useEffect(()=>{load()},[]);
  const remove=async()=>{try{await api.delete(`/api/services/${confirm._id}`);toast.success('Service deleted');setConfirm(null);load();}catch(e){toast.error(e.response?.data?.message||'Delete failed')}};
  const toggle=async(s)=>{try{await api.patch(`/api/services/${s._id}`,{isAvailable:!s.isAvailable});toast.success('Availability updated');load();}catch(e){toast.error('Update failed')}};
  const saveEdit=async(e)=>{e.preventDefault();try{await api.patch(`/api/services/${edit._id}`,edit);toast.success('Service updated and waiting for approval');setEdit(null);load();}catch(e){toast.error(e.response?.data?.message||'Update failed')}};
  return <DashboardLayout title="My Services"><div className="table-panel">{items.length?<div className="responsive-table"><table><thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Approval</th><th>Available</th><th>Actions</th></tr></thead><tbody>{items.map(s=><tr key={s._id}><td><div className="table-service"><img src={s.image} alt="" /><strong>{s.title}</strong></div></td><td>{s.category}</td><td>${s.basePrice}</td><td><StatusBadge status={s.approvalStatus}/></td><td><label className="switch"><input type="checkbox" checked={s.isAvailable} onChange={()=>toggle(s)}/><span/></label></td><td><div className="table-actions"><button className="btn btn-ghost btn-small" onClick={()=>setEdit({...s})}>Edit</button><button className="btn btn-danger btn-small" onClick={()=>setConfirm(s)}>Delete</button></div></td></tr>)}</tbody></table></div>:<div className="empty-state"><Wrench/><h3>No services yet</h3><p>Add your first repair service to start receiving requests.</p><Link className="btn btn-primary" to="/dashboard/technician/add-service">Add Service</Link></div>}</div>{confirm&&<div className="modal-backdrop"><div className="modal confirm-modal"><h2>Delete this service?</h2><p>{confirm.title} will be permanently removed.</p><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Keep</button><button className="btn btn-danger" onClick={remove}>Delete</button></div></div></div>}{edit&&<div className="modal-backdrop"><div className="modal wide-modal"><div className="modal-head"><h2>Edit Service</h2><button onClick={()=>setEdit(null)}><X/></button></div><form onSubmit={saveEdit} className="form-grid"><label>Title<input value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})}/></label><label>Category<select value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})}>{['Smartphone','Laptop & PC','AC','Refrigerator','TV','Washing Machine','Electrical'].map(c=><option key={c}>{c}</option>)}</select></label><label className="span-2">Description<textarea value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})}/></label><label>Base Price<input type="number" value={edit.basePrice} onChange={e=>setEdit({...edit,basePrice:e.target.value})}/></label><label>Duration<input value={edit.estimatedDuration} onChange={e=>setEdit({...edit,estimatedDuration:e.target.value})}/></label><label>Area<input value={edit.serviceArea} onChange={e=>setEdit({...edit,serviceArea:e.target.value})}/></label><label>Mode<select value={edit.serviceMode} onChange={e=>setEdit({...edit,serviceMode:e.target.value})}><option>Home Visit</option><option>Shop Drop-off</option></select></label><button className="btn btn-primary span-2">Save Changes</button></form></div></div>}</DashboardLayout>;
}

function TechnicianRequests() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [complete, setComplete] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try { const { data } = await api.get('/api/bookings/technician'); setItems(data); }
    catch { setLoadError(true); toast.error('Could not load requests'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const update = async (id, status, extra = {}) => {
    try {
      await api.patch(`/api/bookings/${id}/status`, { status, ...extra });
      toast.success(`Booking marked ${status}`);
      setComplete(null);
      setRejectConfirm(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };
  const filtered = filter === 'All' ? items : items.filter((booking) => {
    if (filter === 'In Progress') return booking.status === 'in-progress';
    return booking.status === filter.toLowerCase();
  });
  return <DashboardLayout title="Manage Requests">
    <div className="toolbar"><label>Filter by status<select value={filter} onChange={(event) => setFilter(event.target.value)}>{['All', 'Requested', 'Accepted', 'In Progress', 'Completed'].map((status) => <option key={status}>{status}</option>)}</select></label></div>
    <div className="table-panel">
      {loading ? <div className="loading" aria-label="Loading requests"><span /></div> : loadError ? <div className="empty-state" role="alert"><h3>Requests couldn’t be loaded</h3><button className="btn btn-primary" onClick={load}>Retry</button></div> : filtered.length ? <div className="responsive-table"><table>
        <thead><tr><th>Customer</th><th>Service</th><th>Phone / Address</th><th>Preferred Date</th><th>Problem</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{filtered.map((booking) => <tr key={booking._id}>
          <td><strong>{booking.customerName}</strong></td><td>{booking.serviceTitle}</td>
          <td><strong>{booking.customerPhone}</strong><br /><span>{booking.address}</span></td>
          <td>{new Date(booking.preferredDate).toLocaleDateString()}</td><td className="problem-cell">{booking.problemDescription}</td>
          <td><StatusBadge status={booking.status} /></td>
          <td>{booking.status === 'requested'
            ? <div className="table-actions"><button className="btn btn-primary btn-small" onClick={() => update(booking._id, 'accepted')}>Accept</button><button className="btn btn-danger btn-small" onClick={() => setRejectConfirm(booking)}>Reject</button></div>
            : booking.status === 'accepted' ? <button className="btn btn-primary btn-small" onClick={() => update(booking._id, 'in-progress')}>Start Work</button>
              : booking.status === 'in-progress' ? <button className="btn btn-primary btn-small" onClick={() => setComplete(booking)}>Mark Completed</button>
                : <StatusBadge status={booking.paymentStatus} />}
          </td>
        </tr>)}</tbody>
      </table></div> : <div className="empty-state"><CalendarDays /><h3>No requests found</h3><p>Requests matching this status will appear here.</p></div>}
    </div>
    {rejectConfirm && <div className="modal-backdrop"><div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="reject-booking-title">
      <h2 id="reject-booking-title">Reject this request?</h2><p>{rejectConfirm.serviceTitle} for {rejectConfirm.customerName} will be declined.</p>
      <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setRejectConfirm(null)}>Keep Request</button><button className="btn btn-danger" onClick={() => update(rejectConfirm._id, 'rejected')}>Confirm Rejection</button></div>
    </div></div>}
    {complete && <div className="modal-backdrop"><div className="modal">
      <div className="modal-head"><h2>Complete Job</h2><button onClick={() => setComplete(null)}><X /></button></div>
      <form onSubmit={(event) => {
        event.preventDefault();
        const amount = new FormData(event.currentTarget).get('amount');
        update(complete._id, 'completed', { finalAmount: Number(amount) });
      }}>
        <label>Final Amount ($)<input name="amount" type="number" min="1" defaultValue={complete.finalAmount || complete.basePrice} required /></label>
        <button className="btn btn-primary btn-full">Mark as Completed</button>
      </form>
    </div></div>}
  </DashboardLayout>;
}

function AdminDashboard() {
  const [stats,setStats]=useState({users:0,technicians:0,pendingServices:0});
  useEffect(()=>{api.get('/api/admin/stats').then(({data})=>setStats(data)).catch(()=>{});},[]);
  const chartData=[{name:'Users',value:stats.users},{name:'Technicians',value:stats.technicians},{name:'Pending',value:stats.pendingServices}];
  return <DashboardLayout title="Admin Overview"><StatCards items={[{value:stats.users,label:'Total Users'},{value:stats.technicians,label:'Total Technicians'},{value:stats.pendingServices,label:'Pending Services'}]} /><div className="panel"><h3>Platform Summary</h3><div className="chart-box"><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#0d9488" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div></DashboardLayout>;
}

function AdminUsers() {
  const [items,setItems]=useState([]);
  const load=()=>api.get('/api/admin/users').then(({data})=>setItems(data)).catch(()=>toast.error('Could not load users'));
  useEffect(()=>{load()},[]);
  const change=async(u,role)=>{try{await api.patch(`/api/admin/users/${u._id}/role`,{role});toast.success('User role updated');load();}catch(e){toast.error(e.response?.data?.message||'Update failed')}};
  return <DashboardLayout title="Manage Users"><div className="table-panel"><div className="responsive-table"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{items.map(u=><tr key={u._id}><td><div className="table-service"><img src={u.image||`https://ui-avatars.com/api/?name=${u.name}`} alt=""/><strong>{u.name}</strong></div></td><td>{u.email}</td><td><select className="role-select" value={u.role} onChange={e=>change(u,e.target.value)}><option>customer</option><option>technician</option><option>admin</option></select></td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div></DashboardLayout>;
}

function AdminServices() {
  const [items,setItems]=useState([]); const [filter,setFilter]=useState('pending');
  const load=()=>api.get('/api/admin/services').then(({data})=>setItems(data)).catch(()=>toast.error('Could not load services'));
  useEffect(()=>{load()},[]);
  const update=async(s,approvalStatus)=>{try{await api.patch(`/api/admin/services/${s._id}/approval`,{approvalStatus});toast.success(`Service ${approvalStatus}`);load();}catch(e){toast.error('Update failed')}};
  const filtered=filter==='all'?items:items.filter(s=>s.approvalStatus===filter);
  return <DashboardLayout title="Service Approval"><div className="toolbar"><label>Approval status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option></select></label></div><div className="table-panel"><div className="responsive-table"><table><thead><tr><th>Service</th><th>Technician</th><th>Category</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(s=><tr key={s._id}><td><div className="table-service"><img src={s.image} alt=""/><strong>{s.title}</strong></div></td><td>{s.technicianName}</td><td>{s.category}</td><td>${s.basePrice}</td><td><StatusBadge status={s.approvalStatus}/></td><td><div className="table-actions"><button className="btn btn-primary btn-small" onClick={()=>update(s,'approved')}>Approve</button><button className="btn btn-danger btn-small" onClick={()=>update(s,'rejected')}>Reject</button></div></td></tr>)}</tbody></table></div></div></DashboardLayout>;
}

function AdminBookings() {
  const [items,setItems]=useState([]);const [filter,setFilter]=useState('All');
  useEffect(()=>{api.get('/api/admin/bookings').then(({data})=>setItems(data)).catch(()=>toast.error('Could not load bookings'));},[]);
  const filtered=filter==='All'?items:items.filter(b=>b.status===filter.toLowerCase().replace(' ','-'));
  return <DashboardLayout title="All Bookings"><div className="toolbar"><label>Status<select value={filter} onChange={e=>setFilter(e.target.value)}>{['All','Requested','Accepted','In-progress','Completed','Rejected','Cancelled'].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="table-panel"><div className="responsive-table"><table><thead><tr><th>Service</th><th>Customer</th><th>Technician</th><th>Date</th><th>Status</th><th>Payment</th><th>Amount</th></tr></thead><tbody>{filtered.map(b=><tr key={b._id}><td>{b.serviceTitle}</td><td>{b.customerName}</td><td>{b.technicianName}</td><td>{new Date(b.preferredDate).toLocaleDateString()}</td><td><StatusBadge status={b.status}/></td><td><StatusBadge status={b.paymentStatus}/></td><td>${b.finalAmount||b.basePrice}</td></tr>)}</tbody></table></div></div></DashboardLayout>;
}

function AdminTransactions() {
  const [items,setItems]=useState([]);
  useEffect(()=>{api.get('/api/admin/payments').then(({data})=>setItems(data)).catch(()=>toast.error('Could not load transactions'));},[]);
  const total=items.reduce((sum,p)=>sum+Number(p.amount||0),0);
  return <DashboardLayout title="Transactions"><div className="revenue-card"><span>Total Revenue</span><strong>${total.toFixed(2)}</strong></div><div className="table-panel"><div className="responsive-table"><table><thead><tr><th>Customer</th><th>Technician</th><th>Service</th><th>Amount</th><th>Transaction ID</th><th>Paid At</th></tr></thead><tbody>{items.map(p=><tr key={p._id}><td>{p.customerName}</td><td>{p.technicianName}</td><td>{p.serviceTitle}</td><td>${p.amount}</td><td className="mono">{p.transactionId}</td><td>{new Date(p.paidAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div></DashboardLayout>;
}

function ProfilePage() {
  const {user,refreshUser}=useAuth(); const [form,setForm]=useState({name:user?.name||'',phone:user?.phone||'',area:user?.area||'',bio:user?.bio||'',image:user?.image||''}); const [uploading,setUploading]=useState(false);
  const upload=async(e)=>{const file=e.target.files?.[0];if(!file)return;const body=new FormData();body.append('image',file);setUploading(true);try{const {data}=await api.post('/api/upload/image',body);setForm({...form,image:data.url});toast.success('Photo uploaded');}catch(e){toast.error(e.response?.data?.message||'Upload failed')}finally{setUploading(false)}};
  const save=async(e)=>{e.preventDefault();try{await api.patch('/api/users/profile',form);await refreshUser();toast.success('Profile updated');}catch(e){toast.error(e.response?.data?.message||'Update failed')}};
  return <DashboardLayout title="Update Profile"><div className="form-panel profile-panel"><form onSubmit={save} className="form-grid"><div className="profile-photo span-2"><img src={form.image||`https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}`} alt=""/><label className="btn btn-ghost">Change Photo<input type="file" accept="image/*" onChange={upload} hidden/></label></div><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Email<input value={user.email} readOnly/></label><label>Role<input value={user.role} readOnly/></label><label>Area<input value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></label><label className="span-2">Bio<textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></label><button className="btn btn-primary span-2" disabled={uploading}>Save Profile</button></form></div></DashboardLayout>;
}

function PaymentSuccess() {
  const [payment,setPayment]=useState(null);const [error,setError]=useState('');const [params]=useSearchParams();
  useEffect(()=>{if(!params.get('session_id')){setError('Missing Stripe session');return;}api.get('/api/payments/verify',{params:{session_id:params.get('session_id')}}).then(({data})=>setPayment(data)).catch(e=>setError(e.response?.data?.message||'Could not verify payment'));},[params]);
  return <PublicLayout><section className="payment-page"><div className="payment-card success"><span className="payment-icon">✓</span><h1>Payment successful</h1>{payment?<><p>Your payment of <strong>${payment.amount}</strong> has been completed.</p><small>Transaction: {payment.transactionId}</small></>:error?<p className="form-error">{error}</p>:<div className="loading"><span/></div>}<Link className="btn btn-primary" to="/dashboard/customer/bookings">Back to My Bookings</Link></div></section></PublicLayout>;
}

function PaymentCancel() {
  return <PublicLayout><section className="payment-page"><div className="payment-card"><span className="payment-icon cancel">×</span><h1>Payment cancelled</h1><p>No changes were made to your booking. You can try again whenever you're ready.</p><Link className="btn btn-primary" to="/dashboard/customer/bookings">Try Again</Link></div></section></PublicLayout>;
}

function NotFound() {
  return <PublicLayout><section className="not-found"><span><Wrench/></span><h1>404 — Page Not Found</h1><p>This repair route is not on our map.</p><Link className="btn btn-primary" to="/">Back to Home</Link></section></PublicLayout>;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <section className="not-found error-fallback" role="alert"><span><Wrench /></span><h1>Something went wrong</h1><p>We couldn’t display this page. Please try again.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button></section>;
    }
    return this.props.children;
  }
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Home/>}/><Route path="/services" element={<ServicesPage/>}/><Route path="/services/:id" element={<ServiceDetails/>}/><Route path="/about" element={<About/>}/>
    <Route path="/sign-up" element={<AuthPage mode="signup"/>}/><Route path="/sign-in" element={<AuthPage mode="signin"/>}/>
    <Route path="/payment/success" element={<ProtectedRoute role="customer"><PaymentSuccess/></ProtectedRoute>}/><Route path="/payment/cancel" element={<ProtectedRoute role="customer"><PaymentCancel/></ProtectedRoute>}/>
    <Route path="/dashboard/customer" element={<ProtectedRoute role="customer"><CustomerDashboard/></ProtectedRoute>}/><Route path="/dashboard/customer/bookings" element={<ProtectedRoute role="customer"><CustomerBookings/></ProtectedRoute>}/><Route path="/dashboard/customer/payments" element={<ProtectedRoute role="customer"><CustomerPayments/></ProtectedRoute>}/>
    <Route path="/dashboard/technician" element={<ProtectedRoute role="technician"><TechnicianDashboard/></ProtectedRoute>}/><Route path="/dashboard/technician/add-service" element={<ProtectedRoute role="technician"><AddService/></ProtectedRoute>}/><Route path="/dashboard/technician/my-services" element={<ProtectedRoute role="technician"><TechnicianServices/></ProtectedRoute>}/><Route path="/dashboard/technician/requests" element={<ProtectedRoute role="technician"><TechnicianRequests/></ProtectedRoute>}/>
    <Route path="/dashboard/admin" element={<ProtectedRoute role="admin"><AdminDashboard/></ProtectedRoute>}/><Route path="/dashboard/admin/users" element={<ProtectedRoute role="admin"><AdminUsers/></ProtectedRoute>}/><Route path="/dashboard/admin/services" element={<ProtectedRoute role="admin"><AdminServices/></ProtectedRoute>}/><Route path="/dashboard/admin/bookings" element={<ProtectedRoute role="admin"><AdminBookings/></ProtectedRoute>}/><Route path="/dashboard/admin/transactions" element={<ProtectedRoute role="admin"><AdminTransactions/></ProtectedRoute>}/>
    <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
    <Route path="/404" element={<NotFound/>}/><Route path="*" element={<NotFound/>}/>
  </Routes>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><Toaster position="top-right"/><AppErrorBoundary><AppRoutes/></AppErrorBoundary></AuthProvider></BrowserRouter>;
}

