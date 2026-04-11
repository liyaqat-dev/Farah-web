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
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Home, Zap, BookOpen, ShieldCheck, MessageSquare, 
  Image as ImageIcon, Plus, Check, X, Send, 
  UserPlus, FileText, Layout, ArrowRight, User, Star, Trophy, Lock,
  Instagram, Youtube, Info, Filter, Trash2, Paperclip, ExternalLink, Loader2, Upload,
  Video, Mic, Square, Play, Pause, Film
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
  if (fileToUpload.type.startsWith("image/")) resourceType = "image";
  else if (fileToUpload.type.startsWith("video/")) resourceType = "video";
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: 'POST', body: formData });
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);

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
      setBlogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'highlights'), (snap) => {
      setHighlights(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const admId = e.target.admId.value.trim();
    if (name === ADMIN_NAME && admId === ADMIN_ADM_ID) {
      setIsAuthenticated(true); setIsAdmin(true); setRegisteredName("Administrator"); return;
    }
    const match = registry.find(s => s.name.toLowerCase() === name.toLowerCase() && s.admId.toString() === admId.toString());
    if (match) { setIsAuthenticated(true); setIsAdmin(false); setRegisteredName(match.name); setLoginError(""); } 
    else { setLoginError("Invalid credentials."); }
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
            <button className="w-full bg-[#d4af37] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2">Authorize <Lock size={16} /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <main className="flex-1 pb-32 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#d4af37] mb-6 flex items-center justify-center bg-black">
                <img src={LOGO_URL} alt="Logo" className="w-20 h-20 object-contain" />
              </div>
              <h1 className="text-6xl font-black text-[#d4af37] tracking-tighter mb-2 italic">FARAH</h1>
              <p className="text-gray-400 tracking-[0.4em] uppercase text-[9px] mb-10 font-bold">Class Union Digital Portal</p>
              <button onClick={() => setCurrentPage('portal')} className="bg-[#d4af37] text-black font-black py-4 px-10 rounded-full flex items-center gap-3 active:scale-95 transition-transform">Welcome <ArrowRight size={20} /></button>
            </motion.div>
          )}

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

          {currentPage === 'portal' && (
            <motion.div key="portal" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <SectionHeader title="Union Blog" subtitle="Literature & Arts" icon={<BookOpen className="text-[#d4af37]" />} />
              <BlogSection blogs={blogs} isAdmin={isAdmin} />
            </motion.div>
          )}

          {currentPage === 'messages' && (
            <motion.div key="messages" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-4 md:p-6 max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col">
              <SectionHeader title={isAdmin ? "Direct Messages" : "Consult Admin"} subtitle="Private Communication" icon={<MessageSquare className="text-[#d4af37]" />} />
              <MessagingSection user={user} isAdmin={isAdmin} name={registeredName} registry={registry} selectedChatUser={selectedChatUser} setSelectedChatUser={setSelectedChatUser} />
            </motion.div>
          )}

          {currentPage === 'admin' && isAdmin && (
            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <SectionHeader title="HQ" subtitle="Batch 15 Management" icon={<ShieldCheck className="text-[#d4af37]" />} />
              <AdminDashboard registry={registry} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-6 left-0 w-full px-6 flex justify-center z-">
        <nav className="w-full max-w-md bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl">
          <NavIcon icon={<Home size={20} />} label="Home" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} />
          <NavIcon icon={<Layout size={20} />} label="Gallery" active={currentPage === 'highlights'} onClick={() => setCurrentPage('highlights')} />
          <NavIcon icon={<BookOpen size={20} />} label="Portal" active={currentPage === 'portal'} onClick={() => setCurrentPage('portal')} />
          <NavIcon icon={<MessageSquare size={20} />} label="Chat" active={currentPage === 'messages'} onClick={() => { setCurrentPage('messages'); setSelectedChatUser(null); }} />
          {isAdmin && <NavIcon icon={<ShieldCheck size={20} />} label="HQ" active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} />}
        </nav>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-6 md:mb-10 flex items-center gap-4 md:gap-5">
      <div className="p-3 md:p-4 bg-[#d4af37]/10 rounded-2xl">{icon}</div>
      <div><h2 className="text-2xl md:text-4xl font-black tracking-tight leading-none mb-1">{title}</h2><p className="text-[#d4af37] text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">{subtitle}</p></div>
    </div>
  );
}

function NavIcon({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-3xl transition-all ${active ? 'text-[#d4af37]' : 'text-gray-500'}`}>
      {icon}<span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  );
}

function BlogSection({ blogs, isAdmin }) {
  const [showForm, setShowForm] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), { title: fd.get('title'), category: fd.get('category'), author: fd.get('author'), content: fd.get('content'), status: 'pending', createdAt: serverTimestamp() });
    e.target.reset(); setShowForm(false);
  };
  return (
    <div className="space-y-6">
      <button onClick={() => setShowForm(!showForm)} className="w-full py-4 border-2 border-dashed border-[#d4af37]/30 rounded-3xl flex items-center justify-center gap-3 text-[#d4af37] font-black">{showForm ? <X size={20} /> : <Plus size={20} />} New Post</button>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-3xl space-y-4 border border-white/5 shadow-xl">
          <input name="title" placeholder="Title" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#d4af37]" />
          <select name="category" className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm"><option value="Story">Story</option><option value="Poem">Poem</option><option value="Essay">Essay</option></select>
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
              {isAdmin && blog.status === 'pending' && <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', blog.id), { status: 'approved' })} className="text-green-500"><Check size={18}/></button>}
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3">{blog.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{blog.content}</p>
            <div className="text-[11px] text-gray-500 font-black">\u2014 {blog.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- AUDIO PLAYER COMPONENT ---
function AudioPlayer({ url, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    const audio = audioRef.current;
    const handleEnd = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnd);
    return () => {
      audio.removeEventListener('ended', handleEnd);
      audio.pause();
    };
  }, [url]);

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl min-w-[160px] ${isMe ? 'bg-black/20' : 'bg-white/10'}`}>
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isMe ? 'bg-black/30 text-[#d4af37]' : 'bg-[#d4af37] text-black'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full ${isMe ? 'bg-black/40' : 'bg-[#d4af37]'} ${isPlaying ? 'animate-pulse' : ''}`}
          style={{ width: isPlaying ? '100%' : '0%', transition: 'width 2s linear' }}
        />
      </div>
      <span className="text-[10px] font-bold opacity-70 uppercase">Voice</span>
    </div>
  );
}

// --- MESSAGING SECTION ---
function MessagingSection({ user, isAdmin, name, registry, selectedChatUser, setSelectedChatUser }) {
  const [msg, setMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
