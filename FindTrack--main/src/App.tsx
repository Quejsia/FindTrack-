import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
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
  where,
  orderBy
} from 'firebase/firestore';
import { 
  auth, 
            <div className="auth-card bg-surface relative p-6 rounded-xl">
              <div>
                <h2 className="mt-0 font-headline-lg text-headline-lg text-on-surface">Create an account</h2>
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">Already a member? <button onClick={() => setCurrentView('login')} className="font-label-md text-label-md font-semibold text-primary hover:text-primary-dim transition-colors">Login here</button></p>
              </div>

              <div className="mt-6">
                <form onSubmit={handleSignupSubmit} className="space-y-6">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface" htmlFor="first">First Name</label>
                    <div className="mt-2">
                      <input id="first" name="first" type="text" required className="block w-full rounded-lg border-0 py-3 px-4 text-on-surface bg-surface-container-low shadow-sm ring-1 ring-inset ring-outline-variant placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-body-md font-body-md" placeholder="First name" value={signupFirst} onChange={(e) => setSignupFirst(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface" htmlFor="last">Last Name</label>
                    <div className="mt-2">
                      <input id="last" name="last" type="text" required className="block w-full rounded-lg border-0 py-3 px-4 text-on-surface bg-surface-container-low shadow-sm ring-1 ring-inset ring-outline-variant placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-body-md font-body-md" placeholder="Last name" value={signupLast} onChange={(e) => setSignupLast(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface" htmlFor="email-signup">Email address</label>
                    <div className="mt-2">
                      <input id="email-signup" name="email" type="email" required className="block w-full rounded-lg border-0 py-3 px-4 text-on-surface bg-surface-container-low shadow-sm ring-1 ring-inset ring-outline-variant placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-body-md font-body-md" placeholder="you@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface" htmlFor="contact">Contact (optional)</label>
                    <div className="mt-2">
                      <input id="contact" name="contact" type="text" className="block w-full rounded-lg border-0 py-3 px-4 text-on-surface bg-surface-container-low shadow-sm ring-1 ring-inset ring-outline-variant placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-body-md font-body-md" placeholder="+63 912 345 6789" value={signupContact} onChange={(e) => setSignupContact(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface" htmlFor="password-signup">Password</label>
                    <div className="mt-2">
                      <input id="password-signup" name="password" type={showPass ? 'text' : 'password'} required className="block w-full rounded-lg border-0 py-3 px-4 text-on-surface bg-surface-container-low shadow-sm ring-1 ring-inset ring-outline-variant placeholder:text-outline focus:ring-2 focus:ring-inset focus:ring-primary sm:text-body-md font-body-md" placeholder="Create a secure password" value={authPassword} onChange={(e) => setAuthPass(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-low" />
                    <label htmlFor="terms" className="ml-3 block font-body-md text-body-md text-on-surface-variant">I agree to the <button type="button" className="text-primary hover:underline">Terms of Service</button> and <button type="button" className="text-primary hover:underline">Privacy Policy</button>.</label>
                  </div>

                  <div>
                    <button type="submit" className="flex w-full justify-center rounded-lg bg-primary-container px-3 py-3 font-label-md text-label-md font-semibold text-on-primary-container shadow-sm hover:bg-primary-fixed">Create Account</button>
                  </div>
                </form>
              </div>
  const [signupContact, setSignupContact] = useState('');
  
  // App alerts, loading states & real-time sync list
  const [items, setItems] = useState<ItemReport[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'error' }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Dashboard inputs
  const [reportTitle, setReportTitle] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [reportImage, setReportImage] = useState<string>('');
  const [reportImageFile, setReportImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reportSecurityQuestion, setReportSecurityQuestion] = useState('');
  const [reportSecurityAnswer, setReportSecurityAnswer] = useState('');
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

  const handleBackToSafety = () => {
    if (auth.currentUser) {
      if (auth.currentUser.email && !auth.currentUser.emailVerified) {
        setCurrentView('verify-email');
        window.history.pushState(null, '', '/verify-email');
      } else {
        setCurrentView('dashboard');
        window.history.pushState(null, '', '/');
      }
    } else {
      try {
        const guestSession = localStorage.getItem("sessionUser");
        if (guestSession) {
          const session = JSON.parse(guestSession);
          if (session && session.email === "") {
            setCurrentView('dashboard');
            window.history.pushState(null, '', '/');
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setCurrentView('landing');
      window.history.pushState(null, '', '/');
    }
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
        
        // Sync profile data from localStorage context if exists
        try {
          const lProfile = localStorage.getItem("userProfile");
          if (lProfile) {
            const parsed = JSON.parse(lProfile);
            if (parsed.name && parsed.name !== 'Guest') {
              setProfileName(parsed.name);
            } else {
              setProfileName(currentUser.displayName || currentUser.email?.split('@')[0] || "User");
            }
            if (parsed.contact) setProfileContact(parsed.contact);
            if (parsed.avatar && !parsed.avatar.includes('guest')) {
              setProfileAvatar(parsed.avatar);
            }
          } else {
            setProfileName(currentUser.displayName || currentUser.email?.split('@')[0] || "User");
          }
        } catch (e) {
          console.error(e);
        }
        
        // Block unverified email users from accessing protected views (dashboard)
        const path = window.location.pathname;
        if (path === '/privacy' || path === '/terms') {
          setCurrentView(path === '/privacy' ? 'privacy' : 'terms');
        } else if (currentUser.email && !currentUser.emailVerified) {
          setCurrentView('verify-email');
        } else {
          // Force token refresh on load to prevent stale email_verified claims from breaking rules
          if (currentUser.emailVerified) {
             currentUser.getIdToken(true).catch(console.error);
          }
          // Switch view to dashboard on successful load
          setCurrentView('dashboard');
        }
      } else {
        // If guest is currently in session, direct to dashboard
        try {
          const guestSession = localStorage.getItem("sessionUser");
          if (guestSession) {
            const session = JSON.parse(guestSession);
            if (session && session.email === "") {
              setProfileName("Guest");
              setProfileEmail("");
              const path = window.location.pathname;
              if (path === '/privacy' || path === '/terms') {
                setCurrentView(path === '/privacy' ? 'privacy' : 'terms');
              } else {
                setCurrentView('dashboard');
              }
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

  // Handle browser back/forward buttons (routing sync)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/privacy') {
        setCurrentView('privacy');
      } else if (path === '/terms') {
        setCurrentView('terms');
      } else if (path === '/login') {
        setCurrentView('login');
      } else if (path === '/signup') {
        setCurrentView('signup');
      } else if (path === '/' || path === '') {
        if (auth.currentUser) {
          if (auth.currentUser.email && !auth.currentUser.emailVerified) {
            setCurrentView('verify-email');
          } else {
            setCurrentView('dashboard');
          }
        } else {
          setCurrentView('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

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

  // Safeguard: Block unverified users from accessing protected views (dashboard) and redirect them to verify screen
  useEffect(() => {
    if (auth.currentUser && auth.currentUser.email && !auth.currentUser.emailVerified && currentView === 'dashboard') {
      setCurrentView('verify-email');
    }
  }, [currentView, user]);

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
    if (loadingAuth) return;
    if (!authEmail || !authPassword) {
      triggerToast("❌ Please enter your email and password.", "error");
      return;
    }

    setLoadingAuth(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      localStorage.setItem('sessionUser', JSON.stringify({
        id: credentials.user.uid,
        email: credentials.user.email
      }));
      triggerToast("✅ Login successful! Redirecting...", "success");
      setAuthEmail('');
      setAuthPass('');
      if (credentials.user.email && !credentials.user.emailVerified) {
        setCurrentView('verify-email');
      } else {
        setCurrentView('dashboard');
      }
    } catch (err: any) {
      console.error("SignIn error:", err);
      triggerToast("❌ Invalid email or password. Please try again.", "error");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!authEmail || !authEmail.trim()) {
      triggerToast('Please enter the email address to send reset link.', 'info');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, authEmail.trim());
      triggerToast('Password reset email sent. Check your inbox.', 'success');
    } catch (err: any) {
      console.error('Password reset error:', err);
      triggerToast('Failed to send password reset email.', 'error');
    }
  };

  // Handle Firebase Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingAuth) return;
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

    setLoadingAuth(true);
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

      // Automatically send a verification email using Firebase sendEmailVerification()
      try {
        const actionCodeSettings = {
          url: "https://find-track-6kzf.vercel.app",
          handleCodeInApp: false,
        };
        await sendEmailVerification(credentials.user, actionCodeSettings);
        triggerToast("✅ Account created! Please check your email to verify.", "success");
      } catch (err: any) {
        console.error("Verification email sending failed:", err);
        triggerToast("❌ Account created, but email verification failed to send. Try resending.", "error");
      }
      
      setSignupFirst('');
      setSignupLast('');
      setSignupContact('');
      setAuthEmail('');
      setAuthPass('');
      setCurrentView('verify-email');
    } catch (err: any) {
      console.error("SignUp error:", err);
      if (err.code === 'auth/email-already-in-use') {
        triggerToast("❌ Email already registered.", "error");
      } else {
        triggerToast("❌ Signup failed. Try again.", "error");
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Logout
  const handleLogoutAction = async () => {
    localStorage.removeItem('sessionUser');
    // Keeping userProfile locally since we do not currently sync names/avatars to a users collection.
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
    setReportImageFile(file);
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

    setIsUploading(true);
    let finalImageUrl = reportImage || '';

    if (reportImageFile) {
      try {
        finalImageUrl = await uploadToCloudinary(reportImageFile);
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        triggerToast("❌ Failed to upload image.", "error");
        setIsUploading(false);
        return;
      }
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
      contactInfo: `${profileContact || 'No contact provided'} | Email: ${reportEmail.trim() || profileEmail || 'No email provided'}`,
      date: new Date().toISOString(),
      imageUrl: finalImageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      claimed: false,
      securityQuestion: reportSecurityQuestion.trim(),
      securityAnswer: reportSecurityAnswer.trim().toLowerCase()
    };

    try {
      await setDoc(doc(db, 'items', payloadId), reportData);
      triggerToast("✅ Report submitted successfully!", "success");
      
      // Reset form variables
      setReportTitle('');
      setReportLocation('');
      setReportDesc('');
      setReportEmail('');
      setReportType('lost');
      setReportImage('');
      setReportImageFile(null);
      setReportSecurityQuestion('');
      setReportSecurityAnswer('');

      // Auto redirect to home feed out of form
      setActiveTab('home');
    } catch (err) {
      console.error("Firestore creation error:", err);
      triggerToast("❌ Submission rejected by security parameters.", "error");
      try {
        handleFirestoreError(err, OperationType.CREATE, `items/${payloadId}`);
      } catch (e) {}
    } finally {
      setIsUploading(false);
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

  const liveStats = useMemo(() => {
    const itemsRecovered = items.filter(item => item.claimed).length;
    const activeListings = items.filter(item => !item.claimed).length;
    const communityMembers = new Set(
      items
        .map(item => item.userId)
        .filter((userId): userId is string => Boolean(userId))
    ).size;

    return {
      itemsRecovered,
      activeListings,
      communityMembers
    };
  }, [items]);

  const countForKeywords = (keywords: string[]) => {
    const kw = keywords.map(k => k.toLowerCase());
    return items.filter(item => {
      const text = `${item.title} ${item.desc || item.description || ''} ${item.location}`.toLowerCase();
      return kw.some(k => text.includes(k));
    }).length;
  };

  const featuredTestimonial = useMemo(() => {
    return testimonials.find((testimonial: any) => typeof testimonial.quote === 'string' && testimonial.quote.trim()) || null;
  }, [testimonials]);

  const openAuthView = (mode: 'login' | 'signup') => {
    if (user) {
      setCurrentView('dashboard');
      window.history.pushState(null, '', '/');
      return;
    }

    setCurrentView(mode);
    window.history.pushState(null, '', mode === 'login' ? '/login' : '/signup');
  };

  const handleStartReporting = () => {
    if (user || profileName === 'Guest') {
      setCurrentView('dashboard');
      window.history.pushState(null, '', '/');
      return;
    }

    setCurrentView('signup');
    window.history.pushState(null, '', '/signup');
  };

  const handleHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      {/* ── IMMERSIVE BACKGROUND GRID (Only on auth views) ── */}
      {(currentView === 'login' || currentView === 'signup' || currentView === 'verify-email') && (
        <div className="bg-scene">
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-grid"></div>
        </div>
      )}

      {/* ── VIEW 1: LANDING PAGE ── */}
      {currentView === 'landing' && (
        <div className="min-h-screen bg-surface text-on-surface">
          <section id="top" className="relative isolate overflow-hidden bg-surface-container-highest">
            <div className="absolute inset-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDC3YRMFuO-lEwm9bKTIguR-1belAnXoHIgeigQ3q4SUYgObcsSiNUjHnpR_ZfqvyDsqJKY7pe4fPQ9fAxiXPLcUxQOJOcX6tgsnNpBIFjznIY1JDEnT0amN_j0g91NAtN4xOqL_xe6gYYA1U5PBGH18oRD2F1fn_Z1eAqQ2CYzkwKBwB-0d16PaU0F6IfiXoXHmT6Txuseum5Be0PuKe26wtdeMNMjFB0UJczwaKK0iUeWAfbVmcG-yd4WQJ83LfWGXw7GPVkDQ"
                alt="A vibrant cityscape with lush greenery and community warmth"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-surface/20 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            </div>

            <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
              <header className="flex items-center justify-between rounded-full border border-white/50 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
                <button onClick={() => { setCurrentView('landing'); window.history.pushState(null, '', '/'); }} className="flex items-center gap-3 text-left">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/20">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-['Inter'] text-lg font-semibold tracking-tight text-primary-dim">FindTrack</div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-on-surface-variant">Lost & found community</div>
                  </div>
                </button>
                <nav className="hidden items-center gap-6 md:flex">
                  <button onClick={() => { setCurrentView('landing'); window.history.pushState(null, '', '/'); }} className="text-sm font-semibold text-primary">Home</button>
                  <button onClick={handleHowItWorks} className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">How it Works</button>
                  <button onClick={() => { setCurrentView('landing'); window.history.pushState(null, '', '/'); }} className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Community</button>
                  <button onClick={() => { setCurrentView('privacy'); window.history.pushState(null, '', '/privacy'); }} className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Safety</button>
                </nav>
                <div className="flex items-center gap-3">
                  <button onClick={() => openAuthView('login')} className="hidden rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 sm:inline-flex">
                    Login
                  </button>
                  <button onClick={() => openAuthView('signup')} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-md transition hover:bg-primary-dim">
                    Get Started
                  </button>
                </div>
              </header>

              <div className="flex flex-1 items-center justify-center py-14 sm:py-20">
                <div className="max-w-3xl rounded-[28px] border border-white/50 bg-white/80 p-8 text-center shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-10 lg:p-14">
                  <p className="mb-4 inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Trusted local recovery</p>
                  <h1 className="font-['Inter'] text-4xl font-bold leading-tight text-primary-dim sm:text-5xl lg:text-6xl">
                    Find what's lost.<br />Restore community trust.
                  </h1>
                  <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">
                    FindTrack helps Filipinos recover lost belongings through trusted community reporting and verified recovery workflows.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <button onClick={handleStartReporting} className="inline-flex items-center justify-center gap-2 rounded-full bg-tertiary-container px-6 py-3 text-sm font-semibold text-on-tertiary-container shadow-lg shadow-tertiary-container/20 transition hover:brightness-95">
                      <PenTool className="h-4 w-4" />
                      Start Reporting
                    </button>
                    <button onClick={handleHowItWorks} className="inline-flex items-center justify-center rounded-full border border-primary/20 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">
                      How it Works
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="bg-surface-container-lowest py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-['Inter'] text-3xl font-semibold tracking-tight text-primary-dim sm:text-4xl">Three Pillars of Recovery</h2>
                <p className="mt-3 text-lg text-on-surface-variant">A seamless workflow designed to bring your items back home.</p>
              </div>
              <div className="mt-12 grid gap-6 lg:grid-cols-3">
                <div className="rounded-[24px] border border-outline-variant/30 bg-surface-container p-8 shadow-sm transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                    <PenTool className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-['Inter'] text-xl font-semibold text-primary-dim">Report</h3>
                  <p className="mt-3 text-base leading-7 text-on-surface-variant">Quickly document lost or found items with AI-assisted details for precise matching.</p>
                </div>
                <div className="rounded-[24px] border border-outline-variant/30 bg-surface-container-low p-8 shadow-sm transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-surface">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-['Inter'] text-xl font-semibold text-primary-dim">Connect</h3>
                  <p className="mt-3 text-base leading-7 text-on-surface-variant">Securely message community members when a match is found, protecting your privacy.</p>
                </div>
                <div className="rounded-[24px] border border-outline-variant/30 bg-surface-container p-8 shadow-sm transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
                    <Hand className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-['Inter'] text-xl font-semibold text-primary-dim">Recover</h3>
                  <p className="mt-3 text-base leading-7 text-on-surface-variant">Follow verified hand-off protocols to ensure items return home safely and securely.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container py-20">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
              <div>
                <h2 className="font-['Inter'] text-3xl font-semibold tracking-tight text-primary-dim sm:text-4xl">By the Community,<br />For the Community.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">Built on the foundation of Bayanihan, FindTrack empowers everyday Filipinos to look out for one another.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-6 shadow-sm">
                    <div className="text-4xl font-semibold tracking-tight text-primary">{liveStats.itemsRecovered.toLocaleString()}</div>
                    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Items Recovered</div>
                  </div>
                  <div className="rounded-[24px] border border-outline-variant/30 bg-surface p-6 shadow-sm">
                    <div className="text-4xl font-semibold tracking-tight text-primary">{liveStats.activeListings.toLocaleString()}</div>
                    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Active Listings</div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-on-surface-variant">Community members currently participating: {liveStats.communityMembers.toLocaleString()}</p>
              </div>

              <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Community voice</p>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">Live</div>
                </div>
                {featuredTestimonial ? (
                  <>
                    <p className="mt-6 text-xl leading-8 text-on-surface">“{featuredTestimonial.quote}”</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container font-semibold text-primary-dim">
                        {(featuredTestimonial.author || 'Community').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface">{featuredTestimonial.author || 'Community member'}</div>
                        <div className="text-sm text-on-surface-variant">{featuredTestimonial.role || 'Community testimonial'}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-6 text-xl leading-8 text-on-surface">A testimonial will appear here once the content team adds one to the live database.</p>
                    <p className="mt-4 text-sm leading-6 text-on-surface-variant">No placeholder quote or name is being fabricated for this homepage.</p>
                  </>
                )}
              </div>
            </div>
          </section>

          <footer className="border-t border-outline-variant/30 bg-surface-container-highest">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
              <div>
                <div className="font-['Inter'] text-xl font-semibold text-on-surface">FindTrack</div>
                <p className="mt-3 max-w-sm text-sm leading-7 text-on-surface-variant">© 2026 FindTrack Philippines. Empowering communities through trust and recovery.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setCurrentView('landing'); window.history.pushState(null, '', '/'); }} className="text-left text-sm font-medium text-on-surface-variant transition hover:text-primary">About Us</button>
                  <button onClick={() => { setCurrentView('privacy'); window.history.pushState(null, '', '/privacy'); }} className="text-left text-sm font-medium text-on-surface-variant transition hover:text-primary">Privacy Policy</button>
                  <button onClick={() => { setCurrentView('terms'); window.history.pushState(null, '', '/terms'); }} className="text-left text-sm font-medium text-on-surface-variant transition hover:text-primary">Terms of Service</button>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setCurrentView('privacy'); window.history.pushState(null, '', '/privacy'); }} className="text-left text-sm font-medium text-on-surface-variant transition hover:text-primary">Safety Guidelines</button>
                  <button onClick={() => { setCurrentView('landing'); window.history.pushState(null, '', '/'); }} className="text-left text-sm font-medium text-on-surface-variant transition hover:text-primary">Help Center</button>
                  <button onClick={() => { setCurrentView('landing'); window.history.pushState(null, '', '/'); }} className="text-left text-sm font-medium text-on-surface-variant transition hover:text-primary">Contact Us</button>
                </div>
              </div>
            </div>
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
              <div className="auth-logo-icon"><Search className="text-white" /></div>
              <h1>FindTrack</h1>
              <p>Lost &amp; Found System</p>
            </div>

            <div className="auth-card glass-panel w-full max-w-md rounded-xl p-xl relative z-10">
              <div className="text-center mb-xl">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-sm">FindTrack</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Welcome back to the community.</p>
              </div>

              <form className="space-y-lg" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                    <input id="email" name="email" type="email" required className="w-full pl-10 pr-sm py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="you@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs" htmlFor="password">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                    <input id="password" name="password" type={showPass ? 'text' : 'password'} required className="w-full pl-10 pr-sm py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPass(e.target.value)} />
                    <button type="button" className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>
                  <div className="flex justify-end mt-xs">
                    <button type="button" onClick={handleSendPasswordReset} className="font-label-md text-label-md text-primary hover:text-primary-dim transition-colors">Forgot Password?</button>
                  </div>
                </div>

                <button className="w-full py-sm px-md bg-primary text-on-primary rounded-lg font-body-lg text-body-lg font-medium hover:bg-primary-dim transition-colors shadow-sm flex items-center justify-center gap-sm" type="submit" disabled={loadingAuth}>
                  {loadingAuth ? <span>Sending…</span> : <><Lock className="h-5 w-5 inline" /> Sign In</>}
                </button>
              </form>

              <div className="mt-xl text-center">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Don't have an account?{' '}
                  <button onClick={() => setCurrentView('signup')} className="text-primary font-semibold hover:underline transition-all">Sign up</button>
                </p>
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
              <div className="auth-logo-icon"><Search className="text-white" /></div>
              <h1>FindTrack</h1>
              <p>Lost &amp; Found System</p>
            </div>

            <div className="auth-card">
              <div className="card-title">Create your account</div>
              <div className="card-sub">Be one of the first users of FindTrack</div>

              <form onSubmit={handleSignupSubmit}>
                <div className="fields-row">
                  <div className="field">
                    <label>First Name</label>
                    <div className="field-wrap">
                      <span className="field-icon"><UserIcon className="h-5 w-5 text-slate-400" /></span>
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
                      <span className="field-icon"><UserIcon className="h-5 w-5 text-slate-400" /></span>
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
                    <span className="field-icon"><Mail className="h-5 w-5 text-slate-400" /></span>
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
                    <span className="field-icon"><Smartphone className="h-5 w-5 text-slate-400" /></span>
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
                    <span className="field-icon"><Lock className="h-5 w-5 text-slate-400" /></span>
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
                      className="eye-btn text-slate-400 hover:text-slate-600 transition-colors"
                      style={{ background: 'none', border: 'none', padding: '0 12px', cursor: 'pointer' }}
                    >
                      {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loadingAuth} style={loadingAuth ? {opacity: 0.7, cursor: 'not-allowed'} : {}}>
                  {loadingAuth ? 'Creating Account...' : <><UserPlus className="h-5 w-5 inline" /> Create Account</>}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account? <button onClick={() => setCurrentView('login')} className="text-[#38bdf8] font-bold hover:underline">Sign in →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 5: VERIFY EMAIL SCREEN ── */}
      {currentView === 'verify-email' && (
        <div className="landing-page flex items-center justify-center">
          <div className="auth-wrap">
            <div className="back-link">
              <button onClick={async () => { await logOut(); setCurrentView('landing'); }} className="text-slate-400 hover:text-white transition">← Logout &amp; return</button>
            </div>

            <div className="auth-logo">
              <div className="auth-logo-icon"><Search className="text-white" /></div>
              <h1>FindTrack</h1>
              <p>Email Verification Required</p>
            </div>

            <div className="auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card-title" style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Verify Your Email</div>
              <div className="card-sub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '8px' }}>
                We've sent a verification email to <strong style={{ color: '#38bdf8' }}>{auth.currentUser?.email || profileEmail || "your email address"}</strong>. 
                Please check your inbox (including your spam folder) and click the verification link.
              </div>
              
              <div className="card-sub bg-slate-800/50 p-3 rounded-md border border-slate-700 text-left" style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '2px' }}>
                <strong className="text-slate-300">💡 Hint:</strong> If the link says it's <em>"expired or already used"</em>, make sure you are clicking the <strong>most recent</strong> link if you requested multiple. Also, your email app might have auto-scanned it—meaning it's already verified. Just click "Check Verification Status" below.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={async () => {
                    try {
                      if (auth.currentUser) {
                        await auth.currentUser.reload();
                        if (auth.currentUser.emailVerified) {
                          // Force refresh the JWT token so Firestore rules see the updated email_verified state
                          await auth.currentUser.getIdToken(true);
                          triggerToast("✅ Verification successful! Welcome to FindTrack.", "success");
                          setCurrentView('dashboard');
                        } else {
                          triggerToast("ℹ️ Email is not verified yet. Please check your inbox.", "error");
                        }
                      } else {
                        triggerToast("❌ Session lost. Please log in again.", "error");
                        setCurrentView('login');
                      }
                    } catch (e: any) {
                      console.error(e);
                      triggerToast("❌ " + (e.message || "Failed to check status."), "error");
                    }
                  }} 
                  className="btn-submit"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🔄 Check Verification Status
                </button>

                <button 
                  onClick={async () => {
                    if (resendCooldown > 0) return;
                    try {
                      if (auth.currentUser) {
                        const actionCodeSettings = {
                          url: "https://find-track-6kzf.vercel.app",
                          handleCodeInApp: false,
                        };
                        await sendEmailVerification(auth.currentUser, actionCodeSettings);
                        triggerToast("✅ Verification email resent!", "success");
                        setResendCooldown(30);
                      } else {
                        triggerToast("❌ Session lost. Please log in again.", "error");
                        setCurrentView('login');
                      }
                    } catch (e: any) {
                      console.error(e);
                      if (e.message?.includes('too-many-requests')) {
                        triggerToast("❌ Too many requests. Please wait a minute and try again.", "error");
                        setResendCooldown(60);
                      } else {
                        triggerToast("❌ " + (e.message || "Failed to resend email."), "error");
                      }
                    }
                  }}
                  disabled={resendCooldown > 0}
                  className="btn-submit"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: '500', fontSize: '13px', background: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', color: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}
                >
                  {resendCooldown > 0 ? `⏳ Wait ${resendCooldown}s to Resend` : '📨 Resend Verification Email'}
                </button>
              </div>

              <div className="auth-footer" style={{ marginTop: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'center' }}>
                Already verified? Click "Check Verification Status" above.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 6: PRIVACY POLICY PAGE ── */}
      {currentView === 'privacy' && (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)', color: '#f8fafc', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '36px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }} className="mx-auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>🔒</span>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', lineHeight: 1.2 }}>Privacy Policy</h1>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>FindTrack Lost &amp; Found Platform</p>
                </div>
              </div>
              <button 
                onClick={handleBackToSafety}
                style={{ background: 'rgba(255, 255, 255, 0.12)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                className="hover:bg-white/20 transition-all"
              >
                ← Go Back
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.85)' }}>
              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>1. Introduction</h3>
                <p>Welcome to FindTrack. We are dedicated to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, and process your information when you use our lost and found platform.</p>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>2. Information We Collect</h3>
                <p>To provide our services, facilitate claiming, and enable safe communications, we collect the following personal details:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Account Credentials:</strong> Full name, verified email address, and profile pictures when you register.</li>
                  <li><strong>Contact Information:</strong> Phone numbers or social handle contact info you voluntarily provide so claimants/finders can get in touch with you.</li>
                  <li><strong>Item Reports Data:</strong> Item characteristics, dates, text descriptions, images of lost or found belongings, and exact or approximate locations where items were misplaced or recovered.</li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>3. How We Use Your Information</h3>
                <p>We process your personal information for purposes based on legitimate interests, the fulfillment of our services, and user convenience:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>To facilitate user account creation, profile management, and authentication check-ins.</li>
                  <li>To list lost/found items and coordinate ownership claims between users.</li>
                  <li>To send real-time alerts or email matchmaker suggestions and notifications about matching items.</li>
                  <li>To provide direct communication channels specifically for coordinating item returns.</li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>4. Data Security &amp; Storage</h3>
                <p>Your account, contact profile information, and reported item details are safely stored using secure Cloud Firebase/Firestore infrastructure. Only authorized users can update their profiles or manage active items. We implement security protocols to protect your personal information against unauthorized retrieval, alteration, or disclosure.</p>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>5. Your Rights &amp; Data Deletion</h3>
                <p>You can access, modify, or delete your personal contact coordinates at any time directly through the <strong>My Profile</strong> or <strong>My Items</strong> dashboards. If you wish to completely close your account or wipe your listing data, please reach out to our team or use the direct profile purge settings.</p>
              </section>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · FindTrack Platform Security
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 7: TERMS OF SERVICE PAGE ── */}
      {currentView === 'terms' && (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)', color: '#f8fafc', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '36px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }} className="mx-auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>⚖️</span>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', lineHeight: 1.2 }}>Terms of Service</h1>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>FindTrack Lost &amp; Found Platform</p>
                </div>
              </div>
              <button 
                onClick={handleBackToSafety}
                style={{ background: 'rgba(255, 255, 255, 0.12)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                className="hover:bg-white/20 transition-all"
              >
                ← Go Back
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.85)' }}>
              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>1. Agreement to Terms</h3>
                <p>By registering, logging in, browsing as a guest, or submitting reports on FindTrack, you accept and agree to follow these Terms of Service. If you do not agree to all of these Terms, you are prohibited from using the application.</p>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>2. User Responsibilities &amp; Acceptable Use</h3>
                <p>When posting lost or found items and interacting with other community members, you agree to:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Provide accurate, genuine, and reliable details regarding found objects, locations, and descriptions.</li>
                  <li>Refrain from listing fraudulent claims, fake items, offensive photos, or inaccurate contact information.</li>
                  <li>Respect other users and use the interactive real-time coordinates, chats, and claims desk only for legitimate recovery purposes.</li>
                  <li>Never attempt to gain unauthorized access to other user profiles, databases, or restricted platform APIs.</li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>3. Verification of Ownership &amp; Meetups</h3>
                <p>FindTrack provides verification mechanisms (such as custom security confirmation questions) to help confirm proof of ownership prior to release. However:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Users are solely responsible for thoroughly vetting proof of ownership before handing over items.</li>
                  <li>Physical meetups, handling of high-value items, and exchanges are at your own discretion. We encourage coordinating safe, public, well-lit spaces (such as security desk areas, campuses, or official lost and found centers).</li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>4. Disclaimer of Warrant &amp; Limitation of Liability</h3>
                <p>FindTrack is provided "as is" and "as available". We do not guarantee that your lost items will be found, or that matches suggested by the system are 100% correct. Under no circumstances shall FindTrack, our developers, or our affiliates be liable for damages, item damage, theft, fraud, or any conflicts arising from physical item exchange coordinates.</p>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>5. Modifications to Service</h3>
                <p>We reserves the right to modify or adjust the features, layouts, database rules, or services of FindTrack at any time. Continued use of the platform after updates indicates consent to all revised guidelines.</p>
              </section>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · FindTrack Community Terms
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
                <div className="logo"><Search className="h-4 w-4 text-white" /></div>
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
                <Home className="h-4 w-4 inline mr-1.5" /> Home
              </button>
              <button 
                onClick={() => { 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('report'); }
                }} 
                className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              >
                <Package className="h-4 w-4 inline mr-1.5" /> Report
              </button>
              <button 
                onClick={() => { setActiveTab('search'); setCategoryKeywords(null); }} 
                className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              >
                <Search className="h-4 w-4 inline mr-1.5" /> Search
              </button>
              <button 
                onClick={() => { 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('notifications'); }
                }} 
                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              >
                <Bell className="h-4 w-4 inline mr-1.5" /> Alerts
              </button>
              <button 
                onClick={() => { setActiveTab('profile'); }} 
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <UserIcon className="h-4 w-4 inline mr-1.5" /> Profile
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
                <Home className="h-4 w-4 inline mr-1" /> Home
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('report'); }
                }} 
                className="drawer-item"
              >
                <Package className="h-4 w-4 inline mr-1" /> Report Item
              </li>
              <li 
                onClick={() => { setActiveTab('search'); setCategoryKeywords(null); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <Search className="h-4 w-4 inline mr-1" /> Search
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('notifications'); }
                }} 
                className="drawer-item"
              >
                <Bell className="h-4 w-4 inline mr-1" /> Alerts
              </li>
              <li 
                onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <UserIcon className="h-4 w-4 inline mr-1" /> Profile
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
                <Inbox className="h-4 w-4 inline mr-1" /> My Items
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  if (profileName === 'Guest') { setShowGuestModal(true); } 
                  else { setActiveTab('pinned'); }
                }} 
                className="drawer-item"
              >
                <MapPin className="h-4 w-4 inline mr-1" /> Pinned Items
              </li>
              <li 
                onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <Tag className="h-4 w-4 inline mr-1" /> Categories
              </li>
              <li 
                onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <PenTool className="h-4 w-4 inline mr-1" /> Analytics
              </li>
              <hr />
              <li 
                onClick={() => { setActiveTab('tips'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <Info className="h-4 w-4 inline mr-1" /> Recovery Tips
              </li>
              <li 
                onClick={() => { setActiveTab('packaging'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <Package className="h-4 w-4 inline mr-1" /> Packaging Tips
              </li>
              <li 
                onClick={() => { setActiveTab('about'); setSidebarOpen(false); }} 
                className="drawer-item"
              >
                <CheckCircle2 className="h-4 w-4 inline mr-1" /> About / Help
              </li>
              <li 
                onClick={() => { 
                  setSidebarOpen(false); 
                  window.location.href = "mailto:novapulsarsupport@gmail.com?subject=FindTrack%20Beta%20Feedback&body=Hi%20FindTrack%20Team%2C%20here%20is%20my%20feedback%3A%20";
                }} 
                className="drawer-item"
              >
                <Lightbulb className="h-4 w-4 inline mr-1" /> Feedback
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
                  {profileName === 'Guest' && !guestBannerDismissed && (
                    <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                        <p style={{ color: '#854d0e', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                          You're browsing as a guest. Sign in to report or claim items.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                        <button 
                          onClick={() => {
                            setCurrentView('login');
                          }}
                          style={{ padding: '8px 16px', backgroundColor: '#ca8a04', color: 'white', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                        >
                          Sign In
                        </button>
                        <button 
                          onClick={() => setGuestBannerDismissed(true)}
                          style={{ padding: '8px 16px', backgroundColor: '#fef08a', color: '#854d0e', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                        >
                          Continue as Guest
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="welcome-card">
                    <div className="welcome-left">
                      <p className="muted">Welcome back</p>
                      <h1 id="welcomeUser" className="welcome-title">Hello, {profileName.split(" ")[0]}!</h1>
                      <p className="muted" style={{ fontSize: '13px' }}>Here's your activity summary</p>
                    </div>
                    <div className="stats-cards">
                      <div className="stat-card">
                        <div className="stat-icon"><MapPin className="h-5 w-5 text-red-500" /></div>
                        <div className="stat-label">Lost</div>
                        <div id="countLost" className="stat-value">{stats.lost}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon"><Search className="h-5 w-5 text-sky-500" /></div>
                        <div className="stat-label">Found</div>
                        <div id="countFound" className="stat-value">{stats.found}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                        <div className="stat-label">Claimed</div>
                        <div id="countClaimed" className="stat-value">{stats.claimed}</div>
                      </div>
                    </div>
                  </div>

                  <div className="recent-section">
                    <div className="recent-header">
                      <h3><Inbox className="h-5 w-5 inline mr-1 text-sky-500" /> Recent Reports Feed</h3>
                    </div>
                    <div id="recentList" className="recent-list">
                      {items.slice(0, 5).map(r => (
                        <div key={r.id} onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }} className="recent-item">
                          <div className="recent-thumb">
                            {r.image || r.imageUrl ? (
                              <img src={r.image || r.imageUrl} alt="" />
                            ) : (
                              r.type === 'lost' ? <MapPin className="h-6 w-6 text-red-500" /> : <Search className="h-6 w-6 text-sky-500" />
                            )}
                          </div>
                          <div className="recent-info">
                            <div className="recent-title">{r.title}</div>
                            <div className="recent-meta">{r.location || "Location unknown"} · {r.date ? new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Just now"}</div>
                          </div>
                          <div className={`badge ${r.claimed ? 'claimed' : r.type}`}>
                            {r.claimed ? "CLAIMED" : r.type.toUpperCase()}
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
                          No reports yet — start by reporting an item!
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tip-banner"><Lightbulb className="h-4 w-4 inline text-amber-500 mr-1" /> Tip: Report lost items within 24 hours for the best chance of recovery!</div>

                  <footer style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }} className="sm:flex-row">
                    <p>© {new Date().getFullYear()} FindTrack · Lost &amp; Found System</p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button 
                        onClick={() => {
                          setCurrentView('privacy');
                          window.history.pushState(null, '', '/privacy');
                        }} 
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontWeight: '600', color: '#475569' }}
                        className="hover:text-slate-900 transition"
                      >
                        Privacy Policy
                      </button>
                      <button 
                        onClick={() => {
                          setCurrentView('terms');
                          window.history.pushState(null, '', '/terms');
                        }} 
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontWeight: '600', color: '#475569' }}
                        className="hover:text-slate-900 transition"
                      >
                        Terms of Service
                      </button>
                    </div>
                  </footer>
                </div>
              )}
            </section>

            {/* PANEL: REPORT SUBMISSION */}
            <section id="report" className={`panel ${activeTab === 'report' ? 'active' : ''}`}>
              <div className="section-title"><Package className="h-5 w-5 inline mr-1 text-sky-500" /> Report Lost / Found Item</div>
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
                    <label htmlFor="r_email">Contact Email</label>
                    <input 
                      id="r_email" 
                      type="email" 
                      placeholder="e.g., mail@example.com (so people can reach you)" 
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                    />
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
                    <label htmlFor="r_securityQuestion" className="text-slate-800 font-bold" style={{ fontWeight: 'bold', color: '#1e293b' }}><Key className="h-4 w-4 inline mr-1" /> OWNER SECRET QUESTION (OPTIONAL)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        id="r_securityQuestion" 
                        type="text" 
                        placeholder="e.g., What color sticker is on the back? / What's the keychain brand?" 
                        value={reportSecurityQuestion}
                        onChange={(e) => setReportSecurityQuestion(e.target.value)}
                        style={{ 
                          marginTop: '4px',
                          paddingRight: reportSecurityQuestion.trim().length >= 4 ? '36px' : undefined,
                          borderColor: reportSecurityQuestion.trim().length >= 4 ? '#10b981' : undefined,
                          backgroundColor: reportSecurityQuestion.trim().length >= 4 ? '#ecfdf5' : undefined
                        }}
                      />
                      {reportSecurityQuestion.trim().length >= 4 && (
                        <div style={{ position: 'absolute', right: '12px', top: 'calc(50% + 2px)', transform: 'translateY(-50%)', color: '#10b981', fontWeight: 'bold', fontSize: '18px', pointerEvents: 'none' }}>
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1" style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                      Set a secret question only the real owner would know. Claimers must answer this correctly.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Secret Verification Answer
                    </label>
                    <input
                      type="text"
                      value={reportSecurityAnswer}
                      onChange={(e) => setReportSecurityAnswer(e.target.value)}
                      placeholder="Example: blue sticker"
                      className="w-full rounded-md border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-xs text-slate-500">
                      This answer will be hidden and used for automatic ownership verification.
                    </p>
                  </div>

                  <button className="primary-btn flex items-center justify-center gap-1.5" type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading & Submitting...' : <><Send className="h-4 w-4" /> Submit Report</>}
                  </button>
                </form>
              </div>
            </section>

            {/* PANEL: SEARCH REGISTRY */}
            <section id="search" className={`panel ${activeTab === 'search' ? 'active' : ''}`}>
              <div className="section-title"><Search className="h-5 w-5 inline mr-1 text-sky-500" /> Search Database</div>
              
              <div className="search-container">
                <div className="search-bar">
                  <div className="search-input-wrapper">
                    <span className="search-icon"><Search className="h-5 w-5" /></span>
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
                    placeholder="Filter by location"
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
                          <div className="match-chip-meta"><MapPin className="h-3 w-3 inline text-slate-400 mr-1" /> {report.location || "Unknown"}</div>
                          <div className="match-score"><CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" /> {pct}% match</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEARCH REGISTRY CARDS GRID */}
              <div id="searchResults" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSearchList.map(r => {
                  const pinned = pinnedIds.includes(r.id);
                  return (
                    <article key={r.id} onClick={() => { setSelectedItemId(r.id); setActiveTab('itemDetail'); }} className="rounded-xl bg-white border border-slate-100 p-4 hover:shadow-md transition cursor-pointer flex flex-col">
                      <div className="flex gap-3">
                        <div className="w-28 h-20 rounded-md bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {r.image || r.imageUrl ? (
                            <img src={r.image || r.imageUrl} alt={r.title} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-slate-300"><Camera className="h-8 w-8" /></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm text-slate-900">{r.title}</h4>
                            <div className={`text-xs font-mono px-2 py-0.5 rounded-full ${r.claimed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{r.claimed ? 'CLAIMED' : r.type.toUpperCase()}</div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{r.desc || r.description || "No description provided."}</p>
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                            <div>
                              <div>{r.location || 'Unknown location'}</div>
                              <div>{r.date ? new Date(r.date).toLocaleDateString() : 'Just now'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); togglePin(r.id); }} className="bg-surface-container-lowest/80 backdrop-blur p-2 rounded-full text-primary hover:text-error transition-colors shadow-sm" title={pinned ? 'Unpin' : 'Pin'}>
                                {pinned ? <MapPin className="h-4 w-4" fill="currentColor" /> : <MapPin className="h-4 w-4 text-slate-400" />}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleStartChat(r.userId || '', r.id); }} className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-medium">Message</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredSearchList.length === 0 && (
                <div id="noResults" className="empty flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-4 border border-sky-100 shadow-sm mt-4">
                     <Search className="h-8 w-8 text-sky-400" />
                  </div>
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
                    date: r.date || new Date().toISOString(),
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
                    date: x.date || new Date().toISOString(),
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
                      <span className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5 flex-wrap"><Key className="h-4 w-4 inline mr-1 text-sky-500" /> Incoming Ownership Claims ({incomingClaims.filter(c => c.status === 'pending').length} pending)</span>
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
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Active Chats Inbox</span>
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
                  <div className="section-title"><Bell className="h-5 w-5 inline mr-1 text-sky-500" /> Platform Alerts</div>
                  <div id="alertsList" className="space-y-3">
                    <div className="alert-item m-0">
                      <strong><Info className="h-4 w-4 inline mr-1 text-sky-500" /> Welcome to FindTrack!</strong>
                      <p>You'll receive secure notifications and match recommendations here.</p>
                    </div>
                    <div className="alert-item m-0">
                      <strong><CheckCircle2 className="h-4 w-4 inline mr-1 text-sky-500" /> Pro Tip</strong>
                      <p>Tap "Message Finder" on other users' listings to contact them safely.</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* PANEL: PROFILE */}
            <section id="profile" className={`panel ${activeTab === 'profile' ? 'active' : ''}`}>
              <div className="section-title"><UserIcon className="h-5 w-5 inline mr-1 text-sky-500" /> My Profile</div>
              <div className="profile-container">
                <div className="profile-photo">
                  <img id="pf_avatar" src={profileAvatar} alt="Profile" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <button onClick={handleRandomAvatar} className="secondary-btn flex items-center gap-1.5" style={{ width: '100%', justifyContent: 'center' }}>
                      <Dices className="h-4 w-4 text-slate-500" /> Random Avatar
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
                    <button onClick={handleSaveProfile} className="primary-btn flex items-center gap-1.5"><Save className="h-4 w-4" /> Save Profile</button>
                    <button 
                      onClick={handleLogoutAction} 
                      className="flex items-center gap-1"
                      style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* PANEL: MY ITEMS */}
            <section id="myitems" className={`panel ${activeTab === 'myitems' ? 'active' : ''}`}>
              <div className="section-title">📂 My Items</div>
              <p className="section-subtitle">All items you've reported — tab to view details</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.filter(item => item.userId === auth.currentUser?.uid).map(r => {
                  const pinned = pinnedIds.includes(r.id);
                  const statusLabel = r.claimed ? 'Match Found' : (r.type === 'found' ? 'Found' : 'Searching');
                  const timeLabel = r.date ? new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now';
                  return (
                    <article key={r.id} className="bg-surface-container-lowest rounded-[16px] p-6 ambient-shadow ambient-shadow-hover flex flex-col h-full border border-surface-variant">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full font-label-md text-[10px] uppercase tracking-wider flex items-center space-x-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>{statusLabel}</span>
                          </span>
                          <span className="text-on-surface-variant font-label-md text-label-md">{r.type.charAt(0).toUpperCase() + r.type.slice(1)} • {timeLabel}</span>
                        </div>
                        <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); /* future: item menu */ }}>
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>

                      <div className="flex space-x-4 mb-4 flex-1">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                          {r.image || r.imageUrl ? (
                            <img className="w-full h-full object-cover" src={r.image || r.imageUrl} alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ opacity: 0.35 }} className="w-full h-full flex items-center justify-center"><Camera className="h-12 w-12" /></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-headline-md text-headline-md text-on-surface mb-1 leading-tight">{r.title}</h3>
                          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{r.desc || r.description || ''}</p>
                          <div className="flex items-center space-x-1 mt-2 text-primary">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            <span className="font-label-md text-[11px]">{r.location || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-outline-variant flex space-x-3 mt-auto">
                        <button onClick={(e) => { e.stopPropagation(); handleStartChat(r.userId || '', r.id); }} className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-label-md text-label-md hover:bg-primary-dim transition-colors flex items-center justify-center space-x-2">
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          <span>Message</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); /* edit flow */ }} className="px-4 py-2 rounded-lg border border-primary text-primary font-label-md text-label-md hover:bg-surface-container transition-colors">Edit</button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {items.filter(item => item.userId === auth.currentUser?.uid).length === 0 && (
                <div className="empty">You haven't reported any items yet.</div>
              )}
            </section>

            {/* PANEL: PINNED ITEMS */}
            <section id="pinned" className={`panel ${activeTab === 'pinned' ? 'active' : ''}`}>
              <div className="section-title"><MapPin className="h-5 w-5 inline mr-1 text-sky-500" /> Pinned Items</div>
              <p className="section-subtitle">Quick access to items you've bookmarked</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.filter(item => pinnedIds.includes(item.id)).map(r => {
                  const pinned = pinnedIds.includes(r.id);
                  const timeLabel = r.date ? new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now';
                  return (
                    <article key={r.id} className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-4px_rgba(1,114,90,0.08)] border border-outline-variant/30 overflow-hidden flex flex-col group relative transition-transform hover:-translate-y-1 duration-300">
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button className="bg-surface-container-lowest/80 backdrop-blur p-2 rounded-full text-primary hover:text-error transition-colors shadow-sm" title="Unpin Item" onClick={(e) => { e.stopPropagation(); togglePin(r.id); }}>
                          <span className="material-symbols-outlined fill">push_pin</span>
                        </button>
                      </div>
                      <div className="h-48 relative w-full overflow-hidden">
                        {r.image || r.imageUrl ? <img className="w-full h-full object-cover" src={r.image || r.imageUrl} alt="" /> : <div className="w-full h-full flex items-center justify-center bg-surface-variant"><Camera className="h-12 w-12 text-outline-variant" /></div>}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">{r.title}</h3>
                        <div className="flex items-center gap-1 text-on-surface-variant text-sm mb-3">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{r.location || 'Unknown'}</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 mb-4">{r.desc || r.description || ''}</p>
                        <div className="mt-auto flex justify-between items-center">
                          <span className="font-label-md text-label-md text-outline">Pinned</span>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedItemId(r.id); setActiveTab('itemDetail'); }} className="text-primary font-label-md text-label-md hover:underline">View Details</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {items.filter(item => pinnedIds.includes(item.id)).length === 0 && (
                <div className="empty">No pinned items yet. Pin items from search!</div>
              )}
            </section>

            {/* PANEL: CATEGORIES BROWSER */}
            <section id="categories" className={`panel ${activeTab === 'categories' ? 'active' : ''}`}>
              <div className="section-title"><Tag className="h-5 w-5 inline mr-1" /> Browse by Category</div>
              <p className="section-subtitle">Tap a category to filter lost items</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[200px]">
                <div onClick={() => { setCategoryKeywords(["phone","laptop","tablet","charger","headphone","earphone","computer","iphone","samsung","ipad","macbook"]); setActiveTab('search'); }} className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-2 rounded-xl bg-surface-container-lowest ambient-shadow p-6 flex flex-col justify-between group overflow-hidden relative border border-outline-variant/30 transition-all duration-300 cursor-pointer">
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="bg-primary-container p-3 rounded-lg inline-flex"><Smartphone className="text-on-primary-container text-3xl" /></div>
                    <span className="bg-surface-variant text-on-surface-variant font-label-md text-label-md px-3 py-1 rounded-full">{countForKeywords(["phone","laptop","tablet","charger","headphone","earphone","computer","iphone","samsung","ipad","macbook"]) || '0'} Active</span>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h3 className="font-headline-md text-headline-md font-bold text-primary mb-2">Electronics</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Phones, laptops, tablets, and other digital devices reported lost or found recently.</p>
                  </div>
                </div>

                <div onClick={() => { setCategoryKeywords(["vehicle","car","bike","scooter","bicycle","motorbike"]); setActiveTab('search'); }} className="rounded-xl bg-surface-container-lowest ambient-shadow p-4 flex flex-col justify-between group relative overflow-hidden border border-outline-variant/30 transition-all duration-300 cursor-pointer">
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="bg-tertiary-container p-2 rounded-lg inline-flex"><Info className="text-on-tertiary-container text-2xl" /></div>
                    <span className="bg-surface-variant text-on-surface-variant font-label-md text-[10px] px-2 py-1 rounded-full">{countForKeywords(["vehicle","car","bike","scooter","bicycle","motorbike"]) || '0'} Active</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-1">Vehicles &amp; Transport</h3>
                    <p className="font-body-md text-sm text-on-surface-variant line-clamp-2">Bicycles, scooters, cars, and related accessories.</p>
                  </div>
                </div>

                <div onClick={() => { setCategoryKeywords(["pets","dog","cat","animal","puppy","kitten"]); setActiveTab('search'); }} className="rounded-xl bg-surface-container-lowest ambient-shadow p-4 flex flex-col justify-between group relative overflow-hidden border border-outline-variant/30 transition-all duration-300 cursor-pointer">
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="bg-[#ffdcdc] p-2 rounded-lg inline-flex"><Tag className="text-error text-2xl filled-icon" /></div>
                    <span className="bg-surface-variant text-on-surface-variant font-label-md text-[10px] px-2 py-1 rounded-full">{countForKeywords(["pets","dog","cat","animal","puppy","kitten"]) || '0'} Active</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-1">Pets &amp; Animals</h3>
                    <p className="font-body-md text-sm text-on-surface-variant line-clamp-2">Lost dogs, cats, and other companion animals.</p>
                  </div>
                </div>

                <div onClick={() => { setCategoryKeywords(["wallet","id","passport","document","card","license"]); setActiveTab('search'); }} className="col-span-1 sm:col-span-1 row-span-2 rounded-xl bg-surface-container-lowest ambient-shadow p-4 flex flex-col justify-between group relative overflow-hidden border border-outline-variant/30 transition-all duration-300 cursor-pointer">
                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="bg-secondary-container p-3 rounded-lg inline-flex"><Info className="text-on-secondary-container text-3xl" /></div>
                    <span className="bg-surface-variant text-on-surface-variant font-label-md text-[10px] px-2 py-1 rounded-full">{countForKeywords(["wallet","id","passport","document","card","license"]) || '0'} Active</span>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h3 className="font-body-lg text-body-lg font-bold text-secondary mb-2">Documents &amp; IDs</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mb-4">Passports, driver's licenses, wallets, and important paperwork.</p>
                    <div className="flex items-center text-primary font-label-md text-xs">Explore <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span></div>
                  </div>
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
              <div className="section-title"><Navigation className="h-5 w-5 inline mr-1 text-sky-500" /> Lost Item Recovery Guide</div>
              <p className="section-subtitle">Helpful tips to increase your chances of finding lost items</p>
              <div className="tips-grid">
                <div className="tip-card"><Search className="h-5 w-5 text-sky-500 inline mr-1" /> <strong>Retrace Recent Locations</strong><br /><br />Carefully revisit the places you recently visited to help locate missing items.</div>
                <div className="tip-card"><MapPin className="h-5 w-5 text-red-500 inline mr-1" /> <strong>Check Nearby Areas</strong><br /><br />Inspect public spaces, offices, transportation stops, shops, and common areas.</div>
                <div className="tip-card"><Smartphone className="h-5 w-5 text-indigo-500 inline mr-1" /> <strong>Use Digital Tools</strong><br /><br />Post on forums, use FindTrack, check social media groups.</div>
                <div className="tip-card"><CheckCircle2 className="h-5 w-5 text-green-500 inline mr-1" /> <strong>Act Quickly</strong><br /><br />Report and search within 2 hours for best results.</div>
                <div className="tip-card"><Camera className="h-5 w-5 text-amber-500 inline mr-1" /> <strong>Add Photos</strong><br /><br />Upload a photo of your item for much faster identification.</div>
                <div className="tip-card"><Bell className="h-5 w-5 text-pink-500 inline mr-1" /> <strong>Stay Updated</strong><br /><br />Receive updates and notifications about matched or recovered items.</div>
                <div className="tip-card"><PenTool className="h-5 w-5 text-slate-500 inline mr-1" /> <strong>Submit Detailed Reports</strong><br /><br />Provide accurate descriptions and item details for easier identification.</div>
              </div>
            </section>

            <section id="packaging" className={`panel ${activeTab === 'packaging' ? 'active' : ''}`}>
              <div className="section-title"><Package className="h-5 w-5 inline mr-1 text-sky-500" /> Packaging &amp; Handling Tips</div>
              <p className="section-subtitle">Best practices for securing found items</p>
              <div className="tips-grid">
                <div className="tip-card"><ShieldCheck className="h-5 w-5 text-teal-500 inline mr-1" /> <strong>Protect Fragile Items</strong><br /><br />Use bubble wrap or padding for delicate objects.</div>
                <div className="tip-card"><Package className="h-5 w-5 text-blue-500 inline mr-1" /> <strong>Seal Securely</strong><br /><br />Ensure items are properly contained before storage.</div>
                <div className="tip-card"><Home className="h-5 w-5 text-indigo-500 inline mr-1" /> <strong>Classify Correctly</strong><br /><br />Hand keys and sensitive IDs straight to the Library security safe desk.</div>
                <div className="tip-card"><CheckCircle2 className="h-5 w-5 text-green-500 inline mr-1" /> <strong>Update Status</strong><br /><br />Mark items as claimed once they've been recovered.</div>
              </div>
            </section>

            <section id="about" className={`panel ${activeTab === 'about' ? 'active' : ''}`}>
              <div className="section-title"><CheckCircle2 className="h-5 w-5 inline mr-1 text-sky-500" /> About FindTrack</div>
              <div className="report-form-wrap" style={{ maxWidth: '600px' }}>
                <p style={{ marginBottom: '16px', lineHeight: 1.7 }}>
                  <strong>FindTrack</strong> helps simplify lost and found reporting with fast search tools, organized listings, and a modern recovery system.
                </p>
                <div className="section-title" style={{ fontSize: '16px', marginTop: '8px' }}><Info className="h-4 w-4 inline mr-1 text-sky-500" /> How to Use</div>
                <div className="tips-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="tip-card"><Package className="h-4 w-4 text-sky-500 inline mr-2" /> <strong>Report</strong> — Submit details about lost or found items with photos and location</div>
                  <div className="tip-card"><Search className="h-4 w-4 text-sky-500 inline mr-2" /> <strong>Search</strong> — Browse all reported items with advanced filters and category browsing</div>
                  <div className="tip-card"><CheckCircle2 className="h-4 w-4 text-sky-500 inline mr-2" /> <strong>Claim</strong> — Mark items as found once recovered, or delete your own reports</div>
                  <div className="tip-card"><MapPin className="h-4 w-4 text-sky-500 inline mr-2" /> <strong>Pin</strong> — Bookmark items you want quick access to</div>
                </div>
                <div className="tip-banner" style={{ marginTop: '16px' }}><Lightbulb className="h-4 w-4 inline mr-1 text-amber-500" /> Pro Tip: The more detail you add to reports, the faster items get matched!</div>
              </div>
            </section>

          </main>

          {/* MOBILE HUD BOTTOM NAV */}
          <nav className="bottom-nav" id="bottomNav">
            <button onClick={() => { setActiveTab('home'); setCategoryKeywords(null); }} className={`bnav-btn ${activeTab === 'home' ? 'active' : ''}`}>
              <span className="bnav-icon"><Home className="h-5 w-5" /></span>Home
            </button>
            <button onClick={() => { setActiveTab('search'); setCategoryKeywords(null); }} className={`bnav-btn ${activeTab === 'search' ? 'active' : ''}`}>
              <span className="bnav-icon"><Search className="h-5 w-5" /></span>Search
            </button>
            <button onClick={() => { if (profileName === 'Guest') { setShowGuestModal(true); } else { setActiveTab('notifications'); } }} className={`bnav-btn ${activeTab === 'notifications' ? 'active' : ''}`}>
              <span className="bnav-icon"><Bell className="h-5 w-5" /></span>Alerts
            </button>
            <button onClick={() => { setActiveTab('profile'); }} className={`bnav-btn ${activeTab === 'profile' ? 'active' : ''}`}>
              <span className="bnav-icon"><UserIcon className="h-5 w-5" /></span>Profile
            </button>
          </nav>

          {/* MOBILE REPORT INSTANT FAB */}
          <button 
            onClick={() => { if (profileName === 'Guest') { setShowGuestModal(true); } else { setActiveTab('report'); } }} 
            className="report-fab" 
            title="Report Item"
          >
            <Package className="h-6 w-6 text-white" />
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
              <button onClick={() => { setShowGuestModal(false); setCurrentView('login'); }} className="modal-btn primary"><Lock className="h-4 w-4 inline mr-1" /> Login</button>
              <button onClick={() => { setShowGuestModal(false); setCurrentView('signup'); }} className="modal-btn secondary"><UserPlus className="h-4 w-4 inline mr-1" /> Sign Up</button>
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
