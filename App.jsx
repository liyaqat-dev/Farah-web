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
  Instagram, Youtube, Info, Filter, Trash2, Paperclip, ExternalLink, Loader2, Upload
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
const LOGO_URL = "https://res.cloudinary.com/dgf5rdk10/image/upload/v1775534830/image-removebg-preview_yupixf.svg";

// --- Cloudinary Config ---
const CLOUDINARY_CLOUD_NAME = "dgf5rdk10";
const CLOUDINARY_API_KEY = "656794471353496";
const CLOUDINARY_API_SECRET = "voU9AOVrwDMwALF9B5oZvihlM-E"; 
const CLOUDINARY_UPLOAD_PRESET = "ml_default"; 

// Identity of the Admin
const ADMIN_NAME = "ADMIN";
const ADMIN_ADM_ID = "0000";

// --- Global Helpers ---
const uploadToFileServer = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );
  
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || 'Upload failed');
  }
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
    const unsubBlogs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), (snap) => {
      setBlogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubHighlights = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'highlights'), (snap) => {
      setHighlights(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubBlogs(); unsubHighlights(); };
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const admId = e.target.admId.value.trim();

    if (name === ADMIN_NAME && admId === ADMIN_ADM_ID) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setRegisteredName("Administrator");
      return;
    }

    const match = registry.find(s => 
      s.name.toLowerCase() === name.toLowerCase() && s.admId.toString() === admId.toString()
    );

    if (match) {
      setIsAuthenticated(true);
      setIsAdmin(false);
      setRegisteredName(match.name);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials.");
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center mb-6 bg-[#111]">
               <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-4xl font-black text-[#d4af37] italic tracking-tighter uppercase">Farah Login</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <input name="name" placeholder="Full Name" required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#d4af37] text-sm" />
            <input name="admId" type="password" placeholder="Admission Number" required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#d4af37] text-sm" />
            {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{loginError}</p>}
            <button className="w-full bg-[#d4af37] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2">Authorize <Lock size={16} /></button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {currentPage !== 'home' && (
        <header className="p-4 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#d4af37] flex items-center justify-center bg-black overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="text-[#d4af37] font-black text-lg tracking-tighter">FARAH</h1>
          </div>
          <div className="text-[10px] text-[#d4af37] font-black uppercase tracking-tighter bg-[#d4af37]/10 px-3 py-1 rounded-full">{registeredName}</div>
        </header>
      )}

      <main className="flex-1 pb-28 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-6 flex items-center justify-center bg-black">
                <img src={LOGO_URL} alt="Logo" className="w-20 h-20 object-contain" />
              </div>
              <h1 className="text-6xl font-black text-[#d4af37] tracking-tighter mb-2 italic">FARAH</h1>
              <p className="text-gray-400 tracking-[0.4em] uppercase text-[9px] mb-10 font-bold">Class Union Digital Portal</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-10 mx-auto">
                 <div className="bg-[#111] p-4 rounded-2xl border border-white/5 text-left"><Star size={16} className="text-[#d4af37] mb-2" /><p className="text-[10px] font-bold text-gray-400 uppercase">Updates</p></div>
                 <div className="bg-[#111] p-4 rounded-2xl border border-white/5 text-left"><Trophy size={16} className="text-[#d4af37] mb-2" /><p className="text-[10px] font-bold text-gray-400 uppercase">Batch '15</p></div>
              </div>
              <button onClick={() => setCurrentPage('about')} className="bg-[#d4af37] text-black font-black py-4 px-10 rounded-full hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-[#d4af37]/20 active:scale-95">Welcome <ArrowRight size={20} /></button>
            </motion.div>
          )}

          {currentPage === 'about' && (
            <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto space-y-8">
              <SectionHeader title="About Us" subtitle="Identity & Vision" icon={<Info className="text-[#d4af37]" />} />
              <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 leading-relaxed text-gray-300 text-sm space-y-4">
                <p><strong>FARAH (Friends Association for Reformative and Academic Hopes)</strong> is the official class union of the students of Nahjurrashad Islamic College (NRIC), an institution affiliated with Darul Huda Islamic University.</p>
                <p>Representing the 15th batch, FARAH embodies unity, leadership, creativity, and academic excellence. Guided by its name, the union emphasizes both moral development and educational aspiration.</p>
                <div className="pt-4 flex gap-4">
                  <a href="https://www.instagram.com/_tm.farah?igsh=MWd1czEweHlrdmpmYg==" target="_blank" className="flex items-center gap-2 text-[#d4af37] hover:underline"><Instagram size={16}/> FARAH</a>
                  <a href="https://www.instagram.com/alif.talks?igsh=M3BoemYxOW8zN2Vz" target="_blank" className="flex items-center gap-2 text-[#d4af37] hover:underline"><Instagram size={16}/> Alif Talks</a>
                </div>
                <div className="flex gap-4">
                  <a href="https://youtube.com/@_tm.farahh?si=VQ3VzGhpVzQgpJ2" target="_blank" className="flex items-center gap-2 text-[#d4af37] hover:underline"><Youtube size={16}/> YouTube</a>
                  <a href="https://youtube.com/@alif.talks_farah?si=bVPFUjrf8TqZdXns" target="_blank" className="flex items-center gap-2 text-[#d4af37] hover:underline"><Youtube size={16}/> Alif YT</a>
                </div>
              </div>
              <button onClick={() => setCurrentPage('portal')} className="w-full bg-[#d4af37] text-black font-black py-4 rounded-2xl">Enter Portal</button>
            </motion.div>
          )}

          {currentPage === 'highlights' && (
            <motion.div key="highlights" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
              <SectionHeader title="Gallery" subtitle="Visual Memories" icon={<Layout className="text-[#d4af37]" />} />
              <div className="grid gap-4">
                {highlights.map((h) => (
                  <div key={h.id} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 relative group">
                    {isAdmin && <button onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'highlights', h.id))} className="absolute top-2 right-2 z-10 bg-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    {h.mediaUrl && <img src={h.mediaUrl} alt={h.title} className="aspect-video object-cover w-full" />}
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
            <motion.div key="messages" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">
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

      <div className="fixed bottom-6 left-0 w-full px-6 flex justify-center z-50">
        <nav className="w-full max-w-md bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl">
          <NavIcon icon={<Home size={20} />} label="Home" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} />
          <NavIcon icon={<Layout size={20} />} label="Gallery" active={currentPage === 'highlights'} onClick={() => setCurrentPage('highlights')} />
          <NavIcon icon={<BookOpen size={20} />} label="Portal" active={currentPage === 'portal'} onClick={() => setCurrentPage('portal')} />
          <NavIcon icon={<MessageSquare size={20} />} label="Chat" active={currentPage === 'messages'} onClick={() => { setCurrentPage('messages'); setSelectedChatUser(null); }} />
          <NavIcon icon={<Info size={20} />} label="About" active={currentPage === 'about'} onClick={() => setCurrentPage('about')} />
          {isAdmin && <NavIcon icon={<ShieldCheck size={20} />} label="HQ" active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} />}
        </nav>
      </div>
    </div>
  );
}

// --- Components ---

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-10 flex items-center gap-5">
      <div className="p-4 bg-[#d4af37]/10 rounded-2xl shadow-inner shadow-[#d4af37]/5">{icon}</div>
      <div><h2 className="text-4xl font-black tracking-tight leading-none mb-1">{title}</h2><p className="text-[#d4af37] text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">{subtitle}</p></div>
    </div>
  );
}

function NavIcon({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-3xl transition-all relative ${active ? 'text-[#d4af37]' : 'text-gray-500 hover:text-white'}`}>
      {active && <motion.div layoutId="nav-bg" className="absolute inset-0 bg-[#d4af37]/10 rounded-[2rem] -z-10" />}
      {icon}<span className={`text-[9px] font-black uppercase tracking-tighter transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  );
}

function BlogSection({ blogs, isAdmin }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), {
      title: fd.get('title'),
      category: fd.get('category'),
      author: fd.get('author'),
      content: fd.get('content'),
      status: 'pending',
      createdAt: serverTimestamp()
    });
    e.target.reset(); setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["All", "Story", "Poem", "Essay"].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${filter === cat ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'border-white/10 text-gray-500'}`}>{cat}</button>
        ))}
      </div>

      <button onClick={() => setShowForm(!showForm)} className="w-full py-4 border-2 border-dashed border-[#d4af37]/30 rounded-3xl flex items-center justify-center gap-3 text-[#d4af37] font-black">
        {showForm ? <X size={20} /> : <Plus size={20} />} {showForm ? 'Cancel' : 'New Post'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4">
          <input name="title" placeholder="Title" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm" />
          <select name="category" className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm appearance-none">
            <option value="Story">Story</option><option value="Poem">Poem</option><option value="Essay">Essay</option>
          </select>
          <input name="author" placeholder="Author" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm" />
          <textarea name="content" placeholder="Body..." rows={5} required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm resize-none" />
          <button className="w-full bg-[#d4af37] text-black font-black p-4 rounded-xl">Submit</button>
        </form>
      )}

      <div className="grid gap-6">
        {blogs.filter(b => (filter === "All" || b.category === filter) && (b.status === 'approved' || isAdmin)).map(blog => (
          <div key={blog.id} className="p-6 rounded-3xl bg-[#111] border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-[#d4af37] uppercase bg-[#d4af37]/10 px-3 py-1 rounded-full">{blog.category}</span>
              {isAdmin && (
                <div className="flex gap-2">
                  {blog.status === 'pending' && <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', blog.id), { status: 'approved' })} className="text-green-500 p-2"><Check size={18}/></button>}
                  <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', blog.id))} className="text-red-500 p-2"><Trash2 size={18}/></button>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black mb-3">{blog.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{blog.content}</p>
            <div className="text-[11px] text-gray-500 font-black uppercase">— {blog.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagingSection({ user, isAdmin, name, registry, selectedChatUser, setSelectedChatUser }) {
  const [msg, setMsg] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAdmin && !selectedChatUser) return;
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const targetUid = isAdmin ? selectedChatUser.uid : user.uid;
    
    const unsub = onSnapshot(chatRef, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = all.filter(m => m.channelId === targetUid).sort((a,b) => a.ts - b.ts);
      setMessages(filtered);
    });
    return () => unsub();
  }, [selectedChatUser, isAdmin, user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files;
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToFileServer(file);
      setFileUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!msg.trim() && !fileUrl.trim()) return;
    const targetUid = isAdmin ? selectedChatUser.uid : user.uid;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {
      text: msg,
      file: fileUrl,
      uid: user.uid,
      name: name,
      channelId: targetUid,
      ts: Date.now()
    });
    setMsg(""); setFileUrl("");
  };

  if (isAdmin && !selectedChatUser) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500 text-sm font-bold uppercase mb-4">Active Private Channels</p>
        {registry.map(s => (
          <button key={s.id} onClick={() => setSelectedChatUser({ ...s, uid: s.admId })} className="w-full bg-[#111] p-5 rounded-3xl border border-white/5 flex justify-between items-center hover:border-[#d4af37]/30 transition-all">
            <div className="flex items-center gap-4"><User size={20} className="text-[#d4af37]" /><span className="font-bold">{s.name}</span></div>
            <ArrowRight size={18} className="text-gray-600" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] max-h-[70vh] bg-[#111] rounded-[2.5rem] border border-white/5 overflow-hidden">
      <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-black text-[#d4af37] uppercase">{isAdmin ? `Chat with ${selectedChatUser.name}` : "Admin Support"}</span>
        {isAdmin && <button onClick={() => setSelectedChatUser(null)} className="text-gray-500 hover:text-white"><X size={18}/></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl ${m.uid === user.uid ? 'bg-[#d4af37] text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>
              <p className="text-[9px] font-black uppercase opacity-60 mb-1">{m.name}</p>
              <p className="text-sm font-semibold">{m.text}</p>
              {m.file && (
                <a href={m.file} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 bg-black/20 p-2 rounded-lg text-[10px] hover:bg-black/40">
                  <FileText size={12}/> {m.file.split('/').pop().substring(0, 20)}...
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 md:p-4 bg-black/40 space-y-2 border-t border-white/5">
        {fileUrl && (
          <div className="flex items-center justify-between bg-[#d4af37]/10 p-2 rounded-xl">
             <span className="text-[10px] text-[#d4af37] font-bold">File Attached</span>
             <button type="button" onClick={() => setFileUrl("")}><X size={14} className="text-red-500"/></button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 md:p-4 bg-white/5 rounded-2xl text-gray-400 hover:text-[#d4af37] flex-shrink-0">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message..." className="flex-1 bg-black border border-white/10 rounded-2xl px-4 py-3 md:px-5 md:py-4 text-sm outline-none focus:border-[#d4af37] w-full min-w-0" />
          <button type="submit" className="bg-[#d4af37] text-black p-3 md:p-4 rounded-2xl flex-shrink-0 shadow-lg shadow-[#d4af37]/20">
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminDashboard({ registry }) {
  const register = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), {
      name: f.get('name'), admId: f.get('admId'), pos: f.get('pos'), perf: f.get('perf'), ts: serverTimestamp()
    });
    e.target.reset();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={register} className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-5">
        <h3 className="text-xl font-black flex items-center gap-3 text-[#d4af37]"><UserPlus size={20} /> New Member</h3>
        <input name="name" placeholder="Full Identity" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm" />
        <input name="admId" placeholder="Admission ID (Password)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm" />
        <input name="pos" placeholder="Position" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm" />
        <select name="perf" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm appearance-none">
          <option value="Elite">Performance: Elite</option><option value="Strong">Strong</option><option value="Developing">Developing</option>
        </select>
        <button className="w-full bg-[#d4af37] text-black font-black p-5 rounded-2xl">Register</button>
      </form>

      <div className="space-y-4">
        <h3 className="text-xl font-black flex items-center gap-3 text-[#d4af37]"><Layout size={20} /> Active Registry</h3>
        {registry.map(s => (
          <div key={s.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex justify-between items-center group">
            <div>
              <p className="font-black text-lg">{s.name}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">{s.admId} • {s.pos}</p>
            </div>
            <button onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', s.id))} className="text-red-500 opacity-0 group-hover:opacity-100 p-3 bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddHighlightForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const fileInputRef = useRef(null);

  const handleMediaUpload = async (e) => {
    const file = e.target.files;
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToFileServer(file);
      setMediaUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const post = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'highlights'), {
      title: fd.get('title'), 
      description: fd.get('desc'), 
      mediaUrl: mediaUrl || fd.get('url'), 
      createdAt: serverTimestamp()
    });
    setMediaUrl("");
    e.target.reset();
  };

  return (
    <form onSubmit={post} className="mt-12 bg-[#111] p-8 rounded-[2.5rem] border border-[#d4af37]/30 space-y-5">
      <h3 className="text-xl font-black flex items-center gap-3 text-[#d4af37]"><ImageIcon size={20} /> New Media</h3>
      
      <div 
        onClick={() => fileInputRef.current.click()}
        className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#d4af37]/30 transition-colors bg-black/40 relative overflow-hidden"
      >
        {isUploading ? (
          <Loader2 className="animate-spin text-[#d4af37]" />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <>
            <Upload size={24} className="text-gray-500 mb-2" />
            <p className="text-[10px] text-gray-500 font-bold uppercase">Upload from Gallery</p>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
      
      <div className="text-center text-[9px] text-gray-600 font-bold uppercase">OR PASTE URL BELOW</div>
      
      <input name="title" placeholder="Event Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm" />
      <textarea name="desc" placeholder="Context..." rows={3} required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm resize-none" />
      <input name="url" placeholder="Manual Media URL (Optional if uploaded)" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm" />
      
      <button className="w-full bg-[#d4af37] text-black font-black p-5 rounded-2xl disabled:opacity-50" disabled={isUploading}>
        Deploy Media
      </button>
    </form>
  );
}

