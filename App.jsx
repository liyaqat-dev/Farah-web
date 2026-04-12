```react
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Home, BookOpen, ShieldCheck, MessageSquare, 
  Image as ImageIcon, Plus, Check, X, Send, 
  FileText, Layout, ArrowRight, Lock,
  Instagram, Youtube, Trash2, Loader2, Upload,
  Video, Mic, Square, Play, Pause, Film,
  Menu, LogOut, Pencil, Users, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyACa7o2LxO62R-vczMH3yMbDXplQjZ5sDo",
  authDomain: "farah-portal.firebaseapp.com",
  projectId: "farah-portal",
  storageBucket: "farah-portal.firebasestorage.app",
  messagingSenderId: "854081964782",
  appId: "1:854081964782:web:290a706a87a7ff3a9b41ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'farah-portal-v2';
const LOGO_URL = "image-removebg-preview.png";

// --- Cloudinary Integration ---
const CLOUDINARY_CLOUD_NAME = "dgf5rdk10";
const CLOUDINARY_UPLOAD_PRESET = "lchat_preset";

// Identity of the Admin
const ADMIN_NAME = "ADMIN";
const ADMIN_ADM_ID = "0000";

// --- Global Helpers ---
const uploadToFileServer = async (fileInput) => {
  const fileToUpload = fileInput instanceof FileList ? fileInput : fileInput;
  if (!fileToUpload) throw new Error("No file selected");
  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  let resourceType = "auto";
if (fileToUpload.type && fileToUpload.type.startsWith("image/")) resourceType = "image";
else if (fileToUpload.type && fileToUpload.type.startsWith("video/")) resourceType = "video";

const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { 
  method: 'POST', 
  body: formData 
});

  const data = await response.json();
  return data.secure_url;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [committee, setCommittee] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // --- One-Time Login: restore session from localStorage ---
  useEffect(() => {
    const savedName = localStorage.getItem('farah_name');
    const savedAdmId = localStorage.getItem('farah_admId');
    const savedIsAdmin = localStorage.getItem('farah_isAdmin');
    const savedIsGuest = localStorage.getItem('farah_isGuest');
    if (savedName && savedAdmId) {
      setRegisteredName(savedName);
      setIsAdmin(savedIsAdmin === 'true');
      setIsGuest(savedIsGuest === 'true');
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (snap) => {
      setRegistry(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), (snap) => {
      setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'highlights'), (snap) => {
      setHighlights(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'committee'), (snap) => {
      setCommittee(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const admId = e.target.admId.value.trim();
    if (name === ADMIN_NAME && admId === ADMIN_ADM_ID) {
      localStorage.setItem('farah_name', 'Administrator');
      localStorage.setItem('farah_admId', admId);
      localStorage.setItem('farah_isAdmin', 'true');
      localStorage.removeItem('farah_isGuest');
      setIsGuest(false);
      setIsAuthenticated(true); setIsAdmin(true); setRegisteredName("Administrator"); return;
    }
    const match = registry.find(s => s.name.toLowerCase() === name.toLowerCase() && s.admId.toString() === admId.toString());
    if (match) {
      localStorage.setItem('farah_name', match.name);
      localStorage.setItem('farah_admId', admId);
      localStorage.setItem('farah_isAdmin', 'false');
      localStorage.removeItem('farah_isGuest');
      setIsGuest(false);
      setIsAuthenticated(true); setIsAdmin(false); setRegisteredName(match.name); setLoginError("");
    } else { setLoginError("Invalid credentials."); }
  };

  const handleGuestLogin = () => {
    localStorage.setItem('farah_name', 'Guest Visitor');
    localStorage.setItem('farah_admId', 'GUEST');
    localStorage.setItem('farah_isAdmin', 'false');
    localStorage.setItem('farah_isGuest', 'true');
    setRegisteredName('Guest Visitor');
    setIsAdmin(false);
    setIsGuest(true);
    setIsAuthenticated(true);
    setLoginError("");
  };

  const handleLogout = () => {
    localStorage.removeItem('farah_name');
    localStorage.removeItem('farah_admId');
    localStorage.removeItem('farah_isAdmin');
    localStorage.removeItem('farah_isGuest');
    setIsGuest(false);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setRegisteredName("");
    setCurrentPage('home');
    setDrawerOpen(false);
  };

  const navigate = (page) => {
    setCurrentPage(page);
    setSelectedChatUser(null);
    setDrawerOpen(false);
  };

  const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center mb-6 bg-[#111]">
               <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-4xl font-black text-[#d4af37] italic uppercase tracking-tighter">Farah Login</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <input name="name" placeholder="Full Name" required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#d4af37] text-sm" />
            <input name="admId" type="password" placeholder="Admission Number" required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#d4af37] text-sm" />
            {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{loginError}</p>}
            <button type="submit" className="w-full bg-[#d4af37] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2">Authorize <Lock size={16} /></button>
            <div className="pt-3 border-t border-white/5 mt-2">
              <button type="button" onClick={handleGuestLogin} className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:text-white hover:bg-white/10 transition-colors text-xs uppercase tracking-widest">
                Launch App <Users size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {isGuest && currentPage === 'home' && <PartyPopper />}
      {/* ===================== HAMBURGER DRAWER ===================== */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#0f0f0f] border-r border-white/5 z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] flex items-center justify-center bg-black shrink-0">
                  <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="font-black text-[#d4af37] text-sm uppercase tracking-tight">FARAH</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{registeredName}</p>
                </div>
              </div>

              {/* Drawer Nav */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { page: 'home',       label: 'Home',    icon: <Home size={18} /> },
                  { page: 'about',      label: 'About',   icon: <Info size={18} /> },
                  { page: 'highlights', label: 'Gallery', icon: <Layout size={18} /> },
                  { page: 'portal',     label: 'Blog',    icon: <BookOpen size={18} /> },
                  { page: 'messages',   label: 'Chat',    icon: <MessageSquare size={18} /> },
                  ...(isAdmin ? [{ page: 'admin', label: 'HQ', icon: <ShieldCheck size={18} /> }] : []),
                ].map(item => (
                  <button
                    key={item.page}
                    onClick={() => navigate(item.page)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${currentPage === item.page ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'text-gray-400 active:bg-white/5'}`}
                  >
                    {item.icon}
                    <span className="font-black text-sm uppercase tracking-wide">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-white/5">
                <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 active:bg-red-500/10 transition-all">
                  <LogOut size={18} />
                  <span className="font-black text-sm uppercase tracking-wide">Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===================== TOPBAR ===================== */}
      <header className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-30">
        <button onClick={() => setDrawerOpen(true)} className="p-2 text-gray-400 active:text-[#d4af37] transition-colors">
          <Menu size={22} />
        </button>
        <p className="flex-1 text-center text-[11px] font-black text-[#d4af37] uppercase tracking-[0.3em]">FARAH</p>
        <div className="w-9" />
      </header>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 pt-14 pb-32 overflow-x-hidden">
        <AnimatePresence mode="wait">

          {/* ---- HOME PAGE ---- */}
          {currentPage === 'home' && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center p-6">
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center w-full">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#d4af37] mb-6 flex items-center justify-center bg-black">
                  <img src={LOGO_URL} alt="Logo" className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-6xl font-black text-[#d4af37] tracking-tighter mb-2 italic">FARAH</h1>
                <p className="text-gray-400 tracking-[0.4em] uppercase text-[9px] mb-10 font-bold">Class Union Digital Portal</p>
                <button onClick={() => navigate('about')} className="bg-[#d4af37] text-black font-black py-4 px-10 rounded-full flex items-center gap-3 active:scale-95 transition-transform">
                  Welcome <ArrowRight size={20} />
                </button>
              </div>

              {/* Committee Display */}
              {committee.length > 0 && (
                <div className="w-full max-w-2xl mt-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Users size={18} className="text-[#d4af37]" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#d4af37]">Committee</h2>
                  </div>
                  <div className="bg-[#111] rounded-[2rem] border border-white/5 p-4 space-y-3 shadow-xl">
                    {committee.map(m => (
                      <div key={m.id} className="flex items-center gap-4 bg-black/40 rounded-2xl px-5 py-4 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                          <span className="text-[#d4af37] font-black text-sm">{(m.name || '?').toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-black text-sm text-white">{m.name}</p>
                          <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wide opacity-80">{m.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---- ABOUT PAGE ---- */}
          {currentPage === 'about' && (
            <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#d4af37]/10 rounded-2xl"><Info className="text-[#d4af37]" size={22} /></div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight leading-none mb-1">About</h2>
                  <p className="text-[#d4af37] text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Who We Are</p>
                </div>
              </div>

              {/* About Text */}
              <div className="bg-[#111] rounded-[2rem] border border-white/5 p-6 md:p-8 space-y-5 shadow-xl mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] flex items-center justify-center bg-black shrink-0">
                    <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <p className="font-black text-[#d4af37] text-lg uppercase italic tracking-tight">FARAH</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">15th Batch · NRIC</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  <span className="text-[#d4af37] font-black">FARAH</span> (Friends Association for Reformative and Academic Hopes) is the official class union of the students of <span className="font-bold text-white">Nahjurrashad Islamic College (NRIC)</span>, an institution affiliated with Darul Huda Islamic University. Representing the <span className="font-bold text-white">15th batch</span>, FARAH embodies unity, leadership, creativity, and academic excellence.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  As a dynamic student body, FARAH plays a central role in organizing academic, cultural, and extracurricular initiatives within the college. It provides a platform for students to nurture their talents, express their ideas, and actively contribute to the growth of the institution. Through its diverse programs, publications, and events, FARAH cultivates collaboration, discipline, and innovation.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Guided by its name—Friends Association for Reformative and Academic Hopes—the union emphasizes both moral development (reformative values) and educational aspiration (academic excellence). It reflects a collective vision of progress, responsibility, and purposeful learning.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Rooted in the vision and values of NRIC, FARAH strives to shape well-rounded individuals who contribute positively to society. More than just a batch identity, it stands as a purposeful movement driven by brotherhood, intellectual growth, and a shared commitment to excellence.
                </p>
              </div>

              {/* Social Media */}
              <div className="bg-[#111] rounded-[2rem] border border-white/5 p-6 shadow-xl space-y-5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Follow Us</p>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-2"><Instagram size={13} /> Instagram</p>
                  <a href="https://www.instagram.com/_tm.farah?igsh=MWd1czEweHlrdmpmYg==" target="_blank" rel="noreferrer"
                    className="flex items-center gap-4 bg-black/40 rounded-2xl px-5 py-4 border border-white/5 active:border-[#d4af37]/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shrink-0">
                      <Instagram size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">@_tm.farah</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">FARAH Official</p>
                    </div>
                  </a>
                  <a href="https://www.instagram.com/alif.talks?igsh=M3BoemYxOW8zN2Vz" target="_blank" rel="noreferrer"
                    className="flex items-center gap-4 bg-black/40 rounded-2xl px-5 py-4 border border-white/5 active:border-[#d4af37]/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shrink-0">
                      <Instagram size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">@alif.talks</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Alif Talks</p>
                    </div>
                  </a>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-2"><Youtube size={13} /> YouTube</p>
                  <a href="https://youtube.com/@_tm.farahh?si=QVQ3VzGhpVzQgpJ2" target="_blank" rel="noreferrer"
                    className="flex items-center gap-4 bg-black/40 rounded-2xl px-5 py-4 border border-white/5 active:border-[#d4af37]/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                      <Youtube size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">FARAH</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">@_tm.farahh</p>
                    </div>
                  </a>
                  <a href="https://youtube.com/@alif.talks_farah?si=bVPFUjrf8TqZdXns" target="_blank" rel="noreferrer"
                    className="flex items-center gap-4 bg-black/40 rounded-2xl px-5 py-4 border border-white/5 active:border-[#d4af37]/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                      <Youtube size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">Alif Talks</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">@alif.talks_farah</p>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* ---- GALLERY ---- */}
          {currentPage === 'highlights' && (
            <motion.div key="highlights" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <SectionHeader title="Gallery" subtitle="Visual Memories" icon={<Layout className="text-[#d4af37]" />} />
              <div className="grid gap-4">
                {highlights.map((h) => (
                  <div key={h.id} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 relative group">
                    {isAdmin && <button onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'highlights', h.id))} className="absolute top-2 right-2 z-10 bg-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    {h.mediaUrl?.includes("/video/upload") ? (
                      <video src={h.mediaUrl} controls className="aspect-video object-cover w-full" />
                    ) : (
                      <img src={h.mediaUrl} alt={h.title} className="aspect-video object-cover w-full" />
                    )}
                    <div className="p-5"><h3 className="font-bold text-[#d4af37]">{h.title}</h3><p className="text-sm text-gray-400">{h.description}</p></div>
                  </div>
                ))}
              </div>
              {isAdmin && <AddHighlightForm />}
            </motion.div>
          )}

          {/* ---- BLOG ---- */}
          {currentPage === 'portal' && (
            <motion.div key="portal" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <SectionHeader title="Union Blog" subtitle="Literature & Arts" icon={<BookOpen className="text-[#d4af37]" />} />
              <BlogSection blogs={blogs} isAdmin={isAdmin} />
            </motion.div>
          )}

          {/* ---- CHAT ---- */}
          {currentPage === 'messages' && (
            <motion.div key="messages" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-4 md:p-6 max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col">
              <SectionHeader title={isAdmin ? "Direct Messages" : "Consult Admin"} subtitle="Private Communication" icon={<MessageSquare className="text-[#d4af37]" />} />
              <MessagingSection user={user} isAdmin={isAdmin} name={registeredName} registry={registry} selectedChatUser={selectedChatUser} setSelectedChatUser={setSelectedChatUser} />
            </motion.div>
          )}

          {/* ---- ADMIN HQ ---- */}
          {currentPage === 'admin' && isAdmin && (
            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <SectionHeader title="HQ" subtitle="Batch 15 Management" icon={<ShieldCheck className="text-[#d4af37]" />} />
              <AdminDashboard registry={registry} committee={committee} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ===================== BOTTOM TAB BAR ===================== */}
      <div className="fixed bottom-6 left-0 w-full px-6 flex justify-center z-30">
        <nav className="w-full max-w-md bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl">
          <NavIcon icon={<Home size={20} />} label="Home" active={currentPage === 'home'} onClick={() => navigate('home')} />
          <NavIcon icon={<Layout size={20} />} label="Gallery" active={currentPage === 'highlights'} onClick={() => navigate('highlights')} />
          <NavIcon icon={<BookOpen size={20} />} label="Blog" active={currentPage === 'portal'} onClick={() => navigate('portal')} />
          <NavIcon icon={<MessageSquare size={20} />} label="Chat" active={currentPage === 'messages'} onClick={() => navigate('messages')} />
          {isAdmin && <NavIcon icon={<ShieldCheck size={20} />} label="HQ" active={currentPage === 'admin'} onClick={() => navigate('admin')} />}
        </nav>
      </div>
    </div>
  );
}

// ===================== SHARED COMPONENTS =====================

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-6 md:mb-10 flex items-center gap-4 md:gap-5">
      <div className="p-3 md:p-4 bg-[#d4af37]/10 rounded-2xl">{icon}</div>
      <div>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-none mb-1">{title}</h2>
        <p className="text-[#d4af37] text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">{subtitle}</p>
      </div>
    </div>
  );
}

function NavIcon({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-3xl transition-all ${active ? 'text-[#d4af37]' : 'text-gray-500'}`}>
      {icon}
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  );
}

// ===================== BLOG SECTION =====================

function BlogSection({ blogs, isAdmin }) {
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), {
      title: fd.get('title'), category: fd.get('category'), author: fd.get('author'),
      content: fd.get('content'), status: 'pending', createdAt: serverTimestamp()
    });
    e.target.reset(); setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowForm(!showForm)} className="w-full py-4 border-2 border-dashed border-[#d4af37]/30 rounded-3xl flex items-center justify-center gap-3 text-[#d4af37] font-black">
        {showForm ? <X size={20} /> : <Plus size={20} />} New Post
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-3xl space-y-4 border border-white/5 shadow-xl">
          <input name="title" placeholder="Title" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#d4af37]" />
          <select name="category" className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm">
            <option value="Story">Story</option>
            <option value="Poem">Poem</option>
            <option value="Essay">Essay</option>
          </select>
          <input name="author" placeholder="Author" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#d4af37]" />
          <textarea name="content" placeholder="Body..." rows={5} required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm resize-none outline-none focus:border-[#d4af37]" />
          <button className="w-full bg-[#d4af37] text-black font-black p-4 rounded-xl">Submit</button>
        </form>
      )}
      <div className="grid gap-6">
        {blogs.filter(b => b.status === 'approved' || isAdmin).map(blog => (
          <div key={blog.id} className="p-6 rounded-3xl bg-[#111] border border-white/5">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-black text-[#d4af37] uppercase bg-[#d4af37]/10 px-3 py-1 rounded-full">{blog.category}</span>
              {isAdmin && blog.status === 'pending' && (
                <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', blog.id), { status: 'approved' })} className="text-green-500"><Check size={18}/></button>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3">{blog.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{blog.content}</p>
            <div className="text-[11px] text-gray-500 font-black">— {blog.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== AUDIO PLAYER =====================

function AudioPlayer({ url, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    const audio = audioRef.current;
    const handleEnd = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnd);
    return () => { audio.removeEventListener('ended', handleEnd); audio.pause(); };
  }, [url]);

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl min-w-[160px] ${isMe ? 'bg-black/20' : 'bg-white/10'}`}>
      <button onClick={togglePlay} className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isMe ? 'bg-black/30 text-[#d4af37]' : 'bg-[#d4af37] text-black'}`}>
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className={`h-full ${isMe ? 'bg-black/40' : 'bg-[#d4af37]'} ${isPlaying ? 'animate-pulse' : ''}`} style={{ width: isPlaying ? '100%' : '0%', transition: 'width 2s linear' }} />
      </div>
      <span className="text-[10px] font-bold opacity-70 uppercase">Voice</span>
    </div>
  );
}

// ===================== MESSAGING SECTION =====================

function MessagingSection({ user, isAdmin, name, registry, selectedChatUser, setSelectedChatUser }) {
  const [msg, setMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    if (isAdmin && !selectedChatUser) return;
    const targetUid = isAdmin ? selectedChatUser.uid : user.uid;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(all.filter(m => m.channelId === targetUid).sort((a, b) => a.ts - b.ts));
    });
    return () => unsub();
  }, [selectedChatUser, isAdmin, user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const uploadToCloudinary = async (file, type = 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    let resourceType = 'image';
    if (type === 'audio' || type === 'video') resourceType = 'video';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleFileChange = (e) => {
    const f = e.target.files;
    if (!f) return;
    setSelectedFile(f);
    const type = f.type.startsWith('video/') ? 'video' : 'image';
    setFileType(type);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsUploading(true);
        const targetUid = isAdmin ? selectedChatUser.uid : user.uid;
        const url = await uploadToCloudinary(audioBlob, 'audio');
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
          text: '', file: url, fileType: 'audio', uid: user.uid, name, channelId: targetUid, ts: Date.now()
        });
        setIsUploading(false);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!msg.trim() && !selectedFile) return;
    const targetUid = isAdmin ? selectedChatUser.uid : user.uid;
    setIsUploading(true);
    try {
      let fileUrl = null;
      let resolvedFileType = null;
      if (selectedFile) {
        resolvedFileType = fileType;
        fileUrl = await uploadToCloudinary(selectedFile, fileType);
      }
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
        text: msg, file: fileUrl, fileType: resolvedFileType, uid: user.uid, name, channelId: targetUid, ts: Date.now()
      });
      setMsg(""); setSelectedFile(null); setPreviewUrl(null); setFileType(null);
    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  if (isAdmin && !selectedChatUser) {
    return (
      <div className="space-y-3 flex-1 overflow-y-auto pb-4">
        {registry.map(s => (
          <button key={s.id} onClick={() => setSelectedChatUser({ ...s, uid: s.admId })} className="w-full bg-[#111] p-5 rounded-3xl border border-white/5 flex justify-between items-center active:bg-white/5 transition-colors">
            <span className="font-bold">{s.name}</span><ArrowRight size={18} className="text-[#d4af37]" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-lg ${m.uid === user.uid ? 'bg-[#d4af37] text-black rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
              <p className="text-[9px] font-black uppercase opacity-60 mb-1">{m.name}</p>
              {m.text && <p className="text-sm font-medium">{m.text}</p>}
              {m.file && m.fileType === 'image' && (
                <img src={m.file} alt="attachment" className="mt-2 rounded-2xl max-w-[220px] max-h-[220px] object-cover" />
              )}
              {m.file && m.fileType === 'video' && (
                <video src={m.file} controls className="mt-2 rounded-2xl max-w-[220px]" />
              )}
              {m.file && m.fileType === 'audio' && (
                <div className="mt-2"><AudioPlayer url={m.file} isMe={m.uid === user.uid} /></div>
              )}
              {m.file && !m.fileType && (
                <a href={m.file} target="_blank" className="mt-2 flex items-center gap-1 underline text-[10px] font-bold"><FileText size={10} /> View Attachment</a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---- MESSAGE BAR ---- */}
      <div className="shrink-0 p-3 bg-[#0d0d0d] border-t border-white/5">

        {/* File preview thumbnail */}
        {previewUrl && (
          <div className="relative w-24 h-24 mb-2 bg-black rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-xl">
            {fileType === 'video' ? (
              <video src={previewUrl} className="w-full h-full object-cover opacity-60" />
            ) : (
              <img src={previewUrl} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {fileType === 'video' && <Film size={20} className="text-white opacity-80" />}
            </div>
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFileType(null); }}
              className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-lg z-10"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Input bubble with image/video pickers and text */}
          <div className="flex-1 min-w-0 bg-[#1a1a1a] border border-white/10 rounded-3xl flex items-end">
            {!isRecording ? (
              <>
                {/* Image button */}
                <label className="shrink-0 p-3 text-gray-300 active:text-[#d4af37] cursor-pointer">
                  <ImageIcon size={21} />
                  <input type="file" className="hidden" accept="image/*" ref={imageInputRef} onChange={handleFileChange} />
                </label>
                {/* Video button */}
                <label className="shrink-0 p-3 text-gray-300 active:text-[#d4af37] cursor-pointer">
                  <Video size={21} />
                  <input type="file" className="hidden" accept="video/*" ref={videoInputRef} onChange={handleFileChange} />
                </label>
                {/* Text input */}
                <textarea
                  rows="1"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 bg-transparent py-3 px-1 outline-none text-sm text-white resize-none max-h-28"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                />
                {/* Mic button — gold so always visible */}
                <button
                  onClick={startRecording}
                  className="shrink-0 p-3 text-[#d4af37] active:scale-90 transition-transform"
                >
                  <Mic size={21} />
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-between px-4 py-3 text-[#d4af37]">
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-sm font-black uppercase tracking-widest">Recording {recordingDuration}s</span>
                </div>
                <button onClick={stopRecording} className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-2xl shadow-lg active:scale-90">
                  <Square size={18} fill="currentColor" />
                </button>
              </div>
            )}
          </div>

          {/* Send button — always gold, always full opacity */}
          <button
            onClick={send}
            disabled={isUploading}
            className="shrink-0 w-12 h-12 bg-[#d4af37] text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== ADD HIGHLIGHT FORM =====================

function AddHighlightForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const fileInputRef = useRef(null);

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const url = await uploadToFileServer(files);
      setMediaUrl(url);
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  const post = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const finalUrl = mediaUrl || fd.get('url');
    if (!finalUrl) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'highlights'), {
      title: fd.get('title'), description: fd.get('desc'), mediaUrl: finalUrl, createdAt: serverTimestamp()
    });
    setMediaUrl(""); e.target.reset();
  };

  return (
    <form onSubmit={post} className="mt-12 bg-[#111] p-6 md:p-8 rounded-[2.5rem] border border-[#d4af37]/30 space-y-4">
      <div onClick={() => fileInputRef.current.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-black/40 overflow-hidden relative">
        {isUploading ? <Loader2 className="animate-spin text-[#d4af37]" /> : mediaUrl ? <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" /> : <Upload className="text-gray-500" />}
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleMediaUpload} />
      <input name="title" placeholder="Event Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#d4af37]" />
      <textarea name="desc" placeholder="Context..." required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm resize-none outline-none focus:border-[#d4af37]" />
      <button className="w-full bg-[#d4af37] text-black font-black p-4 rounded-2xl" disabled={isUploading}>Deploy Media</button>
    </form>
  );
}

// ===================== ADMIN DASHBOARD =====================

function AdminDashboard({ registry, committee }) {
  const [editingStudent, setEditingStudent] = useState(null);
  const [editPos, setEditPos] = useState("");
  const [activeTab, setActiveTab] = useState('students');

  const register = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), {
      name: f.get('name'), admId: f.get('admId'), pos: f.get('pos'), ts: serverTimestamp()
    });
    e.target.reset();
  };

  const savePosition = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', id), { pos: editPos });
    setEditingStudent(null);
    setEditPos("");
  };

  const addCommitteeMember = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'committee'), {
      name: f.get('cname'), position: f.get('cpos'), ts: serverTimestamp()
    });
    e.target.reset();
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 bg-[#111] p-1.5 rounded-2xl border border-white/5">
        {['students', 'committee'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#d4af37] text-black' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---- STUDENTS TAB ---- */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <form onSubmit={register} className="bg-[#111] p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Register Student</p>
            <input name="name" placeholder="Full Identity" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#d4af37]" />
            <input name="admId" placeholder="Admission ID" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#d4af37]" />
            <input name="pos" placeholder="Position" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#d4af37]" />
            <button className="w-full bg-[#d4af37] text-black font-black p-4 rounded-2xl">Register</button>
          </form>

          <div className="space-y-3">
            {registry.map(s => (
              <div key={s.id} className="bg-[#111] p-5 rounded-3xl border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-black text-lg">{s.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{s.admId}</p>
                    {editingStudent === s.id ? (
                      <div className="flex gap-2 mt-3">
                        <input
                          value={editPos}
                          onChange={(e) => setEditPos(e.target.value)}
                          placeholder="New position..."
                          className="flex-1 min-w-0 bg-black border border-[#d4af37]/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d4af37]"
                        />
                        <button onClick={() => savePosition(s.id)} className="bg-[#d4af37] text-black px-3 py-2 rounded-xl shrink-0"><Check size={14} /></button>
                        <button onClick={() => setEditingStudent(null)} className="bg-white/5 text-gray-400 px-3 py-2 rounded-xl shrink-0"><X size={14} /></button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#d4af37] font-bold mt-1">{s.pos}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditingStudent(s.id); setEditPos(s.pos || ""); }} className="text-[#d4af37] p-2.5 bg-[#d4af37]/10 rounded-xl active:scale-90">
                      <Pencil size={15}/>
                    </button>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', s.id))} className="text-red-500 p-2.5 bg-red-500/10 rounded-xl active:scale-90">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- COMMITTEE TAB ---- */}
      {activeTab === 'committee' && (
        <div className="space-y-6">
          <form onSubmit={addCommitteeMember} className="bg-[#111] p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Add Committee Member</p>
            <input name="cname" placeholder="Full Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#d4af37]" />
            <input name="cpos" placeholder="Position / Role" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#d4af37]" />
            <button className="w-full bg-[#d4af37] text-black font-black p-4 rounded-2xl">Add Member</button>
          </form>

          <div className="space-y-3">
            {committee.map(m => (
              <div key={m.id} className="bg-[#111] p-5 rounded-3xl flex justify-between items-center border border-white/5">
                <div>
                  <p className="font-black text-base">{m.name}</p>
                  <p className="text-[10px] text-[#d4af37] font-bold uppercase">{m.position}</p>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'committee', m.id))} className="text-red-500 p-2.5 bg-red-500/10 rounded-xl active:scale-90">
                  <Trash2 size={15}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PartyPopper() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('farah_guest_welcomed'));

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem('farah_guest_welcomed', 'true');
    const timer = setTimeout(() => setShow(false), 4500);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  const confetti = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 2.5,
    color: ['#d4af37', '#ffffff', '#8a7322', '#ff5e5e', '#5eff8a', '#3498db'][Math.floor(Math.random() * 6)],
    size: Math.random() * 6 + 4
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z- flex items-center justify-center overflow-hidden">
      {confetti.map(c => (
        <motion.div
          key={c.id}
          initial={{ y: -50, x: `${c.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', opacity: 0, rotate: 360 }}
          transition={{ duration: c.duration, delay: c.delay, ease: "easeOut" }}
          className="absolute top-0 rounded-sm"
          style={{ width: c.size, height: c.size, backgroundColor: c.color }}
        />
      ))}
      <motion.div 
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: -20 }}
        className="bg-[#111]/95 backdrop-blur-2xl border border-[#d4af37]/30 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 text-center pointer-events-auto mx-6"
      >
        <span className="text-6xl animate-bounce drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]">🎉</span>
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter">WELCOME GUEST</h2>
          <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.3em] mt-1">Enjoy the Farah Portal</p>
        </div>
      </motion.div>
    </div>
  );
}


```

