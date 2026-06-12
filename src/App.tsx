import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  logOut, 
  OperationType 
} from './firebase';
import ChatInterface, { ChatInboxList } from './components/ChatInterface';
import ItemDetail from './components/ItemDetail';
import { Item, Claim } from './types';
import { ShieldCheck } from 'lucide-react';

interface ItemReport {
  id: string;
  userId: string;
  title: string;
  location: string;
  desc?: string;
  description?: string;
  type: 'lost' | 'found';
  image?: string;
  imageUrl?: string;
  createdAt: any;
  claimed: boolean;
}

const ONBOARD_STEPS = [
  {
    icon: "🔎",
    label: "Step 1 of 4",
    title: "Welcome to FindTrack!",
    desc: "Your lost & found platform. Report missing items, search for found ones, and get reunited with your belongings — fast."
  },
  {
    icon: "📦",
    label: "Step 2 of 4",
    title: "Report Lost or Found Items",
    desc: "Tap the Report tab to submit an item. Add a photo, title, and location for the best chance of recovery. The more detail, the better!"
  },
  {
    icon: "🤖",
    label: "Step 3 of 4",
    title: "Smart Match Suggestions",
    desc: "Our smart system automatically compares your reports against others and highlights possible matches — so you can claim your item faster."
  },
  {
    icon: "📌",
    label: "Step 4 of 4",
    title: "Pin & Track Items",
    desc: "Bookmark items you're watching with the pin button. Check Pinned Items in the menu for quick access anytime. You're all set — good luck! 🎉"
  }
];

export default function App() {
  // Navigation layout state: 'landing' | 'login' | 'signup' | 'dashboard'
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup' | 'dashboard'>('landing');
  
  // Dashboard panel selector
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Authentication & session state
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  
  // Form input validations / fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPass] = useState('');
  const [signupFirst, setSignupFirst] = useState('');
  const [signupLast, setSignupLast] = useState('');
  const [signupContact, setSignupContact] = useState('');
  
  // App alerts, loading states & real-time sync list
  const [items, setItems] = useState<ItemReport[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'error' }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Dashboard inputs
  const [reportTitle, setReportTitle] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [reportImage, setReportImage] = useState<string>('');
  const [reportSecurityQuestion, setReportSecurityQuestion] = useState('');
  const [incomingClaims, setIncomingClaims] = useState<Claim[]>([]);

  // Dashboard Search state
  const [sQuery, setSQuery] = useState('');
  const [sFilter, setSFilter] = useState('all');
  const [sLoc, setSLoc] = useState('');
  const [sDate, setSDate] = useState('');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Category browse keyword lists
  const [categoryKeywords, setCategoryKeywords] = useState<string[] | null>(null);

  // Profile data
  const [profileName, setProfileName] = useState('Student');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('https://api.dicebear.com/8.x/avataaars/svg?seed=default');

  // Pinned item list IDs (local storage synchronization)
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // Shimmer skeleton state
  const [homeShimmer, setHomeShimmer] = useState(true);

  // Donut chart canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger custom toast notification
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3300);
  };

  // Check login session
  const isLoggedIn = useMemo(() => {
    return user !== null;
  }, [user]);

  // 1. Listen to Authentication State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        // Automatically sync initial profile credentials
        setProfileEmail(currentUser.email || "");
        setProfileName(currentUser.displayName || "Dela Cruz");
        
        // Sync profile data from localStorage context if exists
        try {
          const lProfile = localStorage.getItem("userProfile");
          if (lProfile) {
            const parsed = JSON.parse(lProfile);
            if (parsed.name) setProfileName(parsed.name);
            if (parsed.contact) setProfileContact(parsed.contact);
            if (parsed.avatar) setProfileAvatar(parsed.avatar);
          }
        } catch (e) {
          console.error(e);
        }
        
        // Switch view to dashboard on successful load
        setCurrentView('dashboard');
      } else {
        // If guest is currently in session, direct to dashboard
        try {
          const guestSession = localStorage.getItem("sessionUser");
          if (guestSession) {
            const session = JSON.parse(guestSession);
            if (session && session.email === "") {
              setProfileName("Guest");
              setProfileEmail("");
              setCurrentView('dashboard');
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    // Sync Pinned Items
    try {
      const pins = localStorage.getItem("pinnedItems");
      if (pins) {
        setPinnedIds(JSON.parse(pins));
      }
    } catch (e) {
      console.error(e);
    }

    return unsubscribe;
  }, []);

  // 2. Real-time Firestore Sync of items / reports
  useEffect(() => {
    const reportsCollection = collection(db, 'items'); // Rules define items matching
    
    // Listen to all public lost/found entries across the board to permit comprehensive lost and found search engine matching
    const unsubscribe = onSnapshot(query(reportsCollection), (snapshot) => {
      const list: ItemReport[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ItemReport);
      });
      // Sort in-memory descending creation date
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setItems(list);
      setHomeShimmer(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return unsubscribe;
  }, []);

  // 2.2. Real-time Claims Sync for Finder Review Panel
  useEffect(() => {
    if (!user?.uid) {
      setIncomingClaims([]);
      return;
    }
    const claimsCollection = collection(db, 'claims');
    const q = query(claimsCollection, where('finderId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Claim[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Claim);
      });
      // Place pending claims at the top, then sort by newest first
      list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setIncomingClaims(list);
    }, (error) => {
      console.error("Claims snapshot read failed:", error);
    });

    return unsubscribe;
  }, [user]);

  // 3. Initiate Onboarding trigger
  useEffect(() => {
    if (currentView === 'dashboard') {
      const isComplete = localStorage.getItem("ft_onboarded");
      if (!isComplete) {
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentView]);

  // Handle Firebase Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      triggerToast("❌ Please enter your email and password.", "error");
      return;
    }

    try {
      const credentials = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      localStorage.setItem('sessionUser', JSON.stringify({
        id: credentials.user.uid,
        email: credentials.user.email
      }));
      triggerToast("✅ Login successful! Redirecting...", "success");
      setAuthEmail('');
      setAuthPass('');
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error("SignIn error:", err);
      triggerToast("❌ Invalid email or password. Please try again.", "error");
    }
  };

  // Handle Firebase Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFirst.trim() || !signupLast.trim()) {
      triggerToast("❌ First and Last names are required.", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail.trim())) {
      triggerToast("❌ Please enter a valid email address.", "error");
      return;
    }
    if (authPassword.length < 6) {
      triggerToast("❌ Password must be at least 6 characters.", "error");
      return;
    }

    try {
      const credentials = await createUserWithEmailAndPassword(auth, authEmail.trim().toLowerCase(), authPassword);
      const fullName = `${signupFirst.trim()} ${signupLast.trim()}`;
      
      localStorage.setItem('sessionUser', JSON.stringify({
        id: credentials.user.uid,
        name: fullName,
        email: authEmail.trim().toLowerCase()
      }));

      const prof = {
        name: fullName,
        email: authEmail.trim().toLowerCase(),
        contact: signupContact.trim(),
        avatar: profileAvatar
      };
      localStorage.setItem('userProfile', JSON.stringify(prof));

      setProfileName(fullName);
      setProfileContact(signupContact);
      setProfileEmail(authEmail.trim().toLowerCase());

      triggerToast("✅ Account created successfully!", "success");
      
      setSignupFirst('');
      setSignupLast('');
      setSignupContact('');
      setAuthEmail('');
      setAuthPass('');
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error("SignUp error:", err);
      if (err.code === 'auth/email-already-in-use') {
        triggerToast("❌ Email already registered.", "error");
      } else {
        triggerToast("❌ Signup failed. Try again.", "error");
      }
    }
  };

  // Handle Logout
  const handleLogoutAction = async () => {
    localStorage.removeItem('sessionUser');
    localStorage.removeItem('userProfile');
    try {
      await logOut();
    } catch (er) {}
    setProfileName("Student");
    setProfileEmail("");
    setProfileContact("");
    triggerToast("🚪 Logged out securely.", "success");
    setCurrentView('landing');
    setActiveTab('home');
  };

  // Browse as guest fallback trigger
  const handleGuestBrowse = () => {
    localStorage.removeItem('sessionUser');
    const guestUser = {
      name: 'Guest',
      email: '',
      contact: '',
      avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=guest'
    };
    localStorage.setItem('userProfile', JSON.stringify(guestUser));
    localStorage.setItem('sessionUser', JSON.stringify({ id: 'guest_' + Date.now(), email: '' }));
    setProfileName("Guest");
    setProfileEmail("");
    setProfileContact("");
    setProfileAvatar(guestUser.avatar);
    setCurrentView('dashboard');
    setActiveTab('home');
  };

  // Save profile modifications
  const handleSaveProfile = () => {
    if (profileName === 'Guest') {
      setShowGuestModal(true);
      return;
    }

    const updated = {
      name: profileName,
      email: profileEmail,
      contact: profileContact,
      avatar: profileAvatar
    };
    localStorage.setItem('userProfile', JSON.stringify(updated));
    triggerToast("✅ Profile saved successfully!", "success");
  };

  // Image upload reading state
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setReportImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Profile avatar trigger random
  const handleRandomAvatar = () => {
    if (profileName === 'Guest') {
      setShowGuestModal(true);
      return;
    }
    const seed = Math.random().toString(36).slice(2, 8);
    const styles = ["avataaars", "bottts", "fun-emoji", "lorelei", "pixel-art"];
    const style = styles[Math.floor(Math.random() * styles.length)];
    setProfileAvatar(`https://api.dicebear.com/8.x/${style}/svg?seed=${seed}`);
  };

  // Submit Report to Firestore
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName === 'Guest') {
      setShowGuestModal(true);
      return;
    }

    if (!reportTitle.trim()) {
      triggerToast("❌ Item title is required.", "error");
      return;
    }

    const payloadId = 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    
    // Firestore Object Schema aligned with security rules constraints
    const reportData = {
      id: payloadId,
      userId: auth.currentUser?.uid || 'anonymous_uid',
      title: reportTitle.trim(),
      description: reportDesc.trim() || 'No description provided.',
      type: reportType,
      category: 'others', // Supported standard selection
      location: reportLocation.trim() || 'Unknown Location',
      status: 'active',
      contactName: profileName || 'Student',
      contactInfo: profileContact || profileEmail || 'No contact provided',
      date: new Date().toLocaleDateString(),
      imageUrl: reportImage || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      claimed: false,
      securityQuestion: reportSecurityQuestion.trim()
    };

    try {
      await setDoc(doc(db, 'items', payloadId), reportData);
      triggerToast("✅ Report submitted successfully!", "success");
      
      // Reset form variables
      setReportTitle('');
      setReportLocation('');
      setReportDesc('');
      setReportType('lost');
      setReportImage('');
      setReportSecurityQuestion('');

      // Auto redirect to Search to view entries
      setActiveTab('search');
    } catch (err) {
      console.error("Firestore creation error:", err);
      triggerToast("❌ Submission rejected by security parameters.", "error");
      try {
        handleFirestoreError(err, OperationType.CREATE, `items/${payloadId}`);
      } catch (e) {}
    }
  };

  // Toggle Pin Bookmark action
  const togglePin = (itemId: string) => {
    if (profileName === 'Guest') {
      setShowGuestModal(true);
      return;
    }
    let pins = [...pinnedIds];
    const idx = pins.indexOf(itemId);
    if (idx > -1) {
      pins.splice(idx, 1);
      triggerToast("📍 Item unpinned", "success");
    } else {
      pins.push(itemId);
      triggerToast("📌 Item pinned!", "success");
    }
    setPinnedIds(pins);
    localStorage.setItem("pinnedItems", JSON.stringify(pins));
  };

  // Flag Item as Claimed
  const claimItem = async (itemId: string) => {
    if (profileName === 'Guest') {
      setShowGuestModal(true);
      return;
    }
    if (!confirm("Are you sure you want to mark this item as claimed/recovered?")) return;
    
    try {
      await updateDoc(doc(db, 'items', itemId), {
        claimed: true,
        status: 'resolved',
        updatedAt: serverTimestamp()
      });
      triggerToast("✅ Item marked as claimed!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Action access is denied.", "error");
    }
  };

  // Delete Listing report
  const deleteItem = async (itemId: string) => {
    if (profileName === 'Guest') {
      setShowGuestModal(true);
      return;
    }
    if (!confirm("Delete this report entry permanently? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setPinnedIds(prev => prev.filter(id => id !== itemId));
      triggerToast("🗑️ Item deleted", "error");
      setActiveTab('search');
    } catch (err) {
      console.error(err);
      triggerToast("❌ Deletion rejected.", "error");
    }
  };

  // Helper actions to approve / reject claims
  const handleApproveClaim = async (claimId: string, itemId: string) => {
    try {
      await updateDoc(doc(db, 'claims', claimId), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      triggerToast("✅ Ownership claim approved! Access credentials unlocked.", "success");
    } catch (err) {
      console.error("Error approving claim:", err);
      triggerToast("❌ Action failed or unauthorized.", "error");
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      await updateDoc(doc(db, 'claims', claimId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      triggerToast("❌ Claim response declined.", "error");
    } catch (err) {
      console.error("Error rejecting claim:", err);
      triggerToast("❌ Action failed or unauthorized.", "error");
    }
  };

  // Initiate direct chat about item
  const handleStartChat = async (otherUserUid: string, itemId: string) => {
    if (!user) {
      if (profileName === 'Guest') {
        setShowGuestModal(true);
      } else {
        setCurrentView('login');
      }
      return;
    }

    if (user.uid === otherUserUid) {
      triggerToast("💡 This is your own listing!", "success");
      return;
    }

    try {
      // Deterministic chat ID
      const chatId = [user.uid, otherUserUid, itemId].sort().join("_");
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        const itemRef = doc(db, 'items', itemId);
        const itemSnap = await getDoc(itemRef);
        const itemTitle = itemSnap.exists() ? itemSnap.data().title : "Lost/Found Item";

        await setDoc(chatRef, {
          chatId,
          participants: [user.uid, otherUserUid],
          itemId,
          itemTitle,
          lastMessage: `Convo initiated about "${itemTitle}"`,
          timestamp: serverTimestamp()
        });
      }

      setActiveChatId(chatId);
    } catch (err) {
      console.error("Error creating chat:", err);
      triggerToast("❌ Failed to initiate chat room.", "error");
    }
  };

  // Active counter statistics dynamic
  const stats = useMemo(() => {
    return {
      lost: items.filter(i => i.type === 'lost' && !i.claimed).length,
      found: items.filter(i => i.type === 'found' && !i.claimed).length,
      claimed: items.filter(i => i.claimed).length
    };
  }, [items]);

  // In memory dynamic listing filter
  const filteredSearchList = useMemo(() => {
    return items.filter(r => {
      const keywords = `${r.title} ${r.desc || r.description || ""} ${r.location}`.toLowerCase();
      
      // Keyword matching
      if (sQuery.trim() && !keywords.includes(sQuery.toLowerCase())) {
        return false;
      }
      
      // Category keywords browsing bounds
      if (categoryKeywords) {
        const hasKeywordMatch = categoryKeywords.some(kw => keywords.includes(kw.toLowerCase()));
        if (!hasKeywordMatch) return false;
      }

      // Status dropdown
      if (sFilter === 'lost') {
        if (r.type !== 'lost' || r.claimed) return false;
      } else if (sFilter === 'found') {
        if (r.type !== 'found' || r.claimed) return false;
      } else if (sFilter === 'claimed') {
        if (!r.claimed) return false;
      }

      // Advanced filters bounds
      if (sLoc.trim() && !(r.location || "").toLowerCase().includes(sLoc.toLowerCase())) {
        return false;
      }
      
      if (sDate.trim()) {
        const itemDateStr = r.date || "";
        if (!itemDateStr.includes(sDate)) return false;
      }

      return true;
    });
  }, [items, sQuery, sFilter, sLoc, sDate, categoryKeywords]);

  // Compute matches scores for active queries
  const smartMatches = useMemo(() => {
    if (sQuery.trim().length < 3) return [];
    
    const fake = {
      id: "fake_search",
      title: sQuery,
      desc: "",
      location: "",
      type: "lost",
      createdAt: Date.now(),
      claimed: false
    };

    return items
      .filter(r => r.type === 'found' && !r.claimed)
      .map(r => ({ report: r, score: computeMatchScore(fake, r) }))
      .filter(x => x.score > 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [items, sQuery]);

  // Complete clean JSX structure wrapping converted index.html tags
  return (
    <div className="relative min-h-screen bg-[#f0f4f8]">
      
      {/* ── TOAST MESSAGES FLOATER ── */}
      <div className="toast-container" id="toastContainer">
        {toasts.map(t => (
          <div key={t.id} className={`toast-msg ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── IMMERSIVE BACKGROUND GRID (Only on landing or auth views) ── */}
      {(currentView === 'landing' || currentView === 'login' || currentView === 'signup') && (
        <div className="bg-scene">
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-grid"></div>
        </div>
      )}

      {/* ── VIEW 1: LANDING PAGE ── */}
      {currentView === 'landing' && (
        <div className="landing-page">
          {/* Landing NAV */}
          <nav className="landing-nav">
            <div className="nav-logo">
              <div className="nav-logo-icon">🔎</div>
              <span>FindTrack</span>
            </div>
            <div className="nav-actions">
              <button onClick={() => setCurrentView('login')} className="nav-btn nav-btn-ghost">Login</button>
              <button onClick={() => setCurrentView('signup')} className="nav-btn nav-btn-solid">Sign Up</button>
            </div>
          </nav>

          {/* Landing HERO */}
          <div className="hero">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              FindTrack Lost &amp; Found Platform
            </div>
            <h1>Find What's<br /><span className="text-gradient">Lost, Fast.</span></h1>
            <p>Report missing items, browse found belongings, and reunite with your stuff — all in one smart platform built for your Things.</p>

            <div className="hero-actions">
              <button onClick={() => setCurrentView('signup')} className="btn-hero-primary">📝 Get Started Free</button>
              <button onClick={() => setCurrentView('login')} className="btn-hero-secondary">🔐 Sign In</button>
            </div>
            <button onClick={handleGuestBrowse} className="guest-link" id="guestBtn">
              or <span>browse as guest →</span>
            </button>
          </div>

          {/* Landing STATS */}
          <div className="stats-row">
            <div className="stat-pill">
              <div className="stat-num">{stats.claimed}</div>
              <div className="stat-lbl">Items Recovered</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-pill">
              <div className="stat-num">{items.length}</div>
              <div className="stat-lbl">Active Listings</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-pill">
              <div className="stat-num">Live</div>
              <div className="stat-lbl">Platform Hub</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-pill">
              <div className="stat-num">24h</div>
              <div className="stat-lbl">Avg. Recovery</div>
            </div>
          </div>

          {/* Landing FEATURES */}
          <div className="features">
            <div className="feat-card">
              <div className="feat-icon sky">📦</div>
              <div className="feat-title">Easy Reporting</div>
              <div className="feat-desc">Submit lost or found items in seconds with photo uploads and location details.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon mint">🔍</div>
              <div className="feat-title">Smart Search</div>
              <div className="feat-desc">Advanced filters by category, date, and location to find exactly what you need.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon indigo">📊</div>
              <div className="feat-title">Live Analytics</div>
              <div className="feat-desc">Visual dashboards tracking trends, recovery stats, and item history.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon amber">⚡</div>
              <div className="feat-title">Instant Alerts</div>
              <div className="feat-desc">Get notified immediately when a potential match is found for your item.</div>
            </div>
          </div>

          <footer className="landing-footer">
            <p>Built with ❤️ for Things · FindTrack v2.0</p>
          </footer>
        </div>
      )}

      {/* ── VIEW 2: LOGIN PAGE ── */}
      {currentView === 'login' && (
        <div className="landing-page flex items-center justify-center">
          <div className="auth-wrap">
            <div className="back-link">
              <button onClick={() => setCurrentView('landing')} className="text-slate-400 hover:text-white transition">← Back to home</button>
            </div>

            <div className="auth-logo">
              <div className="auth-logo-icon">🔎</div>
              <h1>FindTrack</h1>
              <p>Lost &amp; Found System</p>
            </div>

            <div className="auth-card">
              <div className="card-title">Welcome back 👋</div>
              <div className="card-sub">Sign in to your account to continue</div>

              <form onSubmit={handleLoginSubmit}>
                <div className="field">
                  <label>Email Address</label>
                  <div className="field-wrap">
                    <span className="field-icon">✉️</span>
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="field-wrap">
                    <span className="field-icon">🔒</span>
                    <input 
                      type={showPass ? "text" : "password"} 
                      placeholder="Enter your password" 
                      value={authPassword}
                      onChange={(e) => setAuthPass(e.target.value)}
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)} 
                      className={`eye-btn ${!showPass ? 'closed' : ''}`}
                    >
                      <span className="text-lg">👁️</span>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-submit">🔐 Sign In</button>
              </form>

              <div className="auth-footer">
                Don't have an account? <button onClick={() => setCurrentView('signup')} className="text-[#38bdf8] font-bold hover:underline">Create one →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 3: SIGNUP PAGE ── */}
      {currentView === 'signup' && (
        <div className="landing-page flex items-center justify-center">
          <div className="auth-wrap">
            <div className="back-link">
              <button onClick={() => setCurrentView('landing')} className="text-slate-400 hover:text-white transition">← Back to home</button>
            </div>

            <div className="auth-logo">
              <div className="auth-logo-icon">🔎</div>
              <h1>FindTrack</h1>
              <p>Lost &amp; Found System</p>
            </div>

            <div className="auth-card">
              <div className="card-title">Create your account ✨</div>
              <div className="card-sub">Be one of the first users of FindTrack</div>

              <form onSubmit={handleSignupSubmit}>
                <div className="fields-row">
                  <div className="field">
                    <label>First Name</label>
                    <div className="field-wrap">
                      <span className="field-icon">👤</span>
                      <input 
                        type="text" 
                        placeholder="Juan" 
                        value={signupFirst}
                        onChange={(e) => setSignupFirst(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Last Name</label>
                    <div className="field-wrap">
                      <span className="field-icon">👤</span>
                      <input 
                        type="text" 
                        placeholder="Dela Cruz" 
                        value={signupLast}
                        onChange={(e) => setSignupLast(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Email Address</label>
                  <div className="field-wrap">
                    <span className="field-icon">✉️</span>
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Phone Number <span style={{ opacity: 0.4, fontSize: '10px', textTransform: 'none' }}>(optional)</span></label>
                  <div className="field-wrap">
                    <span className="field-icon">📱</span>
                    <input 
                      type="tel" 
                      placeholder="+63 912 345 6789" 
                      value={signupContact}
                      onChange={(e) => setSignupContact(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="field-wrap">
                    <span className="field-icon">🔒</span>
                    <input 
                      type={showPass ? "text" : "password"} 
                      placeholder="Min. 6 characters" 
                      value={authPassword}
                      onChange={(e) => setAuthPass(e.target.value)}
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)} 
                      className={`eye-btn ${!showPass ? 'closed' : ''}`}
                    >
                      <span className="text-lg">👁️</span>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-submit">📝 Create Account</button>
              </form>

              <div className="auth-footer">
                Already have an account? <button onClick={() => setCurrentView('login')} className="text-[#38bdf8] font-bold hover:underline">Sign in →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 4: MAIN DASHBOARD PORTAL ── */}
      {currentView === 'dashboard' && (
        <div className="min-h-screen text-slate-800">
          
          {/* TOP BAR BRAND MODULE */}
          <header className="topbar">
            <div className="topbar-inner">
              <button 
                id="burgerBtn" 
                onClick={() => setSidebarOpen(true)} 
                className="burger-btn" 
                aria-label="Menu"
              >
                ☰
              </button>
              
              <div className="brand-wrap">
                <div className="logo">🔎</div>
                <div className="brand-text">
                  <div className="brand-title">FindTrack</div>
                  <div className="small-muted">Lost &amp; Found System</div>
                </div>
              </div>
              <div style={{ width: '40px' }}></div>
            </div>

            {/* TAB SELECTORS SECTION */}
            <nav className="tabs">
              <button 
                onClick={() => { setActiveTab('home'); setCategoryKeywords(null); }} 
                className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
              >
                🏠 Home
              </button>
              <button 
                onClick={() => { 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('report'); }
                }} 
                className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              >
                📦 Report
              </button>
              <button 
                onClick={() => { setActiveTab('search'); setCategoryKeywords(null); }} 
                className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              >
                🔍 Search
              </button>
              <button 
                onClick={() => { 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('notifications'); }
                }} 
                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              >
                🔔 Alerts
              </button>
              <button 
                onClick={() => { setActiveTab('profile'); }} 
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              >
                👤 Profile
              </button>
            </nav>
          </header>

          {/* SIDEBAR NAVIGATION DRAWERS */}
          {sidebarOpen && (
            <div 
              id="sidebarOverlay" 
              onClick={() => setSidebarOpen(false)} 
              className="overlay"
            ></div>
          )}
          <aside 
            id="sidebarDrawer" 
            className={`sidebar-drawer ${sidebarOpen ? 'show' : 'hidden'}`}
          >
            <div className="drawer-header">
              <strong>FindTrack Menu</strong>
              <button id="closeDrawer" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <ul className="drawer-menu">
              <li 
                onClick={() => { setActiveTab('home'); setCategoryKeywords(null); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                🏠 Home
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('report'); }
                }} 
                className="drawer-item"
              >
                📦 Report Item
              </li>
              <li 
                onClick={() => { setActiveTab('search'); setCategoryKeywords(null); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                🔍 Search
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('notifications'); }
                }} 
                className="drawer-item"
              >
                🔔 Alerts
              </li>
              <li 
                onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                👤 Profile
              </li>
              <hr />
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('myitems'); }
                }} 
                className="drawer-item"
              >
                📂 My Items
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('pinned'); }
                }} 
                className="drawer-item"
              >
                📌 Pinned Items
              </li>
              <li 
                onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                🏷️ Categories
              </li>
              <li 
                onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                📊 Analytics
              </li>
              <hr />
              <li 
                onClick={() => { setActiveTab('tips'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                📚 Recovery Tips
              </li>
              <li 
                onClick={() => { setActiveTab('packaging'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                📦 Packaging Tips
              </li>
              <li 
                onClick={() => { setActiveTab('about'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                ℹ️ About / Help
              </li>
            </ul>
          </aside>

          {/* MAIN PANELS INJECTION DESK */}
          <main>
            
            {/* PANEL: HOME */}
            <section id="home" className={`panel ${activeTab === 'home' ? 'active' : ''}`}>
              {/* Skeleton overlay shimmer */}
              {homeShimmer ? (
                <div id="homeSkeleton">
                  <div className="skeleton skeleton-welcome"></div>
                  <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
                    <div className="skeleton skeleton-title" style={{ width: '40%', height: '16px', margin: '0 0 16px' }}></div>
                    <div className="skeleton skeleton-recent"></div>
                    <div className="skeleton skeleton-recent"></div>
                    <div className="skeleton skeleton-recent"></div>
                  </div>
                </div>
              ) : (
                <div id="homeContent">
                  <div className="welcome-card">
                    <div className="welcome-left">
                      <p className="muted">Welcome back 👋</p>
                      <h1 id="welcomeUser" className="welcome-title">Hello, {profileName.split(" ")[0]}!</h1>
                      <p className="muted" style={{ fontSize: '13px' }}>Here's your activity summary</p>
                    </div>
                    <div className="stats-cards">
                      <div className="stat-card">
                        <div className="stat-icon">📍</div>
                        <div className="stat-label">Lost</div>
                        <div id="countLost" className="stat-value">{stats.lost}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">🔍</div>
                        <div className="stat-label">Found</div>
                        <div id="countFound" className="stat-value">{stats.found}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-label">Claimed</div>
                        <div id="countClaimed" className="stat-value">{stats.claimed}</div>
                      </div>
                    </div>
                  </div>

                  <div className="recent-section">
                    <div className="recent-header">
                      <h3>📋 Recent Reports Feed</h3>
                    </div>
                    <div id="recentList" className="recent-list">
                      {items.slice(0, 5).map(r => (
                        <div key={r.id} onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }} className="recent-item">
                          <div className="recent-thumb">
                            {r.image || r.imageUrl ? (
                              <img src={r.image || r.imageUrl} alt="" />
                            ) : (
                              r.type === 'lost' ? "📍" : "🔍"
                            )}
                          </div>
                          <div className="recent-info">
                            <div className="recent-title">{r.title}</div>
                            <div className="recent-meta">{r.location || "Location unknown"} · {r.date || "Just now"}</div>
                          </div>
                          <div className={`badge ${r.claimed ? 'claimed' : r.type}`}>
                            {r.claimed ? "CLAIMED" : r.type.toUpperCase()}
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
                          No reports yet — start by reporting an item! 📦
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tip-banner">💡 Tip: Report lost items within 24 hours for the best chance of recovery!</div>
                </div>
              )}
            </section>

            {/* PANEL: REPORT SUBMISSION */}
            <section id="report" className={`panel ${activeTab === 'report' ? 'active' : ''}`}>
              <div className="section-title">📦 Report Lost / Found Item</div>
              <p className="section-subtitle">Fill in the details below to submit a report. More detail = higher chance of recovery.</p>
              <div className="report-form-wrap">
                <form onSubmit={handleReportSubmit} id="reportForm">
                  <div className="form-group">
                    <label htmlFor="r_title">Item Title *</label>
                    <input 
                      id="r_title" 
                      type="text" 
                      placeholder="e.g., Blue Nike Backpack" 
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="r_location">Location Where Lost/Found</label>
                    <input 
                      id="r_location" 
                      type="text" 
                      placeholder="e.g., Library 2nd Floor" 
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="r_desc">Detailed Description</label>
                    <textarea 
                      id="r_desc" 
                      rows={4} 
                      placeholder="Add details like color, brand, identifying features..."
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="r_image">Upload Photo</label>
                    <input 
                      id="r_image" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileChange}
                    />
                    {reportImage && (
                      <img 
                        src={reportImage} 
                        className="image-preview" 
                        style={{ display: 'block' }} 
                        alt="Preview" 
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="r_type">Item Status *</label>
                    <select 
                      id="r_type"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as 'lost' | 'found')}
                    >
                      <option value="lost">🔴 Lost Item — I lost this</option>
                      <option value="found">🟢 Found Item — I found this</option>
                    </select>
                  </div>

                  <div className="form-group bg-slate-50 border border-slate-205 rounded-xl p-4 my-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', margin: '8px 0' }}>
                    <label htmlFor="r_securityQuestion" className="text-slate-800 font-bold" style={{ fontWeight: 'bold', color: '#1e293b' }}>🔑 Prove It! Verification Question (Optional)</label>
                    <input 
                      id="r_securityQuestion" 
                      type="text" 
                      placeholder="e.g., What color sticker is on the back? / What's the keychain brand?" 
                      value={reportSecurityQuestion}
                      onChange={(e) => setReportSecurityQuestion(e.target.value)}
                      style={{ marginTop: '4px' }}
                    />
                    <p className="text-[10px] text-slate-500 mt-1" style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                      Add an optional verification question to protect this item. To claim it, other users will be requested to provide a matching answer.
                    </p>
                  </div>

                  <button className="primary-btn" type="submit">📤 Submit Report</button>
                </form>
              </div>
            </section>

            {/* PANEL: SEARCH REGISTRY */}
            <section id="search" className={`panel ${activeTab === 'search' ? 'active' : ''}`}>
              <div className="section-title">🔍 Search Database</div>
              
              <div className="search-container">
                <div className="search-bar">
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input 
                      id="s_query" 
                      placeholder="Search by title, description or location..."
                      value={sQuery}
                      onChange={(e) => setSQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    id="s_filter"
                    value={sFilter}
                    onChange={(e) => setSFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="lost">Lost Only</option>
                    <option value="found">Found Only</option>
                    <option value="claimed">Claimed</option>
                  </select>
                  <button 
                    onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)} 
                    className="filter-btn"
                  >
                    Filters ▾
                  </button>
                </div>

                <div id="advancedFilters" className={`advanced-filters ${!advancedFiltersOpen ? 'hidden' : ''}`}>
                  <input 
                    id="filterLocation" 
                    placeholder="📍 Filter by location"
                    value={sLoc}
                    onChange={(e) => setSLoc(e.target.value)}
                  />
                  <input 
                    id="filterDate" 
                    type="date"
                    value={sDate}
                    onChange={(e) => setSDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Categories highlight info bar */}
              {categoryKeywords && (
                <div className="mb-4 bg-indigo-50 border border-indigo-200 text-indigo-700 py-2 px-4 rounded-xl flex items-center justify-between text-xs">
                  <span>Filtered: Category Mode Active</span>
                  <button onClick={() => setCategoryKeywords(null)} className="font-bold underline">Show all files</button>
                </div>
              )}

              {/* SMART SUGGESTION MATCH BANNER COGNITIVE extraction */}
              {smartMatches.length > 0 && (
                <div id="matchBanner" className="match-banner show">
                  <div className="match-banner-title">🤖 Smart suggestions — Possible matches for your query</div>
                  <div className="match-cards">
                    {smartMatches.map(({ report, score }) => {
                      const pct = Math.round(score * 100);
                      return (
                        <div key={report.id} onClick={() => { setSelectedItemId(report.id); setActiveTab('itemDetail'); }} className="match-chip">
                          <div className="match-chip-title">{report.title}</div>
                          <div className="match-chip-meta">📍 {report.location || "Unknown"}</div>
                          <div className="match-score">🎯 {pct}% match</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEARCH REGISTRY CARDS GRID */}
              <div id="searchResults" className="cards-grid">
                {filteredSearchList.map(r => {
                  const pinned = pinnedIds.includes(r.id);
                  return (
                    <div key={r.id} onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }} className="card-item clickable">
                      <div className="relative">
                        <div className="card-media">
                          {r.image || r.imageUrl ? (
                            <img src={r.image || r.imageUrl} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ fontSize: '52px', opacity: 0.35 }}>📷</div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePin(r.id); }} 
                          className={`pin-toggle ${pinned ? 'pinned' : ''}`}
                        >
                          {pinned ? "📌" : "📍"}
                        </button>
                      </div>
                      <div className="card-title">{r.title}</div>
                      <div className="card-desc">{r.desc || r.description || "No description provided."}</div>
                      <div className="card-footer">
                        <div>
                          <small style={{ display: 'block', color: '#64748b' }}>{r.location || "Unknown location"}</small>
                          <small style={{ color: '#94a3b8' }}>{r.date || "Just now"}</small>
                        </div>
                        <div className={`badge ${r.claimed ? 'claimed' : r.type}`}>
                          {r.claimed ? "CLAIMED" : r.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredSearchList.length === 0 && (
                <div id="noResults" className="empty">
                  No items found matching the current criteria.
                </div>
              )}
            </section>

            {/* PANEL: ITEM DETAIL VIEW */}
            <section id="itemDetail" className={`panel ${activeTab === 'itemDetail' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('search')} className="back-btn">← Back to Search</button>
              
              <div id="detailContent">
                {(() => {
                  const r = items.find(x => x.id === selectedItemId);
                  if (!r) return <p className="p-6 text-slate-400 font-sans text-xs">Please choose an item from search.</p>;
                  
                  const mappedItem: Item = {
                    id: r.id,
                    userId: r.userId,
                    type: r.type,
                    title: r.title,
                    description: r.desc || r.description || "No description provided.",
                    category: (r as any).category || 'others',
                    location: r.location,
                    status: r.claimed ? 'resolved' : 'active',
                    imageUrl: r.image || r.imageUrl || '',
                    contactName: r.contactName || 'Representative',
                    contactInfo: r.contactInfo || 'No contact info provided',
                    date: r.date || new Date().toLocaleDateString(),
                    createdAt: r.createdAt ? (r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000).toISOString() : String(r.createdAt)) : new Date().toISOString(),
                    updatedAt: r.createdAt ? (r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000).toISOString() : String(r.createdAt)) : new Date().toISOString(),
                  };

                  const oppositeItemsMapped = items.filter(x => x.type !== r.type).map(x => ({
                    id: x.id,
                    userId: x.userId,
                    type: x.type,
                    title: x.title,
                    description: x.desc || x.description || '',
                    category: (x as any).category || 'others',
                    location: x.location,
                    status: x.claimed ? 'resolved' : 'active',
                    imageUrl: x.image || x.imageUrl || '',
                    contactName: x.contactName || 'Representative',
                    contactInfo: x.contactInfo || 'No contact info provided',
                    date: x.date || new Date().toLocaleDateString(),
                    createdAt: x.createdAt ? (x.createdAt.seconds ? new Date(x.createdAt.seconds * 1000).toISOString() : String(x.createdAt)) : new Date().toISOString(),
                    updatedAt: x.createdAt ? (x.createdAt.seconds ? new Date(x.createdAt.seconds * 1000).toISOString() : String(x.createdAt)) : new Date().toISOString(),
                  } as any));

                  return (
                    <ItemDetail
                      item={mappedItem}
                      onClose={() => setActiveTab('search')}
                      allOppositeItems={oppositeItemsMapped}
                      onResolveItem={async () => {
                        await claimItem(r.id);
                      }}
                      onDeleteItem={async () => {
                        await deleteItem(r.id);
                      }}
                      currentUserUid={user?.uid}
                      onStartChat={handleStartChat}
                    />
                  );
                })()}
              </div>
            </section>

            {/* PANEL: NOTIFICATIONS & ALERTS */}
            <section id="notifications" className={`panel ${activeTab === 'notifications' ? 'active' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Real-time Chats Inbox Column */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* 🛡️ "PROVE IT" LANDING CLAIMS FOR OWNER ITEMS (Item 3) */}
                  <div className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-3xl space-y-4" id="finder-claims-review-panel">
                    <div className="flex flex-col gap-1.5 items-start sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5 flex-wrap">🔑 Incoming Ownership Claims ({incomingClaims.filter(c => c.status === 'pending').length} pending)</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold uppercase rounded-full inline-block whitespace-nowrap shrink-0">Prove-it Verification Layer</span>
                    </div>

                    {incomingClaims.length === 0 ? (
                      <div className="text-center py-10 bg-white border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-450 p-6 shadow-sm">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <p className="font-sans text-xs font-extrabold text-slate-700">No claims registered yet.</p>
                        <p className="font-sans text-[10.5px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                          Your active listings verification answers from claiming searchers will update here automatically in real-time.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {incomingClaims.map((claim) => {
                          const isPending = claim.status === 'pending';
                          
                          return (
                            <div 
                              key={claim.id} 
                              className={`bg-white border rounded-2xl p-4 shadow-sm relative transition hover:shadow-md ${
                                claim.status === 'approved' ? 'border-emerald-200 bg-emerald-50/5' :
                                claim.status === 'rejected' ? 'border-rose-200 bg-rose-50/5' :
                                'border-slate-200/80 hover:border-indigo-200'
                              }`}
                              id={`claim-review-card-${claim.id}`}
                            >
                              <div className="flex flex-col gap-2 items-start justify-between sm:flex-row sm:items-center w-full mb-2">
                                <div className="space-y-0.5">
                                  <h4 className="font-sans text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>Claim on:</span>
                                    <span className="text-indigo-600 font-extrabold">{claim.itemTitle}</span>
                                  </h4>
                                  <span className="font-mono text-[9px] text-slate-400 block mt-0.5">
                                    Claimer: <strong className="text-slate-600 font-bold">{claim.claimerName}</strong> ({claim.claimerEmail || 'anonymous_email'})
                                  </span>
                                </div>

                                <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                  claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                  claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                  'bg-amber-105 text-amber-805'
                                }`}>
                                  {claim.status}
                                </span>
                              </div>

                              <div className="space-y-2 bg-slate-50 border border-slate-205/60 rounded-xl p-3 text-xs mt-2.5">
                                <div>
                                  <p className="font-mono text-[8.5px] text-slate-400 uppercase tracking-widest font-bold">Verification Question:</p>
                                  <p className="font-sans text-slate-700 font-semibold leading-relaxed">"{claim.securityQuestion}"</p>
                                </div>
                                <div className="pt-2 border-t border-slate-200/50 mt-2">
                                  <p className="font-mono text-[8.5px] text-slate-400 uppercase tracking-widest font-bold">Claimer's Answer / Proof details:</p>
                                  <p className="font-sans text-slate-900 font-extrabold leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 mt-1 italic">
                                    "{claim.providedAnswer}"
                                  </p>
                                </div>
                              </div>

                              {isPending ? (
                                <div className="flex items-center space-x-2 mt-3.5 justify-end">
                                  <button
                                    onClick={() => handleRejectClaim(claim.id)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-sans text-[11px] font-bold hover:bg-slate-50 cursor-pointer transition active:scale-95"
                                  >
                                    Decline Claim
                                  </button>
                                  <button
                                    onClick={() => handleApproveClaim(claim.id, claim.itemId)}
                                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-tr from-teal-850 to-indigo-950 text-white font-sans text-[11px] font-bold cursor-pointer transition hover:from-teal-900 hover:to-indigo-900 active:scale-95 flex items-center gap-1 shadow-sm"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
                                    <span>Approve & Unlock PII</span>
                                  </button>
                                </div>
                              ) : (
                                <p className="text-right text-[10px] text-slate-400 mt-2.5 font-sans font-medium">
                                  {claim.status === 'approved' 
                                    ? '✓ Approved: Private coordinates are now fully shared.' 
                                    : '✗ Declined claim.'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="section-title flex items-center justify-between">
                    <span className="flex items-center gap-1.5">💬 Active Chats Inbox</span>
                    <span className="font-mono text-[9px] bg-teal-100 text-teal-850 font-bold uppercase rounded-full px-2 py-0.5 animate-pulse">Live Messaging</span>
                  </div>
                  <ChatInboxList 
                    currentUserUid={user ? user.uid : null}
                    onSelectChat={(id) => setActiveChatId(id)}
                    activeChatId={activeChatId}
                  />
                </div>

                {/* Static System Alerts Column */}
                <div className="md:col-span-1 space-y-4">
                  <div className="section-title">🔔 Platform Alerts</div>
                  <div id="alertsList" className="space-y-3">
                    <div className="alert-item m-0">
                      <strong>🎉 Welcome to Lost &amp; Found!</strong>
                      <p>You'll receive secure notifications and match recommendations here.</p>
                    </div>
                    <div className="alert-item m-0">
                      <strong>💡 Pro Tip</strong>
                      <p>Tap "Message Finder" on other users' listings to contact them safely.</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* PANEL: PROFILE */}
            <section id="profile" className={`panel ${activeTab === 'profile' ? 'active' : ''}`}>
              <div className="section-title">👤 My Profile</div>
              <div className="profile-container">
                <div className="profile-photo">
                  <img id="pf_avatar" src={profileAvatar} alt="Profile" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <button onClick={handleRandomAvatar} className="secondary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                      🎲 Random Avatar
                    </button>
                  </div>
                </div>
                
                <div className="profile-fields">
                  <div className="form-group">
                    <label htmlFor="pf_name">Full Name</label>
                    <input 
                      id="pf_name" 
                      placeholder="Enter your full name" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pf_email">Email Address</label>
                    <input 
                      id="pf_email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      value={profileEmail}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pf_contact">Contact Number</label>
                    <input 
                      id="pf_contact" 
                      placeholder="+63 912 345 6789" 
                      value={profileContact}
                      onChange={(e) => setProfileContact(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
                    <button onClick={handleSaveProfile} className="primary-btn">💾 Save Profile</button>
                    <button 
                      onClick={handleLogoutAction} 
                      style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* PANEL: MY ITEMS */}
            <section id="myitems" className={`panel ${activeTab === 'myitems' ? 'active' : ''}`}>
              <div className="section-title">📂 My Items</div>
              <p className="section-subtitle">All items you've reported — tab to view details</p>
              
              <div className="cards-grid">
                {items.filter(item => item.userId === auth.currentUser?.uid).map(r => {
                  const pinned = pinnedIds.includes(r.id);
                  return (
                    <div key={r.id} className="card-item">
                      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }}>
                        <div className="card-media">
                          {r.image || r.imageUrl ? (
                            <img src={r.image || r.imageUrl} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ fontSize: '52px', opacity: 0.35 }}>📷</div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePin(r.id); }} 
                          className={`pin-toggle ${pinned ? 'pinned' : ''}`}
                        >
                          {pinned ? "📌" : "📍"}
                        </button>
                      </div>
                      
                      <div onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }} style={{ cursor: 'pointer' }}>
                        <div className="card-title">{r.title}</div>
                        <div className="card-desc">{r.location || "Unknown"}</div>
                      </div>

                      <div className="card-footer">
                        <small style={{ color: '#94a3b8' }}>{r.date || "Just now"}</small>
                        <div className={`badge ${r.claimed ? 'claimed' : r.type}`}>
                          {r.claimed ? "CLAIMED" : r.type.toUpperCase()}
                        </div>
                      </div>
                      <button className="delete-btn" onClick={() => deleteItem(r.id)}>🗑️ Delete</button>
                    </div>
                  );
                })}
              </div>

              {items.filter(item => item.userId === auth.currentUser?.uid).length === 0 && (
                <div className="empty">You haven't reported any items yet.</div>
              )}
            </section>

            {/* PANEL: PINNED ITEMS */}
            <section id="pinned" className={`panel ${activeTab === 'pinned' ? 'active' : ''}`}>
              <div className="section-title">📌 Pinned Items</div>
              <p className="section-subtitle">Quick access to items you've bookmarked</p>
              
              <div className="cards-grid">
                {items.filter(item => pinnedIds.includes(item.id)).map(r => {
                  const pinned = pinnedIds.includes(r.id);
                  return (
                    <div key={r.id} onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }} className="card-item clickable">
                      <div className="relative">
                        <div className="card-media">
                          {r.image || r.imageUrl ? (
                            <img src={r.image || r.imageUrl} alt="" />
                          ) : (
                            <div style={{ fontSize: '52px', opacity: 0.35 }}>📷</div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePin(r.id); }} 
                          className={`pin-toggle ${pinned ? 'pinned' : ''}`}
                        >
                          {pinned ? "📌" : "📍"}
                        </button>
                      </div>
                      <div className="card-title">{r.title}</div>
                      <div className="card-desc">{r.desc || r.description || "No description provided."}</div>
                      <div className="card-footer">
                        <div>
                          <small style={{ display: 'block', color: '#64748b' }}>{r.location || "Unknown location"}</small>
                          <small style={{ color: '#94a3b8' }}>{r.date || "Just now"}</small>
                        </div>
                        <div className={`badge ${r.claimed ? 'claimed' : r.type}`}>
                          {r.claimed ? "CLAIMED" : r.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {items.filter(item => pinnedIds.includes(item.id)).length === 0 && (
                <div className="empty">No pinned items yet. Pin items from search!</div>
              )}
            </section>

            {/* PANEL: CATEGORIES BROWSER */}
            <section id="categories" className={`panel ${activeTab === 'categories' ? 'active' : ''}`}>
              <div className="section-title">🏷️ Browse by Category</div>
              <p className="section-subtitle">Tap a category to filter lost items</p>
              <div className="cards-grid">
                <div onClick={() => { setCategoryKeywords(["bag", "backpack", "purse", "wallet", "luggage", "suitcase", "handbag"]); setActiveTab('search'); }} className="card-item clickable">
                  <div className="card-media" style={{ fontSize: '60px' }}>🎒</div>
                  <div className="card-title">Bags &amp; Backpacks</div>
                  <div className="card-desc">Backpacks, purses, wallets, luggage</div>
                </div>
                <div onClick={() => { setCategoryKeywords(["phone", "laptop", "tablet", "charger", "headphone", "earphone", "computer", "iphone", "samsung", "ipad", "macbook"]); setActiveTab('search'); }} className="card-item clickable">
                  <div className="card-media" style={{ fontSize: '60px' }}>📱</div>
                  <div className="card-title">Electronics</div>
                  <div className="card-desc">Phones, laptops, tablets, chargers</div>
                </div>
                <div onClick={() => { setCategoryKeywords(["book", "notebook", "textbook", "pen", "pencil", "id", "card", "stationery", "notes"]); setActiveTab('search'); }} className="card-item clickable">
                  <div className="card-media" style={{ fontSize: '60px' }}>📚</div>
                  <div className="card-title">Books &amp; Stationery</div>
                  <div className="card-desc">Textbooks, notebooks, IDs, pens</div>
                </div>
                <div onClick={() => { setCategoryKeywords(["jacket", "shirt", "pants", "uniform", "glasses", "watch", "coat", "shoes", "hat", "scarf"]); setActiveTab('search'); }} className="card-item clickable">
                  <div className="card-media" style={{ fontSize: '60px' }}>👕</div>
                  <div className="card-title">Clothing &amp; Accessories</div>
                  <div className="card-desc">Jackets, uniforms, glasses, watches</div>
                </div>
              </div>
            </section>

            {/* PANEL: ANALYTICS DESK */}
            <section id="analytics" className={`panel ${activeTab === 'analytics' ? 'active' : ''}`}>
              <div className="section-title">📊 Analytics Dashboard</div>
              <p className="section-subtitle">Visual overview of all reported items</p>
              
              <div className="analytics-grid" id="analyticsGrid">
                <div className="analytics-card">
                  <div className="big-num" style={{ color: '#ef4444' }}>{stats.lost}</div>
                  <div className="big-label">Active Lost</div>
                </div>
                <div className="analytics-card">
                  <div className="big-num" style={{ color: '#0ea5e9' }}>{stats.found}</div>
                  <div className="big-label">Found Items</div>
                </div>
                <div className="analytics-card">
                  <div className="big-num" style={{ color: '#10b981' }}>{stats.claimed}</div>
                  <div className="big-label">Claimed</div>
                </div>
                <div className="analytics-card">
                  <div className="big-num" style={{ color: '#8b5cf6' }}>{items.length}</div>
                  <div className="big-label">Total Reports</div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                <canvas ref={canvasRef} id="chartCanvas" width={400} height={220} style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}></canvas>
                <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginTop: '14px' }}>Item distribution by status</p>
              </div>
            </section>

            {/* PANEL: GENERAL LIST OF INFORMATION GUIDES */}
            <section id="tips" className={`panel ${activeTab === 'tips' ? 'active' : ''}`}>
              <div className="section-title">📚 Lost Item Recovery Guide</div>
              <p className="section-subtitle">Helpful tips to increase your chances of finding lost items</p>
              <div className="tips-grid">
                <div className="tip-card">🔍 <strong>Retrace Recent Locations</strong><br /><br />Carefully revisit the places you recently visited to help locate missing items.</div>
                <div className="tip-card">📍 <strong>Check Nearby Areas</strong><br /><br />Inspect public spaces, offices, transportation stops, shops, and common areas.</div>
                <div className="tip-card">📱 <strong>Use Digital Tools</strong><br /><br />Post on forums, use FindTrack, check social media groups.</div>
                <div className="tip-card">🕒 <strong>Act Quickly</strong><br /><br />Report and search within 2 hours for best results.</div>
                <div className="tip-card">📸 <strong>Add Photos</strong><br /><br />Upload a photo of your item for much faster identification.</div>
                <div className="tip-card">🔔 <strong>Stay Updated</strong><br /><br />Receive updates and notifications about matched or recovered items.</div>
                <div className="tip-card">📝 <strong>Submit Detailed Reports</strong><br /><br />Provide accurate descriptions and item details for easier identification.</div>
              </div>
            </section>

            <section id="packaging" className={`panel ${activeTab === 'packaging' ? 'active' : ''}`}>
              <div className="section-title">📦 Packaging &amp; Handling Tips</div>
              <p className="section-subtitle">Best practices for securing found items</p>
              <div className="tips-grid">
                <div className="tip-card">🧴 <strong>Protect Fragile Items</strong><br /><br />Use bubble wrap or padding for delicate objects.</div>
                <div className="tip-card">🎁 <strong>Seal Securely</strong><br /><br />Ensure items are properly contained before storage.</div>
                <div className="tip-card">🏢 <strong>Classify Correctly</strong><br /><br />Hand keys and sensitive IDs straight to the Library security safe desk.</div>
                <div className="tip-card">🕒 <strong>Update Status</strong><br /><br />Mark items as claimed once they've been recovered.</div>
              </div>
            </section>

            <section id="about" className={`panel ${activeTab === 'about' ? 'active' : ''}`}>
              <div className="section-title">ℹ️ About FindTrack</div>
              <div className="report-form-wrap" style={{ maxWidth: '600px' }}>
                <p style={{ marginBottom: '16px', lineHeight: 1.7 }}>
                  <strong>FindTrack</strong> helps simplify lost and found reporting with fast search tools, organized listings, and a modern recovery system.
                </p>
                <div className="section-title" style={{ fontSize: '16px', marginTop: '8px' }}>📖 How to Use</div>
                <div className="tips-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="tip-card">📦 <strong>Report</strong> — Submit details about lost or found items with photos and location</div>
                  <div className="tip-card">🔍 <strong>Search</strong> — Browse all reported items with advanced filters and category browsing</div>
                  <div className="tip-card">✅ <strong>Claim</strong> — Mark items as found once recovered, or delete your own reports</div>
                  <div className="tip-card">📌 <strong>Pin</strong> — Bookmark items you want quick access to</div>
                </div>
                <div className="tip-banner" style={{ marginTop: '16px' }}>💡 Pro Tip: The more detail you add to reports, the faster items get matched!</div>
              </div>
            </section>

          </main>

          {/* MOBILE HUD BOTTOM NAV */}
          <nav className="bottom-nav" id="bottomNav">
            <button onClick={() => { setActiveTab('home'); setCategoryKeywords(null); }} className={`bnav-btn ${activeTab === 'home' ? 'active' : ''}`}>
              <span className="bnav-icon">🏠</span>Home
            </button>
            <button onClick={() => { setActiveTab('search'); setCategoryKeywords(null); }} className={`bnav-btn ${activeTab === 'search' ? 'active' : ''}`}>
              <span className="bnav-icon">🔍</span>Search
            </button>
            <button onClick={() => { if (profileName === 'Guest') { setShowGuestModal(true); } else { setActiveTab('notifications'); } }} className={`bnav-btn ${activeTab === 'notifications' ? 'active' : ''}`}>
              <span className="bnav-icon">🔔</span>Alerts
            </button>
            <button onClick={() => { setActiveTab('profile'); }} className={`bnav-btn ${activeTab === 'profile' ? 'active' : ''}`}>
              <span className="bnav-icon">👤</span>Profile
            </button>
          </nav>

          {/* MOBILE REPORT INSTANT FAB */}
          <button 
            onClick={() => { if (profileName === 'Guest') { setShowGuestModal(true); } else { setActiveTab('report'); } }} 
            className="report-fab" 
            title="Report Item"
          >
            📦
          </button>

        </div>
      )}

      {/* ── ONBOARDING LIGHT OVERLAY DRAWER ── */}
      {showOnboarding && (
        <div className="onboard-overlay">
          <div className="onboard-card" id="onboardCard">
            <div className="onboard-progress" id="onboardProgress">
              {ONBOARD_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`onboard-pip ${idx < onboardStep ? 'done' : idx === onboardStep ? 'active' : ''}`}
                ></div>
              ))}
            </div>
            
            <div className="onboard-visual">
              <div className="onboard-icon-wrap" id="onboardIcon">
                {ONBOARD_STEPS[onboardStep].icon}
              </div>
            </div>

            <div className="onboard-body">
              <div className="onboard-step-label" id="onboardLabel">{ONBOARD_STEPS[onboardStep].label}</div>
              <div className="onboard-title" id="onboardTitle">{ONBOARD_STEPS[onboardStep].title}</div>
              <div className="onboard-desc" id="onboardDesc">{ONBOARD_STEPS[onboardStep].desc}</div>
              
              <div className="onboard-actions">
                <button 
                  onClick={() => {
                    if (onboardStep < ONBOARD_STEPS.length - 1) {
                      setOnboardStep(prev => prev + 1);
                    } else {
                      setShowOnboarding(false);
                      localStorage.setItem("ft_onboarded", "1");
                    }
                  }} 
                  className="onboard-next" 
                  id="onboardNext"
                >
                  {onboardStep === ONBOARD_STEPS.length - 1 ? "Get Started 🚀" : "Next →"}
                </button>
                <button 
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem("ft_onboarded", "1");
                  }} 
                  className="onboard-skip" 
                  id="onboardSkip"
                >
                  Skip tour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE ZOOM SYSTEM MODAL ── */}
      {zoomImg && (
        <div className="zoom-overlay" onClick={() => setZoomImg(null)}>
          <button className="zoom-close" onClick={() => setZoomImg(null)}>✕</button>
          <img src={zoomImg} className="zoom-img" alt="Zoom view" />
          <div className="zoom-hint">Tap anywhere to close</div>
        </div>
      )}

      {/* ── GUEST ACCESS LOCK LOGIN REQUIRED MODAL ── */}
      {showGuestModal && (
        <div id="guestModal" className="modal" onClick={(e) => { if ((e.target as HTMLElement).id === 'guestModal') setShowGuestModal(false); }}>
          <div className="modal-content">
            <div className="modal-icon">🔒</div>
            <h2>Login Required</h2>
            <p>Please login or sign up to unlock the full features of FindTrack!</p>
            <div className="modal-buttons">
              <button onClick={() => { setShowGuestModal(false); setCurrentView('login'); }} className="modal-btn primary">🔐 Login</button>
              <button onClick={() => { setShowGuestModal(false); setCurrentView('signup'); }} className="modal-btn secondary">📝 Sign Up</button>
            </div>
            <button onClick={() => setShowGuestModal(false)} className="modal-close">Maybe later</button>
          </div>
        </div>
      )}

      {/* ── REAL-TIME DIRECT MESSAGING DRAWER OVERLAY ── */}
      {activeChatId && (
        <ChatInterface
          activeChatId={activeChatId}
          currentUserUid={user ? user.uid : null}
          onClose={() => setActiveChatId(null)}
          onSelectChat={(id) => setActiveChatId(id)}
        />
      )}

    </div>
  );
}

// Cognitive calculation helper utility for similarity matching metrics
function computeMatchScore(a: any, b: any) {
  if (a.type === b.type) return 0;
  if (a.claimed || b.claimed) return 0;

  const textA = `${a.title} ${a.desc || a.description || ""} ${a.location}`.toLowerCase();
  const textB = `${b.title} ${b.desc || b.description || ""} ${b.location}`.toLowerCase();

  const stopWords = new Set(["a", "an", "the", "my", "i", "is", "at", "in", "on", "of", "and", "or", "was", "it", "this", "that", "with", "for", "to"]);
  const tokenise = (t: string) => t.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  const tA = new Set(tokenise(textA));
  const tB = new Set(tokenise(textB));
  if (tA.size === 0 || tB.size === 0) return 0;

  let shared = 0;
  tA.forEach(w => { if (tB.has(w)) shared++; });

  // Jaccard similarity
  const union = new Set([...Array.from(tA), ...Array.from(tB)]).size;
  const jaccard = shared / union;

  // Location bonus
  const locA = (a.location || "").toLowerCase();
  const locB = (b.location || "").toLowerCase();
  const locBonus = (locA && locB && (locA.includes(locB.slice(0, 5)) || locB.includes(locA.slice(0, 5)))) ? 0.15 : 0;

  return Math.min(1, jaccard + locBonus);
}
