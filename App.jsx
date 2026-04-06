import React, { useState, useEffect, useRef } from 'react';

import { initializeApp } from 'firebase/app';

import { 

  getFirestore, 

  collection, 

  onSnapshot, 

  addDoc, 

  updateDoc, 

  doc, 

  query, 

  where,

  serverTimestamp 

} from 'firebase/firestore';

import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import { 

  Home, Zap, BookOpen, ShieldCheck, MessageSquare, 

  Image as ImageIcon, Plus, Check, X, Send, 

  UserPlus, FileText, Layout, ArrowRight, User, Star, Trophy, Lock

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



// Identity of the Admin

const ADMIN_NAME = "ADMIN";

const ADMIN_ADM_ID = "0000";



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



  useEffect(() => {

    const initAuth = async () => {

      try {

        await signInAnonymously(auth);

      } catch (err) {

        console.error("Auth Error:", err);

      }

    };

    initAuth();

    

    const unsubscribe = onAuthStateChanged(auth, (u) => {

      setUser(u);

    });

    return () => unsubscribe();

  }, []);



  // Listen for registry to allow login

  useEffect(() => {

    if (!user) return;

    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (snap) => {

      setRegistry(snap.docs.map(d => ({ id: d.id, ...d.data() })));

    });

    return () => unsub();

  }, [user]);



  // Real-time Listeners for Blogs and Highlights

  useEffect(() => {

    if (!isAuthenticated) return;



    const blogRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');

    const highlightRef = collection(db, 'artifacts', appId, 'public', 'data', 'highlights');

    

    const unsubBlogs = onSnapshot(blogRef, (snapshot) => {

      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    }, (err) => console.error("Blog fetch error:", err));



    const unsubHighlights = onSnapshot(highlightRef, (snapshot) => {

      setHighlights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    }, (err) => console.error("Highlight fetch error:", err));



    return () => { unsubBlogs(); unsubHighlights(); };

  }, [isAuthenticated]);



  const handleLogin = (e) => {

    e.preventDefault();

    const name = e.target.name.value.trim();

    const admId = e.target.admId.value.trim();



    // Check Admin Identity

    if (name === ADMIN_NAME && admId === ADMIN_ADM_ID) {

      setIsAuthenticated(true);

      setIsAdmin(true);

      setRegisteredName("Administrator");

      return;

    }



    // Check Registry for students

    const match = registry.find(s => 

      s.name.toLowerCase() === name.toLowerCase() && 

      s.admId.toString() === admId.toString()

    );



    if (match) {

      setIsAuthenticated(true);

      setIsAdmin(false);

      setRegisteredName(match.name);

      setLoginError("");

    } else {

      setLoginError("Invalid credentials. Access denied.");

    }

  };



  const pageVariants = {

    initial: { opacity: 0, y: 10 },

    animate: { opacity: 1, y: 0 },

    exit: { opacity: 0, y: -10 }

  };



  if (!isAuthenticated) {

    return (

      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">

          <div className="text-center mb-10">

            <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center mb-6 bg-[#111]">

               <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />

            </div>

            <h1 className="text-4xl font-black text-[#d4af37] italic tracking-tighter">PORTAL ACCESS</h1>

            <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">Secure Class Gateway</p>

          </div>



          <form onSubmit={handleLogin} className="space-y-4 bg-[#111] p-8 rounded-[2.5rem] border border-white/5">

            <div className="space-y-1">

              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Candidate Name</label>

              <input name="name" required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#d4af37] text-sm transition-all" />

            </div>

            <div className="space-y-1">

              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Admission Number</label>

              <input name="admId" type="password" required className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-[#d4af37] text-sm transition-all" />

            </div>

            {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-tighter">{loginError}</p>}

            <button className="w-full bg-[#d4af37] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#c4a02c] transition-colors mt-4">

              Authorize <Lock size={16} />

            </button>

          </form>

        </motion.div>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#d4af37]/30">

      {/* Header */}

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



      <main className="flex-1 pb-28">

        <AnimatePresence mode="wait">

          {currentPage === 'home' && (

            <motion.div 

              key="home"

              variants={pageVariants}

              initial="initial"

              animate="animate"

              exit="exit"

              className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center"

            >

              <motion.div 

                initial={{ scale: 0.8, opacity: 0 }}

                animate={{ scale: 1, opacity: 1 }}

                className="w-32 h-32 mx-auto rounded-full border-4 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-6 flex items-center justify-center bg-black"

              >

                <img src={LOGO_URL} alt="Logo" className="w-20 h-20 object-contain" />

              </motion.div>

              <h1 className="text-6xl font-black text-[#d4af37] tracking-tighter mb-2 italic">FARAH</h1>

              <p className="text-gray-400 tracking-[0.4em] uppercase text-[9px] mb-10 font-bold">Class Union Digital Portal</p>

              

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-10 mx-auto">

                 <div className="bg-[#111] p-4 rounded-2xl border border-white/5 text-left">

                    <Star size={16} className="text-[#d4af37] mb-2" />

                    <p className="text-[10px] font-bold text-gray-400 uppercase">Updates</p>

                 </div>

                 <div className="bg-[#111] p-4 rounded-2xl border border-white/5 text-left">

                    <Trophy size={16} className="text-[#d4af37] mb-2" />

                    <p className="text-[10px] font-bold text-gray-400 uppercase">Batch '25</p>

                 </div>

              </div>



              <button 

                onClick={() => setCurrentPage('portal')}

                className="bg-[#d4af37] text-black font-black py-4 px-10 rounded-full hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-[#d4af37]/20 active:scale-95"

              >

                Launch Portal <ArrowRight size={20} />

              </button>

            </motion.div>

          )}



          {currentPage === 'highlights' && (

            <motion.div key="highlights" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">

              <SectionHeader title="Moments" subtitle="Highlights & Gallery" icon={<Zap className="text-[#d4af37]" />} />

              <div className="grid gap-4">

                {highlights.map((h) => (

                  <div key={h.id} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 group">

                    {h.mediaUrl && (

                        <div className="aspect-video bg-gray-900 relative overflow-hidden">

                            <img src={h.mediaUrl} alt={h.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />

                        </div>

                    )}

                    <div className="p-5">

                      <h3 className="font-bold text-lg text-[#d4af37] mb-1">{h.title}</h3>

                      <p className="text-sm text-gray-400 leading-relaxed">{h.description}</p>

                    </div>

                  </div>

                ))}

                {highlights.length === 0 && (

                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">

                        <p className="text-gray-600 font-medium">No highlights posted yet.</p>

                    </div>

                )}

              </div>

              {isAdmin && <AddHighlightForm />}

            </motion.div>

          )}



          {currentPage === 'portal' && (

            <motion.div key="portal" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">

              <SectionHeader title="Union Blog" subtitle="Community Voices" icon={<BookOpen className="text-[#d4af37]" />} />

              <BlogSection blogs={blogs} isAdmin={isAdmin} />

            </motion.div>

          )}



          {currentPage === 'messages' && (

            <motion.div key="messages" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">

              <SectionHeader title="Direct" subtitle="Encrypted Communication" icon={<MessageSquare className="text-[#d4af37]" />} />

              <MessagingSection user={user} isAdmin={isAdmin} name={registeredName} />

            </motion.div>

          )}



          {currentPage === 'admin' && isAdmin && (

            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 max-w-2xl mx-auto">

              <SectionHeader title="HQ" subtitle="Management System" icon={<ShieldCheck className="text-[#d4af37]" />} />

              <AdminDashboard registry={registry} />

            </motion.div>

          )}

        </AnimatePresence>

      </main>



      {/* Centered Modern Navigation */}

      <div className="fixed bottom-6 left-0 w-full px-6 flex justify-center z-50">

        <nav className="w-full max-w-md bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl shadow-black">

          <NavIcon icon={<Home size={20} />} label="Home" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} />

          <NavIcon icon={<Zap size={20} />} label="Events" active={currentPage === 'highlights'} onClick={() => setCurrentPage('highlights')} />

          <NavIcon icon={<BookOpen size={20} />} label="Portal" active={currentPage === 'portal'} onClick={() => setCurrentPage('portal')} />

          <NavIcon icon={<MessageSquare size={20} />} label="Chat" active={currentPage === 'messages'} onClick={() => setCurrentPage('messages')} />

          {isAdmin && <NavIcon icon={<ShieldCheck size={20} />} label="HQ" active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} />}

        </nav>

      </div>

    </div>

  );

}



// --- Internal Components ---



function SectionHeader({ title, subtitle, icon }) {

  return (

    <div className="mb-10 flex items-center gap-5">

      <div className="p-4 bg-[#d4af37]/10 rounded-2xl shadow-inner shadow-[#d4af37]/5">{icon}</div>

      <div>

        <h2 className="text-4xl font-black tracking-tight leading-none mb-1">{title}</h2>

        <p className="text-[#d4af37] text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">{subtitle}</p>

      </div>

    </div>

  );

}



function NavIcon({ icon, label, active, onClick }) {

  return (

    <button 

      onClick={onClick} 

      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-3xl transition-all duration-300 relative ${active ? 'text-[#d4af37]' : 'text-gray-500 hover:text-white'}`}

    >

      {active && (

          <motion.div 

            layoutId="nav-bg"

            className="absolute inset-0 bg-[#d4af37]/10 rounded-[2rem] -z-10"

            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}

          />

      )}

      {icon}

      <span className={`text-[9px] font-black uppercase tracking-tighter transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>

    </button>

  );

}



function BlogSection({ blogs, isAdmin }) {

  const [showForm, setShowForm] = useState(false);

  

  const handleSubmit = async (e) => {

    e.preventDefault();

    const fd = new FormData(e.target);

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'blogs'), {

      title: fd.get('title'),

      author: fd.get('author'),

      content: fd.get('content'),

      status: 'pending',

      createdAt: serverTimestamp()

    });

    e.target.reset();

    setShowForm(false);

  };



  return (

    <div className="space-y-6">

      <button 

        onClick={() => setShowForm(!showForm)}

        className="w-full py-4 border-2 border-dashed border-[#d4af37]/30 rounded-3xl flex items-center justify-center gap-3 text-[#d4af37] font-black hover:bg-[#d4af37]/5 transition-colors"

      >

        {showForm ? <X size={20} /> : <Plus size={20} />} {showForm ? 'Cancel Submission' : 'Submit Publication'}

      </button>



      {showForm && (

        <motion.form 

            initial={{ opacity: 0, scale: 0.95 }}

            animate={{ opacity: 1, scale: 1 }}

            onSubmit={handleSubmit} 

            className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4"

        >

          <input name="title" placeholder="Publication Title" required className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#d4af37] text-sm" />

          <input name="author" placeholder="Author Name" required className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#d4af37] text-sm" />

          <textarea name="content" placeholder="Content Body..." rows={6} required className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-[#d4af37] text-sm resize-none" />

          <button type="submit" className="w-full bg-[#d4af37] text-black font-black p-4 rounded-xl shadow-lg shadow-[#d4af37]/10">Submit for Review</button>

        </motion.form>

      )}



      <div className="grid gap-6">

        {blogs.filter(b => b.status === 'approved' || isAdmin).map(blog => (

          <div key={blog.id} className="group p-6 rounded-3xl bg-[#111] border border-white/5 hover:border-[#d4af37]/20 transition-all">

            <div className="flex justify-between items-start mb-4">

              <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${blog.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>

                {blog.status}

              </span>

              {isAdmin && blog.status === 'pending' && (

                <button 

                  onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', blog.id), { status: 'approved' })}

                  className="text-green-500 hover:bg-green-500/10 p-2 rounded-xl transition-colors"

                >

                  <Check size={18} />

                </button>

              )}

            </div>

            <h3 className="text-2xl font-black mb-3 group-hover:text-[#d4af37] transition-colors">{blog.title}</h3>

            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4">{blog.content}</p>

            <div className="flex items-center gap-3 text-[11px] text-gray-500 font-black uppercase">

              <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">

                <User size={12} />

              </div>

              {blog.author}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}



function MessagingSection({ user, isAdmin, name }) {

  const [msg, setMsg] = useState("");

  const [messages, setMessages] = useState([]);



  useEffect(() => {

    const q = collection(db, 'artifacts', appId, 'public', 'data', 'chats');

    const unsub = onSnapshot(q, (snapshot) => {

      const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.ts - b.ts);

      setMessages(sorted);

    });

    return () => unsub();

  }, []);



  const send = async (e) => {

    e.preventDefault();

    if (!msg.trim()) return;

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), {

      text: msg,

      uid: user.uid,

      name: name,

      ts: Date.now()

    });

    setMsg("");

  };



  return (

    <div className="flex flex-col h-[65vh] bg-[#111] rounded-[2.5rem] border border-white/5 overflow-hidden">

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {messages.map(m => (

          <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>

            <div className={`max-w-[85%] p-4 rounded-3xl ${m.uid === user.uid ? 'bg-[#d4af37] text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>

              <p className="text-[9px] font-black uppercase tracking-tighter opacity-60 mb-1">{m.name}</p>

              <p className="text-sm font-semibold leading-relaxed">{m.text}</p>

            </div>

          </div>

        ))}

      </div>

      <form onSubmit={send} className="p-4 bg-black/40 flex gap-3">

        <input 

          value={msg} 

          onChange={(e) => setMsg(e.target.value)} 

          placeholder="Secure transmission..." 

          className="flex-1 bg-black border border-white/10 rounded-2xl px-5 text-sm outline-none focus:border-[#d4af37]"

        />

        <button type="submit" className="bg-[#d4af37] text-black p-4 rounded-2xl active:scale-95 transition-transform">

          <Send size={18} />

        </button>

      </form>

    </div>

  );

}



function AdminDashboard({ registry }) {

  const register = async (e) => {

    e.preventDefault();

    const f = new FormData(e.target);

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), {

      name: f.get('name'),

      admId: f.get('admId'),

      pos: f.get('pos'),

      perf: f.get('perf'),

      ts: serverTimestamp()

    });

    e.target.reset();

  };



  return (

    <div className="space-y-8">

      <form onSubmit={register} className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-5">

        <h3 className="text-xl font-black flex items-center gap-3"><UserPlus size={20} className="text-[#d4af37]" /> Student Registry</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input name="name" placeholder="Full Identity" required className="bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm" />

          <input name="admId" placeholder="Admission ID (Password)" required className="bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm" />

          <input name="pos" placeholder="Official Position" required className="bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm" />

          <select name="perf" className="bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm appearance-none">

            <option value="Elite">Performance: Elite</option>

            <option value="Strong">Performance: Strong</option>

            <option value="Developing">Performance: Developing</option>

          </select>

        </div>

        <button className="w-full bg-[#d4af37] text-black font-black p-5 rounded-2xl shadow-xl shadow-[#d4af37]/10">Commit Registry</button>

      </form>



      <div className="space-y-4">

        <h3 className="text-xl font-black flex items-center gap-3"><Layout size={20} className="text-[#d4af37]" /> Union Database</h3>

        {registry.map(s => (

          <div key={s.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex justify-between items-center group hover:bg-[#151515] transition-colors">

            <div>

              <p className="font-black text-lg group-hover:text-[#d4af37] transition-colors">{s.name}</p>

              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.admId} • {s.pos}</p>

            </div>

            <div className="bg-[#d4af37]/10 text-[#d4af37] px-4 py-2 rounded-2xl text-[10px] font-black uppercase shadow-inner">

              {s.perf}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}



function AddHighlightForm() {

  const post = async (e) => {

    e.preventDefault();

    const fd = new FormData(e.target);

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'highlights'), {

      title: fd.get('title'),

      description: fd.get('desc'),

      mediaUrl: fd.get('url'),

      createdAt: serverTimestamp()

    });

    e.target.reset();

  };



  return (

    <form onSubmit={post} className="mt-12 bg-[#111] p-8 rounded-[2.5rem] border border-[#d4af37]/30 space-y-5">

      <h3 className="text-xl font-black flex items-center gap-3 text-[#d4af37]"><ImageIcon size={20} /> New Highlight</h3>

      <input name="title" placeholder="Event Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm" />

      <textarea name="desc" placeholder="Event Context..." rows={3} required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm resize-none" />

      <input name="url" placeholder="Visual Link (Image URL)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-[#d4af37] text-sm" />

      <button className="w-full bg-[#d4af37] text-black font-black p-5 rounded-2xl shadow-xl shadow-[#d4af37]/10">Deploy Highlight</button>

    </form>

  );

}
