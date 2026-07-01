import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
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
} from "firebase/firestore";
import {
  auth,
  db,
  handleFirestoreError,
  logOut,
  OperationType,
} from "./firebase";
import ChatInterface, { ChatInboxList } from "./components/ChatInterface";
import ItemDetail from "./components/ItemDetail";
import { Item, Claim } from "./types";
import {
  ShieldCheck,
  Search,
  Lock,
  UserPlus,
  ArrowRight,
  Tag,
  Lightbulb,
  Key,
  Smartphone,
  Home,
  Package,
  Bell,
  User as UserIcon,
  MapPin,
  CheckCircle2,
  Info,
  Navigation,
  Hand,
  Inbox,
  PenTool,
  Camera,
  MessageCircle,
  Mail,
  Eye,
  EyeOff,
  Dices,
  Save,
  LogOut,
  Send,
  Zap,
  CheckSquare,
  X,
  ShoppingBag,
  MapIcon,
  Users,
  FileSearch,
  MessageSquareHeart,
  PackageCheck,
  PlusCircle,
  Quote,
  Handshake,
  Filter,
  Clock,
  Menu,
} from "lucide-react"
import { uploadToCloudinary } from "./lib/cloudinary";

interface ItemReport {
  id: string;
  userId: string;
  title: string;
  location: string;
  desc?: string;
  description?: string;
  type: "lost" | "found";
  image?: string;
  imageUrl?: string;
  createdAt: any;
  claimed: boolean;
}

const ONBOARD_STEPS = [
  {
    icon: <Search className="text-white h-12 w-12" />,
    label: "Step 1 of 4",
    title: "Welcome to FindTrack!",
    desc: "Your lost & found platform. Report missing items, search for found ones, and get reunited with your belongings — fast.",
  },
  {
    icon: <Package className="text-white h-12 w-12" />,
    label: "Step 2 of 4",
    title: "Report Lost or Found Items",
    desc: "Tap the Report tab to submit an item. Add a photo, title, and location for the best chance of recovery. The more detail, the better!",
  },
  {
    icon: <CheckCircle2 className="text-white h-12 w-12" />,
    label: "Step 3 of 4",
    title: "Smart Match Suggestions",
    desc: "Our smart system automatically compares your reports against others and highlights possible matches — so you can claim your item faster.",
  },
  {
    icon: <MapPin className="text-white h-12 w-12" />,
    label: "Step 4 of 4",
    title: "Pin & Track Items",
    desc: "Bookmark items you're watching with the pin button. Check Pinned Items in the menu for quick access anytime. You're all set — good luck!",
  },
];

export default function App() {
  // Navigation layout state: 'landing' | 'login' | 'signup' | 'dashboard' | 'verify-email' | 'privacy' | 'terms'
  const [currentView, setCurrentView] = useState<
    | "landing"
    | "login"
    | "signup"
    | "dashboard"
    | "verify-email"
    | "privacy"
    | "terms"
  >(() => {
    const path = window.location.pathname;
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    return "landing";
  });

  // Dashboard panel selector
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Authentication & session state
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Form input validations / fields
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPass] = useState("");
  const [signupFirst, setSignupFirst] = useState("");
  const [signupLast, setSignupLast] = useState("");
  const [signupContact, setSignupContact] = useState("");

  // App alerts, loading states & real-time sync list
  const [items, setItems] = useState<ItemReport[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [toasts, setToasts] = useState<
    { id: string; msg: string; type: "success" | "error" }[]
  >([]);
  const [landingMenuOpen, setLandingMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
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
  const [reportStep, setReportStep] = useState(1);
  const [reportTitle, setReportTitle] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportType, setReportType] = useState<"lost" | "found">("lost");
  const [reportImage, setReportImage] = useState<string>("");
  const [reportImageFile, setReportImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reportSecurityQuestion, setReportSecurityQuestion] = useState("");
  const [reportSecurityAnswer, setReportSecurityAnswer] = useState("");
  const [incomingClaims, setIncomingClaims] = useState<Claim[]>([]);

  // Dashboard Search state
  const [sQuery, setSQuery] = useState("");
  const [sFilter, setSFilter] = useState("all");
  const [sLoc, setSLoc] = useState("");
  const [sDate, setSDate] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Category browse keyword lists
  const [categoryKeywords, setCategoryKeywords] = useState<string[] | null>(
    null,
  );

  // Profile data
  const [profileName, setProfileName] = useState("Student");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileContact, setProfileContact] = useState("");
  const [profileAvatar, setProfileAvatar] = useState(
    "https://api.dicebear.com/8.x/avataaars/svg?seed=default",
  );

  // Pinned item list IDs (local storage synchronization)
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // Shimmer skeleton state
  const [homeShimmer, setHomeShimmer] = useState(true);

  // Donut chart canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger custom toast notification
  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3300);
  };

  const handleBackToSafety = () => {
    if (auth.currentUser) {
      if (auth.currentUser.email && !auth.currentUser.emailVerified) {
        setCurrentView("verify-email");
        window.history.pushState(null, "", "/verify-email");
      } else {
        setCurrentView("dashboard");
        window.history.pushState(null, "", "/");
      }
    } else {
      try {
        const guestSession = localStorage.getItem("sessionUser");
        if (guestSession) {
          const session = JSON.parse(guestSession);
          if (session && session.email === "") {
            setCurrentView("dashboard");
            window.history.pushState(null, "", "/");
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setCurrentView("landing");
      window.history.pushState(null, "", "/");
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
            if (parsed.name && parsed.name !== "Guest") {
              setProfileName(parsed.name);
            } else {
              setProfileName(
                currentUser.displayName ||
                  currentUser.email?.split("@")[0] ||
                  "User",
              );
            }
            if (parsed.contact) setProfileContact(parsed.contact);
            if (parsed.avatar && !parsed.avatar.includes("guest")) {
              setProfileAvatar(parsed.avatar);
            }
          } else {
            setProfileName(
              currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "User",
            );
          }
        } catch (e) {
          console.error(e);
        }

        // Block unverified email users from accessing protected views (dashboard)
        const path = window.location.pathname;
        if (["/privacy", "/terms", "/about", "/safety", "/help", "/contact"].includes(path)) {
          setCurrentView(path.slice(1) as any);
        } else if (currentUser.email && !currentUser.emailVerified) {
          setCurrentView("verify-email");
        } else {
          // Force token refresh on load to prevent stale email_verified claims from breaking rules
          if (currentUser.emailVerified) {
            currentUser.getIdToken(true).catch(console.error);
          }
          // Switch view to dashboard on successful load
          setCurrentView("dashboard");
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
              if (["/privacy", "/terms", "/about", "/safety", "/help", "/contact"].includes(path)) {
                setCurrentView(path.slice(1) as any);
              } else {
                setCurrentView("dashboard");
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
      if (path === "/privacy") {
        setCurrentView("privacy");
      } else if (path === "/terms") {
        setCurrentView("terms");
      } else if (path === "/login") {
        setCurrentView("login");
      } else if (path === "/signup") {
        setCurrentView("signup");
      } else if (path === "/" || path === "") {
        if (auth.currentUser) {
          if (auth.currentUser.email && !auth.currentUser.emailVerified) {
            setCurrentView("verify-email");
          } else {
            setCurrentView("dashboard");
          }
        } else {
          setCurrentView("landing");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user]);

  // 2. Real-time Firestore Sync of items / reports
  useEffect(() => {
    const reportsCollection = collection(db, "items"); // Rules define items matching

    // Listen to all public lost/found entries across the board to permit comprehensive lost and found search engine matching
    const unsubscribe = onSnapshot(
      query(reportsCollection),
      (snapshot) => {
        const list: ItemReport[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ItemReport);
        });
        // Sort in-memory descending creation date
        list.sort((a, b) => {
          const aTime = a.createdAt?.seconds
            ? a.createdAt.seconds * 1000
            : new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt?.seconds
            ? b.createdAt.seconds * 1000
            : new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
        setItems(list);
        setHomeShimmer(false);
      },
      (error) => {
        console.error("Firestore sync error:", error);
      },
    );

    return unsubscribe;
  }, []);

  // 2.2. Real-time Claims Sync for Finder Review Panel
  useEffect(() => {
    if (!user?.uid) {
      setIncomingClaims([]);
      return;
    }
    const claimsCollection = collection(db, "claims");
    const q = query(claimsCollection, where("finderId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Claim[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Claim);
        });
        // Place pending claims at the top, then sort by newest first
        list.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          const aTime = a.createdAt?.seconds
            ? a.createdAt.seconds * 1000
            : new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt?.seconds
            ? b.createdAt.seconds * 1000
            : new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
        setIncomingClaims(list);
      },
      (error) => {
        console.error("Claims snapshot read failed:", error);
      },
    );

    return unsubscribe;
  }, [user]);

  // Safeguard: Block unverified users from accessing protected views (dashboard) and redirect them to verify screen
  useEffect(() => {
    if (
      auth.currentUser &&
      auth.currentUser.email &&
      !auth.currentUser.emailVerified &&
      currentView === "dashboard"
    ) {
      setCurrentView("verify-email");
    }
  }, [currentView, user]);

  // 3. Initiate Onboarding trigger
  useEffect(() => {
    if (currentView === "dashboard") {
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
      const credentials = await signInWithEmailAndPassword(
        auth,
        authEmail.trim(),
        authPassword,
      );
      localStorage.setItem(
        "sessionUser",
        JSON.stringify({
          id: credentials.user.uid,
          email: credentials.user.email,
        }),
      );
      triggerToast("✅ Login successful! Redirecting...", "success");
      setAuthEmail("");
      setAuthPass("");
      if (credentials.user.email && !credentials.user.emailVerified) {
        setCurrentView("verify-email");
      } else {
        setCurrentView("dashboard");
      }
    } catch (err: any) {
      console.error("SignIn error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        triggerToast(
          "❌ Invalid email or password. Please try again.",
          "error",
        );
      } else {
        triggerToast(
          "❌ Login failed: " +
            (err.message || err.code || "Please try again."),
          "error",
        );
      }
    } finally {
      setLoadingAuth(false);
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
      const credentials = await createUserWithEmailAndPassword(
        auth,
        authEmail.trim().toLowerCase(),
        authPassword,
      );
      const fullName = `${signupFirst.trim()} ${signupLast.trim()}`;

      localStorage.setItem(
        "sessionUser",
        JSON.stringify({
          id: credentials.user.uid,
          name: fullName,
          email: authEmail.trim().toLowerCase(),
        }),
      );

      const prof = {
        name: fullName,
        email: authEmail.trim().toLowerCase(),
        contact: signupContact.trim(),
        avatar: profileAvatar,
      };
      localStorage.setItem("userProfile", JSON.stringify(prof));

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
        triggerToast(
          "✅ Account created! Please check your email to verify.",
          "success",
        );
      } catch (err: any) {
        console.error("Verification email sending failed:", err);
        triggerToast(
          "❌ Account created, but email verification failed to send. Try resending.",
          "error",
        );
      }

      setSignupFirst("");
      setSignupLast("");
      setSignupContact("");
      setAuthEmail("");
      setAuthPass("");
      setCurrentView("verify-email");
    } catch (err: any) {
      console.error("SignUp error:", err);
      if (err.code === "auth/email-already-in-use") {
        triggerToast("❌ Email already registered.", "error");
      } else {
        triggerToast(
          "❌ Signup failed: " + (err.message || err.code || "Try again."),
          "error",
        );
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Logout
  const handleLogoutAction = async () => {
    localStorage.removeItem("sessionUser");
    // Keeping userProfile locally since we do not currently sync names/avatars to a users collection.
    try {
      await logOut();
    } catch (er) {}
    setProfileName("Student");
    setProfileEmail("");
    setProfileContact("");
    triggerToast("🚪 Logged out securely.", "success");
    setCurrentView("landing");
    setActiveTab("home");
  };

  // Browse as guest fallback trigger
  const handleGuestBrowse = () => {
    localStorage.removeItem("sessionUser");
    const guestUser = {
      name: "Guest",
      email: "",
      contact: "",
      avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=guest",
    };
    localStorage.setItem("userProfile", JSON.stringify(guestUser));
    localStorage.setItem(
      "sessionUser",
      JSON.stringify({ id: "guest_" + Date.now(), email: "" }),
    );
    setProfileName("Guest");
    setProfileEmail("");
    setProfileContact("");
    setProfileAvatar(guestUser.avatar);
    setCurrentView("dashboard");
    setActiveTab("home");
  };

  // Save profile modifications
  const handleSaveProfile = () => {
    if (profileName === "Guest") {
      setShowGuestModal(true);
      return;
    }

    const updated = {
      name: profileName,
      email: profileEmail,
      contact: profileContact,
      avatar: profileAvatar,
    };
    localStorage.setItem("userProfile", JSON.stringify(updated));
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
    if (profileName === "Guest") {
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
    if (profileName === "Guest") {
      setShowGuestModal(true);
      return;
    }

    if (!reportTitle.trim()) {
      triggerToast("❌ Item title is required.", "error");
      return;
    }

    setIsUploading(true);
    let finalImageUrl = reportImage || "";

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

    const payloadId =
      "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Firestore Object Schema aligned with security rules constraints
    const reportData = {
      id: payloadId,
      userId: auth.currentUser?.uid || "anonymous_uid",
      title: reportTitle.trim(),
      description: reportDesc.trim() || "No description provided.",
      type: reportType,
      category: "others", // Supported standard selection
      location: reportLocation.trim() || "Unknown Location",
      status: "active",
      contactName: profileName || "Student",
      contactInfo: `${profileContact || "No contact provided"} | Email: ${reportEmail.trim() || profileEmail || "No email provided"}`,
      date: new Date().toISOString(),
      imageUrl: finalImageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      claimed: false,
      securityQuestion: reportSecurityQuestion.trim(),
      securityAnswer: reportSecurityAnswer.trim().toLowerCase(),
    };

    try {
      await setDoc(doc(db, "items", payloadId), reportData);
      triggerToast("✅ Report submitted successfully!", "success");

      // Reset form variables
      setReportTitle("");
      setReportLocation("");
      setReportDesc("");
      setReportEmail("");
      setReportType("lost");
      setReportImage("");
      setReportImageFile(null);
      setReportSecurityQuestion("");
      setReportSecurityAnswer("");

      // Auto redirect to home feed out of form
      setActiveTab("home");
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
    if (profileName === "Guest") {
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
    if (profileName === "Guest") {
      setShowGuestModal(true);
      return;
    }
    if (
      !confirm("Are you sure you want to mark this item as claimed/recovered?")
    )
      return;

    try {
      await updateDoc(doc(db, "items", itemId), {
        claimed: true,
        status: "resolved",
        updatedAt: serverTimestamp(),
      });
      triggerToast("✅ Item marked as claimed!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Action access is denied.", "error");
    }
  };

  // Delete Listing report
  const deleteItem = async (itemId: string) => {
    if (profileName === "Guest") {
      setShowGuestModal(true);
      return;
    }
    if (
      !confirm("Delete this report entry permanently? This cannot be undone.")
    )
      return;

    try {
      await deleteDoc(doc(db, "items", itemId));
      setPinnedIds((prev) => prev.filter((id) => id !== itemId));
      triggerToast("🗑️ Item deleted", "error");
      setActiveTab("search");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Deletion rejected.", "error");
    }
  };

  // Helper actions to approve / reject claims
  const handleApproveClaim = async (claimId: string, itemId: string) => {
    try {
      await updateDoc(doc(db, "claims", claimId), {
        status: "approved",
        updatedAt: serverTimestamp(),
      });
      triggerToast(
        "✅ Ownership claim approved! Access credentials unlocked.",
        "success",
      );
    } catch (err) {
      console.error("Error approving claim:", err);
      triggerToast("❌ Action failed or unauthorized.", "error");
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      await updateDoc(doc(db, "claims", claimId), {
        status: "rejected",
        updatedAt: serverTimestamp(),
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
      if (profileName === "Guest") {
        setShowGuestModal(true);
      } else {
        setCurrentView("login");
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
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        const itemRef = doc(db, "items", itemId);
        const itemSnap = await getDoc(itemRef);
        const itemTitle = itemSnap.exists()
          ? itemSnap.data().title
          : "Lost/Found Item";

        await setDoc(chatRef, {
          chatId,
          participants: [user.uid, otherUserUid],
          itemId,
          itemTitle,
          lastMessage: `Convo initiated about "${itemTitle}"`,
          timestamp: serverTimestamp(),
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
      lost: items.filter((i) => i.type === "lost" && !i.claimed).length,
      found: items.filter((i) => i.type === "found" && !i.claimed).length,
      claimed: items.filter((i) => i.claimed).length,
    };
  }, [items]);

  // In memory dynamic listing filter
  const filteredSearchList = useMemo(() => {
    return items.filter((r) => {
      const keywords =
        `${r.title} ${r.desc || r.description || ""} ${r.location}`.toLowerCase();

      // Keyword matching
      if (sQuery.trim() && !keywords.includes(sQuery.toLowerCase())) {
        return false;
      }

      // Category keywords browsing bounds
      if (categoryKeywords) {
        const hasKeywordMatch = categoryKeywords.some((kw) =>
          keywords.includes(kw.toLowerCase()),
        );
        if (!hasKeywordMatch) return false;
      }

      // Status dropdown
      if (sFilter === "lost") {
        if (r.type !== "lost" || r.claimed) return false;
      } else if (sFilter === "found") {
        if (r.type !== "found" || r.claimed) return false;
      } else if (sFilter === "claimed") {
        if (!r.claimed) return false;
      }

      // Advanced filters bounds
      if (
        sLoc.trim() &&
        !(r.location || "").toLowerCase().includes(sLoc.toLowerCase())
      ) {
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
      claimed: false,
    };

    return items
      .filter((r) => r.type === "found" && !r.claimed)
      .map((r) => ({ report: r, score: computeMatchScore(fake, r) }))
      .filter((x) => x.score > 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [items, sQuery]);

  // Complete clean JSX structure wrapping converted index.html tags
  return (
    <div className="relative min-h-screen bg-[#f0f4f8]">
      {/* ── TOAST MESSAGES FLOATER ── */}
      <div className="toast-container" id="toastContainer">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-msg ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── IMMERSIVE BACKGROUND GRID (Only on landing or auth views) ── */}
      {(currentView === "login" ||
        currentView === "signup" ||
        currentView === "verify-email") && (
        <div className="bg-scene">
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-grid"></div>
        </div>
      )}

      {/* ── VIEW 1: LANDING PAGE ── */}
      {currentView === "landing" && (
        <div className="bg-[#fffbff] text-[#393927] font-sans antialiased overflow-x-hidden min-h-screen flex flex-col">
          {/* TopNavBar */}
          <header className="w-full top-0 z-50 bg-[#fffbff] shadow-sm sticky">
            <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
              <div className="font-sans text-2xl font-bold text-[#01725a] tracking-tight flex items-center gap-2">
                <MapPin className="h-6 w-6 text-[#01725a]" />
                FindTrack
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <button onClick={() => setCurrentView("landing")} className="text-[#01725a] border-b-2 border-[#01725a] pb-1 font-medium text-sm hover:text-[#01725a] transition-colors duration-200">Home</button>
                <button className="text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200">How it Works</button>
                <button className="text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200">Community</button>
                <button className="text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200">Safety</button>
              </nav>
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentView("login")} className="hidden md:block text-[#666551] font-medium text-sm hover:text-[#01725a] transition-colors duration-200 scale-95 active:scale-90">Login</button>
                <button onClick={() => setCurrentView("signup")} className="bg-[#01725a] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#00654f] transition-colors scale-95 active:scale-90">Get Started</button>
                {/* Mobile Menu Button */}
                <button 
                  className="md:hidden p-2 text-[#666551] hover:text-[#01725a]"
                  onClick={() => setLandingMenuOpen(!landingMenuOpen)}
                >
                  {landingMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Nav Dropdown */}
          {landingMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-xl z-50 p-6 flex flex-col gap-4 border-b border-slate-100">
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">Home</button>
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">How it Works</button>
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">Community</button>
              <button className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2">Safety</button>
              <hr className="border-slate-100 my-2" />
              <button 
                onClick={() => {
                  setLandingMenuOpen(false);
                  setCurrentView("login");
                }}
                className="text-left font-medium text-slate-700 hover:text-[#01725a] py-2"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  setLandingMenuOpen(false);
                  setCurrentView("signup");
                }}
                className="bg-[#01725a] hover:bg-[#00654f] text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors shadow-sm mt-2"
              >
                Get Started
              </button>
            </div>
          )}

          <main className="flex-1">
            {/* Hero Section */}
            <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img className="w-full h-full object-cover object-center" alt="Hero background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDC3YRMFuO-lEwm9bKTIguR-1belAnXoHIgeigQ3q4SUYgObcsSiNUjHnpR_ZfqvyDsqJKY7pe4fPQ9fAxiXPLcUxQOJOcX6tgsnNpBIFjznIY1JDEnT0amN_j0g91NAtN4xOqL_xe6gYYA1U5PBGH18oRD2F1fn_Z1eAqQ2CYzkwKBwB-0d16PaU0F6IfiXoXHmT6Txuseum5Be0PuKe26wtdeMNMjFB0UJczwaKK0iUeWAfbVmcG-yd4WQJ83LfWGXw7GPVkDQ"/>
                <div className="absolute inset-0 bg-[#fffbff]/30 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#fffbff] via-transparent to-transparent"></div>
              </div>
              <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center mt-8 w-full">
                <div className="bg-white/85 backdrop-blur-md border border-white/30 p-8 md:p-12 rounded-xl inline-block max-w-3xl shadow-lg w-full">
                  <h1 className="font-sans text-4xl md:text-[48px] md:leading-[56px] font-bold text-[#00654f] mb-4">
                    Find what's lost.<br/>Restore community trust.
                  </h1>
                  <p className="font-sans text-lg text-[#666551] mb-8 max-w-2xl mx-auto">
                    FindTrack helps Filipinos recover lost belongings through trusted community reporting and verified recovery workflows.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setCurrentView("signup")}
                      className="w-full sm:w-auto bg-[#fab83f] text-[#553900] px-6 py-3 rounded-lg font-semibold text-sm shadow-md hover:bg-[#ebaa32] transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Start Reporting
                    </button>
                    <button 
                      onClick={handleGuestBrowse}
                      className="w-full sm:w-auto border-2 border-[#01725a] text-[#01725a] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#01725a]/5 transition-colors"
                    >
                      How it Works
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Value Propositions (Bento Grid) */}
            <section className="py-24 bg-[#ffffff]">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                  <h2 className="font-sans text-3xl md:text-4xl font-bold text-[#00654f] mb-2">Three Pillars of Recovery</h2>
                  <p className="font-sans text-base text-[#666551] max-w-xl mx-auto">A seamless workflow designed to bring your items back home.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Pillar 1 */}
                  <div className="bg-[#f7f4df] rounded-xl p-6 flex flex-col items-start border border-[#bcbaa2]/30 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#9af4d6] text-[#005d49] rounded-full flex items-center justify-center mb-4">
                      <FileSearch className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans text-xl font-bold text-[#00654f] mb-2">Report</h3>
                    <p className="font-sans text-base text-[#666551]">Quickly document lost or found items with AI-assisted details for precise matching.</p>
                  </div>
                  {/* Pillar 2 */}
                  <div className="bg-[#fdfae7] rounded-xl p-6 flex flex-col items-start border border-[#bcbaa2]/30 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#b5eedb] text-[#235b4c] rounded-full flex items-center justify-center mb-4">
                      <MessageSquareHeart className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans text-xl font-bold text-[#00654f] mb-2">Connect</h3>
                    <p className="font-sans text-base text-[#666551]">Securely message community members when a match is found, protecting your privacy.</p>
                  </div>
                  {/* Pillar 3 */}
                  <div className="bg-[#f7f4df] rounded-xl p-6 flex flex-col items-start border border-[#bcbaa2]/30 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#fab83f] text-[#553900] rounded-full flex items-center justify-center mb-4">
                      <Handshake className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans text-xl font-bold text-[#00654f] mb-2">Recover</h3>
                    <p className="font-sans text-base text-[#666551]">Follow verified hand-off protocols to ensure items return home safely and securely.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Community Section */}
            <section className="py-24 bg-[#f7f4df]">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="font-sans text-3xl md:text-4xl font-bold text-[#00654f] mb-4">By the Community,<br/>For the Community.</h2>
                    <p className="font-sans text-lg text-[#666551] mb-6">Built on the foundation of Bayanihan, FindTrack empowers everyday Filipinos to look out for one another.</p>
                    <div className="flex gap-6 mb-8">
                      <div>
                        <div className="font-sans text-3xl font-bold text-[#01725a]">{new Set(items.map(i => i.userId)).size}</div>
                        <div className="font-sans text-sm font-medium text-[#666551]">Community Members</div>
                      </div>
                      <div className="w-px bg-[#bcbaa2]/50"></div>
                      <div>
                        <div className="font-sans text-3xl font-bold text-[#fab83f]">{stats.claimed}</div>
                        <div className="font-sans text-sm font-medium text-[#666551]">Successful Recoveries</div>
                      </div>
                    </div>
                    {/* Testimonial Card (Placeholder for content team) */}
                    <div className="bg-white rounded-xl p-6 border border-[#bcbaa2]/30 shadow-sm relative opacity-70">
                      <Quote className="absolute top-4 right-4 text-[#bcbaa2]/30 w-10 h-10" />
                      <p className="font-sans text-base text-[#393927] mb-4 italic relative z-10">[Content Team: Insert real community testimonial here]</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        </div>
                        <div>
                          <div className="font-sans text-sm text-[#393927] font-bold">[User Name]</div>
                          <div className="font-sans text-[10px] font-medium text-[#666551]">Community Hero</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-lg border border-[#bcbaa2]/20">
                    <img className="w-full h-full object-cover" alt="Community" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxlGOvC8tUv_qZ8mbCzoTfeO2pcAAWluudEQ74nJYhDiM6dKFkJnXAMN2tK4YBhxIv0KPww3WsGnpb6KywmxGohTQ6i90nv7w2u0RVCecjGnzgkXMAWIJCDNduz3N6uzUJzOO2X6hUbk8TdWW4cPEa870HJ5Ah1QvAKbwvSknJT3Vri6FIhh8Mm_4iOGeknwaECR9sIKas-PM3QZqG2o9wpOSp-eQc4Fnpoc0yWIHqiDg4zXr3mFK3NE8g9xXChlUOf26yIrPeeg"/>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-[#ebe9cf] border-t border-[#bcbaa2]/30 w-full mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 px-4 md:px-8 max-w-7xl mx-auto">
              <div>
                <div className="font-sans text-2xl font-bold text-[#393927] mb-4 flex items-center gap-2"><MapPin className="h-6 w-6 text-[#01725a]"/>FindTrack</div>
                <p className="font-sans text-base text-[#666551] max-w-sm mb-4">© 2026 FindTrack Philippines. Empowering communities through trust and recovery.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <nav className="flex flex-col gap-3">
                  <a onClick={() => { setCurrentView("about"); window.history.pushState(null, "", "/about"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">About Us</a>
                  <a onClick={() => { setCurrentView("privacy"); window.history.pushState(null, "", "/privacy"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Privacy Policy</a>
                  <a onClick={() => { setCurrentView("terms"); window.history.pushState(null, "", "/terms"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Terms of Service</a>
                </nav>
                <nav className="flex flex-col gap-3">
                  <a onClick={() => { setCurrentView("safety"); window.history.pushState(null, "", "/safety"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Safety Guidelines</a>
                  <a onClick={() => { setCurrentView("help"); window.history.pushState(null, "", "/help"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Help Center</a>
                  <a onClick={() => { setCurrentView("contact"); window.history.pushState(null, "", "/contact"); }} className="font-sans text-sm font-medium text-[#666551] hover:text-[#01725a] hover:underline transition-all opacity-80 hover:opacity-100 cursor-pointer">Contact Us</a>
                </nav>
              </div>
            </div>
          </footer>
        </div>
      )}
      {/* ── VIEW 2: LOGIN PAGE ── */}
      {currentView === "login" && (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFCF8] text-slate-900 font-sans">
          {/* Left Panel */}
          <div className="hidden md:flex md:w-[45%] lg:w-1/2 bg-[#1A7B72] text-white p-8 md:p-12 flex-col relative overflow-hidden">
            <div
              className="text-xl font-bold tracking-tight mb-auto z-10 cursor-pointer flex items-center gap-2"
              onClick={() => setCurrentView("landing")}
            >
              <MapPin className="h-6 w-6 text-white" />
              FindTrack
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-8">
                {/* Illustration based on reference */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-[#14635C] opacity-50" strokeWidth={1} />
                  <div className="relative z-10 w-full max-w-[280px] h-full flex flex-col items-center justify-center gap-4">
                    {/* Top hand holding keys */}
                    <div className="flex flex-col items-center animate-[float_4s_ease-in-out_infinite]">
                      <Hand className="w-24 h-24 text-white rotate-180 -scale-x-100" strokeWidth={1} />
                      <Key className="w-10 h-10 text-[#B2D235] -mt-6" />
                    </div>
                    {/* Small house/item icon */}
                    <div className="bg-[#B2D235] p-3 rounded-xl shadow-lg -my-2 z-20">
                      <Package className="w-8 h-8 text-[#1A7B72]" />
                    </div>
                    {/* Bottom hand receiving */}
                    <div className="flex flex-col items-center mt-2">
                      <Hand className="w-24 h-24 text-white" strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto z-10 text-left w-full max-w-sm">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
                  Welcome back to<br />the community
                </h1>
                <p className="text-teal-50 text-lg">
                  Join forces to help neighbors recover what matters.
                </p>
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, white 0%, transparent 50%)' }}></div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-[55%] lg:w-1/2 p-6 sm:p-8 md:p-12 lg:p-20 flex flex-col bg-[#FDFCF8] relative min-h-screen md:min-h-0">
            {/* Top Bar for Desktop */}
            <div className="hidden md:flex justify-between items-center w-full mb-auto z-20">
              <h2 
                className="text-2xl font-bold text-[#1A7B72] cursor-pointer"
                onClick={() => setCurrentView("landing")}
              >
                FindTrack
              </h2>
              <button
                onClick={() => setCurrentView("signup")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex justify-between items-center w-full mb-12 z-20">
              <div
                className="text-xl font-bold tracking-tight cursor-pointer flex items-center gap-2 text-[#1A7B72]"
                onClick={() => setCurrentView("landing")}
              >
                <MapPin className="h-6 w-6 text-[#1A7B72]" />
                FindTrack
              </div>
              <button
                onClick={() => setCurrentView("signup")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign Up
              </button>
            </div>

            <div className="flex flex-col justify-center max-w-md w-full mx-auto relative z-10 flex-1">
              <h3 className="text-4xl md:text-5xl font-bold mb-8 text-[#14635C]">
                Login
              </h3>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Mail className="h-[22px] w-[22px] text-[#1A7B72] opacity-80 group-focus-within:opacity-100 transition-opacity" strokeWidth={1.5} />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-14 pr-6 py-[18px] bg-transparent border-2 border-[#1A7B72] rounded-[2rem] text-slate-900 placeholder:text-[#1A7B72]/60 focus:outline-none focus:ring-4 focus:ring-[#1A7B72]/10 focus:border-[#1A7B72] transition-all font-medium"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Lock className="h-[22px] w-[22px] text-[#1A7B72] opacity-80 group-focus-within:opacity-100 transition-opacity" strokeWidth={1.5} />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPass(e.target.value)}
                    required
                    className="w-full pl-14 pr-14 py-[18px] bg-transparent border-2 border-[#1A7B72] rounded-[2rem] text-slate-900 placeholder:text-[#1A7B72]/60 focus:outline-none focus:ring-4 focus:ring-[#1A7B72]/10 focus:border-[#1A7B72] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-[#1A7B72] hover:text-[#14635C] opacity-80 hover:opacity-100 transition-all"
                  >
                    {showPass ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                <div className="text-right mt-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setCurrentView("reset")}
                    className="text-sm font-medium text-[#1A7B72] hover:text-[#14635C] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B2D235] hover:bg-[#A3C12D] text-[#14635C] font-semibold py-[18px] rounded-[2rem] transition-all hover:shadow-lg hover:-translate-y-0.5 text-lg"
                >
                  Login
                </button>
              </form>

              <div className="mt-8 text-center pb-8 md:pb-0">
                <p className="text-[15px] text-slate-600">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setCurrentView("signup")}
                    className="text-[#1A7B72] font-semibold hover:underline"
                  >
                    Sign up now.
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── VIEW 3: SIGNUP PAGE ── */}
      {currentView === "signup" && (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F1E1] text-slate-900 font-sans">
          {/* Left Panel */}
          <div className="md:w-1/2 bg-[#1A7B72] text-white p-8 md:p-12 flex flex-col relative overflow-hidden">
            <div
              className="text-xl font-medium tracking-tight mb-auto z-10 cursor-pointer"
              onClick={() => setCurrentView("landing")}
            >
              FindTrack
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10 py-12">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6">
                Join the
                <br />
                FindTrack
                <br />
                Community
              </h1>
              <p className="text-teal-100 text-base md:text-lg max-w-md mb-12">
                Reconnect with what matters. Secure, verified, and
                community-driven recovery.
              </p>

              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="bg-[#15605A] p-4 rounded-full mb-3 shadow-inner">
                    <ShieldCheck
                      className="w-8 h-8 text-[#B2D235]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-sm font-medium">Security</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-[#15605A] p-4 rounded-full mb-3 shadow-inner">
                    <Users
                      className="w-8 h-8 text-[#B2D235]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-sm font-medium">Community</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-[#15605A] p-4 rounded-full mb-3 shadow-inner">
                    <Package
                      className="w-8 h-8 text-[#B2D235]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-sm font-medium">Recovery</span>
                </div>
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-1/4 -right-20 w-64 h-64 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          </div>

          {/* Right Panel */}
          <div className="md:w-1/2 p-8 md:p-12 lg:p-24 flex flex-col bg-[#F4F1E1] relative">
            <div className="text-right mb-8 md:mb-0">
              <button
                onClick={() => setCurrentView("login")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Already have an account? Log In
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
              <h2 className="text-3xl font-semibold mb-8 text-slate-900">
                Create your account
              </h2>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-[#1A7B72]" />
                    </div>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={signupFirst}
                      onChange={(e) => setSignupFirst(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-transparent rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A7B72]/30 focus:border-[#1A7B72] transition-all shadow-sm"
                    />
                  </div>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-[#1A7B72]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={signupLast}
                      onChange={(e) => setSignupLast(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-transparent rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A7B72]/30 focus:border-[#1A7B72] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#1A7B72]" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-transparent rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A7B72]/30 focus:border-[#1A7B72] transition-all shadow-sm"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smartphone className="h-5 w-5 text-[#1A7B72]" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={signupContact}
                    onChange={(e) => setSignupContact(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-transparent rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A7B72]/30 focus:border-[#1A7B72] transition-all shadow-sm"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#1A7B72]" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPass(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-transparent rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A7B72]/30 focus:border-[#1A7B72] transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {showPass ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 text-[#1A7B72] border-slate-300 rounded focus:ring-[#1A7B72]"
                  />
                  <span className="text-sm text-slate-600">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setCurrentView("terms")}
                      className="text-[#1A7B72] font-medium hover:underline"
                    >
                      Terms of Service
                    </button>{" "}
                    &amp;{" "}
                    <button
                      type="button"
                      onClick={() => setCurrentView("privacy")}
                      className="text-[#1A7B72] font-medium hover:underline"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full bg-[#B2D235] hover:bg-[#A1C124] text-slate-900 py-3.5 rounded-full font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm mt-6"
                >
                  {loadingAuth ? "Creating Account..." : "Get Started"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 5: VERIFY EMAIL SCREEN ── */}
      {currentView === "verify-email" && (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4] text-slate-900 font-sans p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 md:p-10 text-center border border-slate-100">
            <div className="w-24 h-24 mx-auto mb-6 bg-teal-50 rounded-full flex items-center justify-center">
              <Mail className="w-12 h-12 text-[#1A7B72]" strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl font-bold text-[#1A7B72] mb-4">
              Verify your email address
            </h2>
            <p className="text-slate-600 mb-2">
              We've sent a verification link to{" "}
              <strong className="text-slate-900">
                {auth.currentUser?.email ||
                  profileEmail ||
                  "your email address"}
              </strong>
              .
            </p>
            <p className="text-slate-600 mb-8">
              Please click the link to confirm your account.
            </p>

            <div className="space-y-4">
              <button
                onClick={async () => {
                  try {
                    if (auth.currentUser) {
                      await auth.currentUser.reload();
                      if (auth.currentUser.emailVerified) {
                        await auth.currentUser.getIdToken(true);
                        triggerToast(
                          "✅ Verification successful! Welcome to FindTrack.",
                          "success",
                        );
                        setCurrentView("dashboard");
                      } else {
                        triggerToast(
                          "ℹ️ Email is not verified yet. Please check your inbox.",
                          "error",
                        );
                      }
                    } else {
                      triggerToast(
                        "❌ Session lost. Please log in again.",
                        "error",
                      );
                      setCurrentView("login");
                    }
                  } catch (e: any) {
                    console.error(e);
                    triggerToast(
                      "❌ " + (e.message || "Failed to check status."),
                      "error",
                    );
                  }
                }}
                className="w-full bg-[#B2D235] hover:bg-[#A1C124] text-slate-900 py-3.5 rounded-xl font-semibold transition-colors shadow-sm"
              >
                Check Verification Status
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
                      await sendEmailVerification(
                        auth.currentUser,
                        actionCodeSettings,
                      );
                      triggerToast("✅ Verification email resent!", "success");
                      setResendCooldown(30);
                    } else {
                      triggerToast(
                        "❌ Session lost. Please log in again.",
                        "error",
                      );
                      setCurrentView("login");
                    }
                  } catch (e: any) {
                    console.error("Resend error:", e);
                    if (e.message?.includes("too-many-requests")) {
                      triggerToast(
                        "❌ Too many requests. Please wait a minute and try again.",
                        "error",
                      );
                      setResendCooldown(60);
                    } else {
                      triggerToast(
                        "❌ Failed to resend. Please try again later.",
                        "error",
                      );
                    }
                  }
                }}
                disabled={resendCooldown > 0}
                className={`w-full py-3.5 rounded-xl font-semibold transition-colors border-2 ${
                  resendCooldown > 0
                    ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                    : "border-[#1A7B72] text-[#1A7B72] hover:bg-[#1A7B72]/10"
                }`}
              >
                {resendCooldown > 0
                  ? `Resend Available in ${resendCooldown}s`
                  : "Resend Email"}
              </button>

              <button
                onClick={async () => {
                  await logOut();
                  setCurrentView("landing");
                }}
                className="w-full py-3 text-sm font-medium text-[#1A7B72] hover:text-[#15605A] underline transition-colors mt-2"
              >
                Change Email Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 6: PRIVACY POLICY PAGE ── */}
      {currentView === "privacy" && (
        <div
          style={{
            minHeight: "100vh",
            background:
              "radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)",
            color: "#f8fafc",
            padding: "40px 16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              width: "100%",
              background: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "36px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
            className="mx-auto"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                paddingBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span style={{ fontSize: "32px" }}>🔒</span>
                <div>
                  <h1
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      lineHeight: 1.2,
                    }}
                  >
                    Privacy Policy
                  </h1>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                      marginTop: "4px",
                    }}
                  >
                    FindTrack Lost &amp; Found Platform
                  </p>
                </div>
              </div>
              <button
                onClick={handleBackToSafety}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
                className="hover:bg-white/20 transition-all"
              >
                ← Go Back
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  1. Introduction
                </h3>
                <p>
                  Welcome to FindTrack. We are dedicated to protecting your
                  personal information and your right to privacy. This Privacy
                  Policy describes how we collect, use, and process your
                  information when you use our lost and found platform.
                </p>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  2. Information We Collect
                </h3>
                <p>
                  To provide our services, facilitate claiming, and enable safe
                  communications, we collect the following personal details:
                </p>
                <ul
                  style={{
                    listStyleType: "disc",
                    paddingLeft: "20px",
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <li>
                    <strong>Account Credentials:</strong> Full name, verified
                    email address, and profile pictures when you register.
                  </li>
                  <li>
                    <strong>Contact Information:</strong> Phone numbers or
                    social handle contact info you voluntarily provide so
                    claimants/finders can get in touch with you.
                  </li>
                  <li>
                    <strong>Item Reports Data:</strong> Item characteristics,
                    dates, text descriptions, images of lost or found
                    belongings, and exact or approximate locations where items
                    were misplaced or recovered.
                  </li>
                </ul>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  3. How We Use Your Information
                </h3>
                <p>
                  We process your personal information for purposes based on
                  legitimate interests, the fulfillment of our services, and
                  user convenience:
                </p>
                <ul
                  style={{
                    listStyleType: "disc",
                    paddingLeft: "20px",
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <li>
                    To facilitate user account creation, profile management, and
                    authentication check-ins.
                  </li>
                  <li>
                    To list lost/found items and coordinate ownership claims
                    between users.
                  </li>
                  <li>
                    To send real-time alerts or email matchmaker suggestions and
                    notifications about matching items.
                  </li>
                  <li>
                    To provide direct communication channels specifically for
                    coordinating item returns.
                  </li>
                </ul>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  4. Data Security &amp; Storage
                </h3>
                <p>
                  Your account, contact profile information, and reported item
                  details are safely stored using secure Cloud
                  Firebase/Firestore infrastructure. Only authorized users can
                  update their profiles or manage active items. We implement
                  security protocols to protect your personal information
                  against unauthorized retrieval, alteration, or disclosure.
                </p>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  5. Your Rights &amp; Data Deletion
                </h3>
                <p>
                  You can access, modify, or delete your personal contact
                  coordinates at any time directly through the{" "}
                  <strong>My Profile</strong> or <strong>My Items</strong>{" "}
                  dashboards. If you wish to completely close your account or
                  wipe your listing data, please reach out to our team or use
                  the direct profile purge settings.
                </p>
              </section>
            </div>

            <div
              style={{
                marginTop: "40px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "20px",
                textAlign: "center",
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Last updated:{" "}
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              · FindTrack Platform Security
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 7: TERMS OF SERVICE PAGE ── */}
      {currentView === "terms" && (
        <div
          style={{
            minHeight: "100vh",
            background:
              "radial-gradient(ellipse at bottom, #1e293b 0%, #0f172a 100%)",
            color: "#f8fafc",
            padding: "40px 16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              width: "100%",
              background: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "36px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
            className="mx-auto"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                paddingBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span style={{ fontSize: "32px" }}>⚖️</span>
                <div>
                  <h1
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      lineHeight: 1.2,
                    }}
                  >
                    Terms of Service
                  </h1>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                      marginTop: "4px",
                    }}
                  >
                    FindTrack Lost &amp; Found Platform
                  </p>
                </div>
              </div>
              <button
                onClick={handleBackToSafety}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
                className="hover:bg-white/20 transition-all"
              >
                ← Go Back
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  1. Agreement to Terms
                </h3>
                <p>
                  By registering, logging in, browsing as a guest, or submitting
                  reports on FindTrack, you accept and agree to follow these
                  Terms of Service. If you do not agree to all of these Terms,
                  you are prohibited from using the application.
                </p>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  2. User Responsibilities &amp; Acceptable Use
                </h3>
                <p>
                  When posting lost or found items and interacting with other
                  community members, you agree to:
                </p>
                <ul
                  style={{
                    listStyleType: "disc",
                    paddingLeft: "20px",
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <li>
                    Provide accurate, genuine, and reliable details regarding
                    found objects, locations, and descriptions.
                  </li>
                  <li>
                    Refrain from listing fraudulent claims, fake items,
                    offensive photos, or inaccurate contact information.
                  </li>
                  <li>
                    Respect other users and use the interactive real-time
                    coordinates, chats, and claims desk only for legitimate
                    recovery purposes.
                  </li>
                  <li>
                    Never attempt to gain unauthorized access to other user
                    profiles, databases, or restricted platform APIs.
                  </li>
                </ul>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  3. Verification of Ownership &amp; Meetups
                </h3>
                <p>
                  FindTrack provides verification mechanisms (such as custom
                  security confirmation questions) to help confirm proof of
                  ownership prior to release. However:
                </p>
                <ul
                  style={{
                    listStyleType: "disc",
                    paddingLeft: "20px",
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <li>
                    Users are solely responsible for thoroughly vetting proof of
                    ownership before handing over items.
                  </li>
                  <li>
                    Physical meetups, handling of high-value items, and
                    exchanges are at your own discretion. We encourage
                    coordinating safe, public, well-lit spaces (such as security
                    desk areas, campuses, or official lost and found centers).
                  </li>
                </ul>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  4. Disclaimer of Warrant &amp; Limitation of Liability
                </h3>
                <p>
                  FindTrack is provided "as is" and "as available". We do not
                  guarantee that your lost items will be found, or that matches
                  suggested by the system are 100% correct. Under no
                  circumstances shall FindTrack, our developers, or our
                  affiliates be liable for damages, item damage, theft, fraud,
                  or any conflicts arising from physical item exchange
                  coordinates.
                </p>
              </section>

              <section>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  5. Modifications to Service
                </h3>
                <p>
                  We reserves the right to modify or adjust the features,
                  layouts, database rules, or services of FindTrack at any time.
                  Continued use of the platform after updates indicates consent
                  to all revised guidelines.
                </p>
              </section>
            </div>

            <div
              style={{
                marginTop: "40px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "20px",
                textAlign: "center",
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Last updated:{" "}
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              · FindTrack Community Terms
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 8: ABOUT US PAGE ── */}
      {currentView === "about" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>About Us</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              FindTrack is a community-driven lost and found platform dedicated to helping people recover their lost items across the Philippines.
              Our mission is to foster a culture of honesty and trust (Bayanihan) by providing a secure and accessible platform for reporting and recovering lost belongings.
            </p>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              Whether you've lost something precious or found an item that needs returning, FindTrack is here to bridge the gap and make recovery easier.
            </p>
          </div>
        </div>
      )}

      {/* ── VIEW 9: SAFETY GUIDELINES PAGE ── */}
      {currentView === "safety" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>Safety Guidelines</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              Your safety is our top priority. When meeting to return or retrieve a lost item, please keep the following guidelines in mind:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", color: "#475569", lineHeight: "1.6", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><strong>Meet in Public Places:</strong> Always choose well-lit, public locations for handovers, such as cafes, malls, or police stations.</li>
              <li><strong>Bring a Friend:</strong> If possible, bring someone with you when meeting a stranger.</li>
              <li><strong>Verify Ownership:</strong> Ask identifying questions about the item before handing it over (e.g., unique marks, passwords for devices).</li>
              <li><strong>Do Not Share Personal Information:</strong> Avoid sharing your home address, financial details, or other sensitive information.</li>
              <li><strong>Trust Your Instincts:</strong> If a situation feels unsafe, cancel the meeting and report the user if necessary.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── VIEW 10: HELP CENTER PAGE ── */}
      {currentView === "help" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>Help Center</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              Need assistance with using FindTrack? You're in the right place.
            </p>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>How to Report a Lost Item</h2>
              <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6" }}>
                1. Log in to your account and go to the Dashboard.<br/>
                2. Click on the "Report Item" button.<br/>
                3. Fill out the details (type, description, location) and upload a photo if available.<br/>
                4. Submit the report to alert the community.
              </p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>How to Claim a Found Item</h2>
              <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6" }}>
                1. Browse the items feed on your Dashboard.<br/>
                2. If you spot an item that belongs to you, click "Claim item" (Hand icon).<br/>
                3. Provide proof of ownership in the message to the finder.<br/>
                4. Coordinate a safe handover.
              </p>
            </div>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
              Still need help? Please reach out to our support team at: <strong>novapulsarsupport@gmail.com</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── VIEW 11: CONTACT US PAGE ── */}
      {currentView === "contact" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
          <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: "bold", fontSize: "24px", color: "#01725a", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => { setCurrentView("landing"); window.history.pushState(null, "", "/"); }}>
              <MapPin className="h-6 w-6 text-[#01725a]"/>
              FindTrack
            </div>
          </header>
          <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#00654f", marginBottom: "24px" }}>Contact Us</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
              We'd love to hear from you. Whether you have a question about our platform, need help with an item, or want to provide feedback, our team is ready to assist.
            </p>
            
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "24px", borderRadius: "8px", marginTop: "32px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#166534", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail className="w-6 h-6" /> Email Support
              </h2>
              <p style={{ fontSize: "16px", color: "#166534", lineHeight: "1.6" }}>
                You can reach our support team directly at:<br/>
                <a href="mailto:novapulsarsupport@gmail.com" style={{ fontWeight: "bold", textDecoration: "underline", color: "#15803d", fontSize: "18px", display: "inline-block", marginTop: "8px" }}>
                  novapulsarsupport@gmail.com
                </a>
              </p>
              <p style={{ fontSize: "14px", color: "#15803d", marginTop: "12px" }}>
                We typically respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 4: MAIN DASHBOARD PORTAL ── */}
      {currentView === "dashboard" && (
        <div className="flex h-[100dvh] bg-surface-container-lowest text-on-surface font-body-md overflow-hidden">
          {/* SIDEBAR (Desktop) */}
          <aside className={`fixed md:relative z-50 flex flex-col w-64 h-full bg-primary text-on-primary shadow-md transition-transform transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
            <div className="p-6 flex justify-between items-center shrink-0">
              <div>
                <h1 className="font-headline-lg text-2xl font-bold">FindTrack</h1>
                <p className="font-label-md text-on-primary/80 mt-1">Community Lost &amp; Found</p>
              </div>
              <button className="md:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 px-4">
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "report", label: "Report Item", icon: PlusCircle },
                { id: "search", label: "Search", icon: Search },
                { id: "notifications", label: "Alerts", icon: Bell },
                { id: "profile", label: "Profile", icon: UserIcon },
                { id: "myitems", label: "My Items", icon: Inbox },
                { id: "pinned", label: "Pinned Items", icon: MapPin },
                { id: "categories", label: "Categories", icon: Tag },
                { id: "analytics", label: "Analytics", icon: PenTool },
                { id: "tips", label: "Recovery Tips", icon: Info },
                { id: "packaging", label: "Packaging Tips", icon: Package },
                { id: "about", label: "About / Help", icon: CheckCircle2 }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (profileName === "Guest" && ["report", "notifications", "myitems", "pinned"].includes(item.id)) {
                      setShowGuestModal(true);
                    } else {
                      setActiveTab(item.id);
                      if (item.id === "home" || item.id === "search") setCategoryKeywords(null);
                    }
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors group ${
                    activeTab === item.id 
                      ? "bg-primary-container text-on-primary-container font-medium" 
                      : "text-on-primary hover:bg-white/10"
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${activeTab === item.id ? "text-on-primary-container" : ""}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-on-primary/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                  {profileName === "Guest" ? "G" : profileName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium truncate">{profileName}</div>
                  <div className="text-xs text-white/70 truncate">{profileEmail || "Guest User"}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* TOP BAR */}
            <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-surface-container-lowest border-b border-outline-variant z-40">
              <div className="flex items-center gap-4">
                <button 
                  className="md:hidden text-on-surface"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="relative hidden sm:block" onClick={() => setActiveTab('search')}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
                  <input 
                    type="text" 
                    placeholder="Search community..."
                    className="pl-10 pr-4 py-2 bg-surface-container rounded-full text-sm border-none focus:ring-2 focus:ring-primary outline-none w-64 pointer-events-none"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (profileName === "Guest") setShowGuestModal(true);
                    else setActiveTab("report");
                  }}
                  className="hidden sm:flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-dim transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Report Item
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {alerts.filter(a => !a.read).length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>}
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold cursor-pointer">
                  {profileName === "Guest" ? "G" : profileName.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            {/* MAIN PANELS INJECTION DESK */}

          <main className="flex-1 overflow-y-auto bg-surface-container-low p-4 md:p-6 lg:p-8 relative">
            {/* PANEL: HOME */}
            <section
              id="home"
              className={`${activeTab === "home" ? "flex" : "hidden"} max-w-5xl mx-auto h-full flex-col`}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                Magandang araw 👋
              </h1>
              
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#D3E8E5] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <ShoppingBag className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Items<br/>Reported:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">{stats.lost + stats.found}</div>
                  </div>
                  <div className="bg-[#E2F0D9] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <Search className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Items<br/>Found:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">{stats.found}</div>
                  </div>
                  <div className="bg-[#D3E8E5] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <Users className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Community<br/>Members:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">250+</div>
                  </div>
                  <div className="bg-[#D3E8E5] p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                    <CheckSquare className="w-8 h-8 text-[#1A7B72] mb-3" strokeWidth={1.5} />
                    <div className="text-sm font-medium text-[#15605A] leading-tight mb-1">Recoveries<br/>This Week:</div>
                    <div className="text-3xl font-bold text-[#1A7B72]">{stats.claimed}</div>
                  </div>
              </div>

              {/* Content row */}
              <div className="grid md:grid-cols-2 gap-6 mb-8 flex-1 min-h-[400px]">
                  {/* Recent Community Activity */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Community Activity</h2>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                      {items.slice(0, 6).map((r) => (
                        <div key={r.id} className="text-sm border-b border-slate-50 pb-4 last:border-0">
                          <span className="font-semibold text-slate-800">{r.type === 'lost' ? 'Lost' : 'Found'} {r.title}</span> {r.location ? `in ${r.location}` : ''} - 
                          <span className="text-slate-500 ml-1">Reported by {r.contactName?.split(' ')[0] || 'Member'} ({r.date ? new Date(r.date).toLocaleDateString() : 'recently'})</span>
                        </div>
                      ))}
                      {items.length === 0 && <div className="text-slate-500 text-sm">No recent activity.</div>}
                    </div>
                  </div>
                  
                  {/* Private Messages */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Private Messages</h2>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">JS</div>
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          <div className="font-bold mb-1">Juan S.</div>
                          - Hi, I think I found your item... We actually dropped this item around your area?
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">MD</div>
                        <div className="bg-[#D3E8E5] rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          <div className="font-bold mb-1">Maria D.</div>
                          - Can you confirm the location... near a north store?
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">LG</div>
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700">
                          <div className="font-bold mb-1">Leo G.</div>
                          - New match for your report... Step up now, speaker!
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Footer Banner */}
              <div className="mt-auto bg-[#1A7B72] text-white text-center py-5 px-6 rounded-2xl font-medium shadow-md">
                Every recovered item strengthens the community.
              </div>
            </section>
            {/* PANEL: REPORT SUBMISSION */}
            <section
              id="report"
              className={`${activeTab === "report" ? "block" : "hidden"}`}
            >
              <div className="max-w-3xl mx-auto space-y-8">
                <header className="mb-8">
                  <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Report an Item</h2>
                  <p className="font-body-md text-on-surface-variant mt-2">Fill in the details below. Our smart matching system will help find the owner or the item.</p>
                </header>

                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                  {/* Stepper Header */}
                  <div className="flex border-b border-outline-variant bg-surface-variant/50">
                    <div className={`flex-1 py-4 px-6 text-center text-sm font-bold border-b-2 ${reportStep >= 1 ? 'border-primary text-primary' : 'border-transparent text-outline'}`}>
                      1. Basic Info
                    </div>
                    <div className={`flex-1 py-4 px-6 text-center text-sm font-bold border-b-2 ${reportStep >= 2 ? 'border-primary text-primary' : 'border-transparent text-outline'}`}>
                      2. Details
                    </div>
                    <div className={`flex-1 py-4 px-6 text-center text-sm font-bold border-b-2 ${reportStep >= 3 ? 'border-primary text-primary' : 'border-transparent text-outline'}`}>
                      3. Verification
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (reportStep < 3) {
                        setReportStep(reportStep + 1);
                        return;
                      }
                      await handleReportSubmit(e);
                      setReportStep(1);
                    }}
                    className="p-6 md:p-8 space-y-6"
                  >
                    {/* STEP 1: Basic Info */}
                    <div className={`space-y-6 ${reportStep === 1 ? 'block' : 'hidden'}`}>
                      <div className="space-y-3">
                        <label className="block font-label-md font-bold text-on-surface">I am reporting a...</label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${reportType === "lost" ? "border-error text-error bg-error/5 ring-2 ring-error/20" : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"}`}>
                            <input type="radio" name="reportType" value="lost" checked={reportType === "lost"} onChange={() => setReportType("lost")} className="sr-only" />
                            <Search className="h-6 w-6" />
                            <span className="font-bold">Lost Item</span>
                          </label>
                          <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${reportType === "found" ? "border-primary text-primary bg-primary/5 ring-2 ring-primary/20" : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"}`}>
                            <input type="radio" name="reportType" value="found" checked={reportType === "found"} onChange={() => setReportType("found")} className="sr-only" />
                            <PackageCheck className="h-6 w-6" />
                            <span className="font-bold">Found Item</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Item Title</label>
                        <input type="text" required value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="e.g. Blue Hydroflask" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Location {reportType === "lost" ? "Lost" : "Found"}</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
                          <input type="text" required value={reportLocation} onChange={(e) => setReportLocation(e.target.value)} placeholder="e.g. Library 2nd Floor" className="w-full bg-surface-variant border-none rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* STEP 2: Details */}
                    <div className={`space-y-6 ${reportStep === 2 ? 'block' : 'hidden'}`}>
                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Description</label>
                        <textarea required value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} rows={4} placeholder="Describe the item in detail (color, brand, unique marks...)" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Upload Image (Optional)</label>
                        <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center hover:bg-surface-variant transition-colors cursor-pointer relative">
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setReportImageFile(file);
                              const reader = new FileReader();
                              reader.onload = (ev) => setReportImage(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {reportImage ? (
                            <div className="flex flex-col items-center">
                              <img src={reportImage} alt="Preview" className="h-32 object-contain rounded-lg mb-4 shadow-sm" />
                              <span className="text-sm font-medium text-primary">Change Image</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Camera className="h-10 w-10 text-outline mb-3" />
                              <span className="text-sm font-medium text-on-surface">Click to upload or drag and drop</span>
                              <span className="text-xs text-on-surface-variant mt-1">PNG, JPG up to 5MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: Verification */}
                    <div className={`space-y-6 ${reportStep === 3 ? 'block' : 'hidden'}`}>
                      <div className="p-4 bg-primary-container text-on-primary-container rounded-xl text-sm mb-6">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold mb-1">Protecting Ownership</p>
                            <p>To ensure this item is returned to its rightful owner, set a secret question that only the real owner would know.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Secret Verification Question</label>
                        <input type="text" required value={reportSecurityQuestion} onChange={(e) => setReportSecurityQuestion(e.target.value)} placeholder="e.g. What is the wallpaper on the lock screen?" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-label-md font-bold text-on-surface">Secret Answer</label>
                        <input type="text" required value={reportSecurityAnswer} onChange={(e) => setReportSecurityAnswer(e.target.value)} placeholder="e.g. A picture of a dog" className="w-full bg-surface-variant border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none" />
                        <p className="text-xs text-on-surface-variant mt-1">This answer will be hidden and used for verification.</p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-outline-variant flex justify-between items-center mt-8">
                      {reportStep > 1 ? (
                        <button type="button" onClick={() => setReportStep(reportStep - 1)} className="px-6 py-2.5 rounded-full font-label-md font-bold text-on-surface border border-outline-variant hover:bg-surface-variant transition-colors">
                          Back
                        </button>
                      ) : <div></div>}
                      
                      <button type="submit" disabled={isUploading} className="px-6 py-2.5 rounded-full font-label-md font-bold bg-primary text-on-primary hover:bg-primary-dim transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70">
                        {isUploading ? "Uploading..." : reportStep < 3 ? "Continue" : (
                          <><Send className="h-4 w-4" /> Submit Report</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* PANEL: SEARCH REGISTRY */}
            <section
              id="search"
              className={`panel ${activeTab === "search" ? "active" : ""}`}
            >
              <div className="section-title">
                <Search className="h-5 w-5 inline mr-1 text-sky-500" /> Search
                Database
              </div>

              <div className="search-container">
                <div className="search-bar">
                  <div className="search-input-wrapper">
                    <span className="search-icon">
                      <Search className="h-5 w-5" />
                    </span>
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

                <div
                  id="advancedFilters"
                  className={`advanced-filters ${!advancedFiltersOpen ? "hidden" : ""}`}
                >
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
                  <button
                    onClick={() => setCategoryKeywords(null)}
                    className="font-bold underline"
                  >
                    Show all files
                  </button>
                </div>
              )}

              {/* SMART SUGGESTION MATCH BANNER COGNITIVE extraction */}
              {smartMatches.length > 0 && (
                <div id="matchBanner" className="match-banner show">
                  <div className="match-banner-title">
                    🤖 Smart suggestions — Possible matches for your query
                  </div>
                  <div className="match-cards">
                    {smartMatches.map(({ report, score }) => {
                      const pct = Math.round(score * 100);
                      return (
                        <div
                          key={report.id}
                          onClick={() => {
                            setSelectedItemId(report.id);
                            setActiveTab("itemDetail");
                          }}
                          className="match-chip"
                        >
                          <div className="match-chip-title">{report.title}</div>
                          <div className="match-chip-meta">
                            <MapPin className="h-3 w-3 inline text-slate-400 mr-1" />{" "}
                            {report.location || "Unknown"}
                          </div>
                          <div className="match-score">
                            <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />{" "}
                            {pct}% match
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEARCH REGISTRY CARDS GRID */}
              <div id="searchResults" className="cards-grid">
                {filteredSearchList.map((r) => {
                  const pinned = pinnedIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedItemId(r.id);
                        setActiveTab("itemDetail");
                      }}
                      className="card-item clickable"
                    >
                      <div className="relative">
                        <div className="card-media">
                          {r.image || r.imageUrl ? (
                            <img
                              src={r.image || r.imageUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div style={{ opacity: 0.35 }}>
                              <Camera className="h-12 w-12" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(r.id);
                          }}
                          className={`pin-toggle ${pinned ? "pinned" : ""}`}
                        >
                          {pinned ? (
                            <MapPin className="h-4 w-4" fill="currentColor" />
                          ) : (
                            <MapPin className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <div className="card-title">{r.title}</div>
                      <div className="card-desc">
                        {r.desc || r.description || "No description provided."}
                      </div>
                      <div className="card-footer">
                        <div>
                          <small style={{ display: "block", color: "#64748b" }}>
                            {r.location || "Unknown location"}
                          </small>
                          <small style={{ color: "#94a3b8" }}>
                            {r.date
                              ? new Date(r.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "Just now"}
                          </small>
                        </div>
                        <div
                          className={`badge ${r.claimed ? "claimed" : r.type}`}
                        >
                          {r.claimed ? "CLAIMED" : r.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredSearchList.length === 0 && (
                <div
                  id="noResults"
                  className="empty flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-4 border border-sky-100 shadow-sm mt-4">
                    <Search className="h-8 w-8 text-sky-400" />
                  </div>
                  No items found matching the current criteria.
                </div>
              )}
            </section>

            {/* PANEL: ITEM DETAIL VIEW */}
            <section
              id="itemDetail"
              className={`panel ${activeTab === "itemDetail" ? "active" : ""}`}
            >
              <button
                onClick={() => setActiveTab("search")}
                className="back-btn"
              >
                ← Back to Search
              </button>

              <div id="detailContent">
                {(() => {
                  const r = items.find((x) => x.id === selectedItemId);
                  if (!r)
                    return (
                      <p className="p-6 text-slate-400 font-sans text-xs">
                        Please choose an item from search.
                      </p>
                    );

                  const mappedItem: Item = {
                    id: r.id,
                    userId: r.userId,
                    type: r.type,
                    title: r.title,
                    description:
                      r.desc || r.description || "No description provided.",
                    category: (r as any).category || "others",
                    location: r.location,
                    status: r.claimed ? "resolved" : "active",
                    imageUrl: r.image || r.imageUrl || "",
                    contactName: r.contactName || "Representative",
                    contactInfo: r.contactInfo || "No contact info provided",
                    date: r.date || new Date().toISOString(),
                    createdAt: r.createdAt
                      ? r.createdAt.seconds
                        ? new Date(r.createdAt.seconds * 1000).toISOString()
                        : String(r.createdAt)
                      : new Date().toISOString(),
                    updatedAt: r.createdAt
                      ? r.createdAt.seconds
                        ? new Date(r.createdAt.seconds * 1000).toISOString()
                        : String(r.createdAt)
                      : new Date().toISOString(),
                  };

                  const oppositeItemsMapped = items
                    .filter((x) => x.type !== r.type)
                    .map(
                      (x) =>
                        ({
                          id: x.id,
                          userId: x.userId,
                          type: x.type,
                          title: x.title,
                          description: x.desc || x.description || "",
                          category: (x as any).category || "others",
                          location: x.location,
                          status: x.claimed ? "resolved" : "active",
                          imageUrl: x.image || x.imageUrl || "",
                          contactName: x.contactName || "Representative",
                          contactInfo:
                            x.contactInfo || "No contact info provided",
                          date: x.date || new Date().toISOString(),
                          createdAt: x.createdAt
                            ? x.createdAt.seconds
                              ? new Date(
                                  x.createdAt.seconds * 1000,
                                ).toISOString()
                              : String(x.createdAt)
                            : new Date().toISOString(),
                          updatedAt: x.createdAt
                            ? x.createdAt.seconds
                              ? new Date(
                                  x.createdAt.seconds * 1000,
                                ).toISOString()
                              : String(x.createdAt)
                            : new Date().toISOString(),
                        }) as any,
                    );

                  return (
                    <ItemDetail
                      item={mappedItem}
                      onClose={() => setActiveTab("search")}
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
            <section
              id="notifications"
              className={`panel ${activeTab === "notifications" ? "active" : ""}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Real-time Chats Inbox Column */}
                <div className="md:col-span-2 space-y-6">
                  {/* 🛡️ "PROVE IT" LANDING CLAIMS FOR OWNER ITEMS (Item 3) */}
                  <div
                    className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-3xl space-y-4"
                    id="finder-claims-review-panel"
                  >
                    <div className="flex flex-col gap-1.5 items-start sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5 flex-wrap">
                        <Key className="h-4 w-4 inline mr-1 text-sky-500" />{" "}
                        Incoming Ownership Claims (
                        {
                          incomingClaims.filter((c) => c.status === "pending")
                            .length
                        }{" "}
                        pending)
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold uppercase rounded-full inline-block whitespace-nowrap shrink-0">
                        Prove-it Verification Layer
                      </span>
                    </div>

                    {incomingClaims.length === 0 ? (
                      <div className="text-center py-10 bg-white border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-450 p-6 shadow-sm">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <p className="font-sans text-xs font-extrabold text-slate-700">
                          No claims registered yet.
                        </p>
                        <p className="font-sans text-[10.5px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                          Your active listings verification answers from
                          claiming searchers will update here automatically in
                          real-time.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {incomingClaims.map((claim) => {
                          const isPending = claim.status === "pending";

                          return (
                            <div
                              key={claim.id}
                              className={`bg-white border rounded-2xl p-4 shadow-sm relative transition hover:shadow-md ${
                                claim.status === "approved"
                                  ? "border-emerald-200 bg-emerald-50/5"
                                  : claim.status === "rejected"
                                    ? "border-rose-200 bg-rose-50/5"
                                    : "border-slate-200/80 hover:border-indigo-200"
                              }`}
                              id={`claim-review-card-${claim.id}`}
                            >
                              <div className="flex flex-col gap-2 items-start justify-between sm:flex-row sm:items-center w-full mb-2">
                                <div className="space-y-0.5">
                                  <h4 className="font-sans text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>Claim on:</span>
                                    <span className="text-indigo-600 font-extrabold">
                                      {claim.itemTitle}
                                    </span>
                                  </h4>
                                  <span className="font-mono text-[9px] text-slate-400 block mt-0.5">
                                    Claimer:{" "}
                                    <strong className="text-slate-600 font-bold">
                                      {claim.claimerName}
                                    </strong>{" "}
                                    ({claim.claimerEmail || "anonymous_email"})
                                  </span>
                                </div>

                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                    claim.status === "approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : claim.status === "rejected"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-105 text-amber-805"
                                  }`}
                                >
                                  {claim.status}
                                </span>
                              </div>

                              <div className="space-y-2 bg-slate-50 border border-slate-205/60 rounded-xl p-3 text-xs mt-2.5">
                                <div>
                                  <p className="font-mono text-[8.5px] text-slate-400 uppercase tracking-widest font-bold">
                                    Verification Question:
                                  </p>
                                  <p className="font-sans text-slate-700 font-semibold leading-relaxed">
                                    "{claim.securityQuestion}"
                                  </p>
                                </div>
                                <div className="pt-2 border-t border-slate-200/50 mt-2">
                                  <p className="font-mono text-[8.5px] text-slate-400 uppercase tracking-widest font-bold">
                                    Claimer's Answer / Proof details:
                                  </p>
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
                                    onClick={() =>
                                      handleApproveClaim(claim.id, claim.itemId)
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-tr from-teal-850 to-indigo-950 text-white font-sans text-[11px] font-bold cursor-pointer transition hover:from-teal-900 hover:to-indigo-900 active:scale-95 flex items-center gap-1 shadow-sm"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
                                    <span>Approve & Unlock PII</span>
                                  </button>
                                </div>
                              ) : (
                                <p className="text-right text-[10px] text-slate-400 mt-2.5 font-sans font-medium">
                                  {claim.status === "approved"
                                    ? "✓ Approved: Private coordinates are now fully shared."
                                    : "✗ Declined claim."}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="section-title flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" /> Active Chats Inbox
                    </span>
                    <span className="font-mono text-[9px] bg-teal-100 text-teal-850 font-bold uppercase rounded-full px-2 py-0.5 animate-pulse">
                      Live Messaging
                    </span>
                  </div>
                  <ChatInboxList
                    currentUserUid={user ? user.uid : null}
                    onSelectChat={(id) => setActiveChatId(id)}
                    activeChatId={activeChatId}
                  />
                </div>

                {/* Static System Alerts Column */}
                <div className="md:col-span-1 space-y-4">
                  <div className="section-title">
                    <Bell className="h-5 w-5 inline mr-1 text-sky-500" />{" "}
                    Platform Alerts
                  </div>
                  <div id="alertsList" className="space-y-3">
                    <div className="alert-item m-0">
                      <strong>
                        <Info className="h-4 w-4 inline mr-1 text-sky-500" />{" "}
                        Welcome to FindTrack!
                      </strong>
                      <p>
                        You'll receive secure notifications and match
                        recommendations here.
                      </p>
                    </div>
                    <div className="alert-item m-0">
                      <strong>
                        <CheckCircle2 className="h-4 w-4 inline mr-1 text-sky-500" />{" "}
                        Pro Tip
                      </strong>
                      <p>
                        Tap "Message Finder" on other users' listings to contact
                        them safely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PANEL: PROFILE */}
            <section
              id="profile"
              className={`panel ${activeTab === "profile" ? "active" : ""}`}
            >
              <div className="section-title">
                <UserIcon className="h-5 w-5 inline mr-1 text-sky-500" /> My
                Profile
              </div>
              <div className="profile-container">
                <div className="profile-photo">
                  <img id="pf_avatar" src={profileAvatar} alt="Profile" />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      onClick={handleRandomAvatar}
                      className="secondary-btn flex items-center gap-1.5"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
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
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      alignItems: "center",
                      marginTop: "4px",
                    }}
                  >
                    <button
                      onClick={handleSaveProfile}
                      className="primary-btn flex items-center gap-1.5"
                    >
                      <Save className="h-4 w-4" /> Save Profile
                    </button>
                    <button
                      onClick={handleLogoutAction}
                      className="flex items-center gap-1"
                      style={{
                        fontSize: "13px",
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* PANEL: MY ITEMS */}
            <section
              id="myitems"
              className={`${activeTab === "myitems" ? "block" : "hidden"}`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-headline-lg text-3xl font-bold text-on-surface">My Items</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">Manage your reported lost and found items.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 font-label-md font-bold border border-outline rounded-lg text-on-surface hover:bg-surface-variant transition-colors">
                      <Filter className="h-4 w-4" /> Filter
                    </button>
                    <button 
                      onClick={() => setActiveTab("report")}
                      className="flex items-center gap-2 px-4 py-2 font-label-md font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-dim transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" /> Report New
                    </button>
                  </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-outline-variant">
                  <button className="px-4 py-2 font-label-md font-bold text-primary border-b-2 border-primary whitespace-nowrap">
                    Active ({items.filter(i => i.userId === auth.currentUser?.uid && !i.claimed).length})
                  </button>
                  <button className="px-4 py-2 font-label-md font-medium text-on-surface-variant hover:text-on-surface whitespace-nowrap">
                    Resolved ({items.filter(i => i.userId === auth.currentUser?.uid && i.claimed).length})
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items
                    .filter((item) => item.userId === auth.currentUser?.uid)
                    .map((r) => {
                      const pinned = pinnedIds.includes(r.id);
                      return (
                        <div key={r.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                          <div 
                            className="relative h-48 bg-surface-variant overflow-hidden cursor-pointer"
                            onClick={() => {
                              setSelectedItemId(r.id);
                              setActiveTab("itemDetail");
                            }}
                          >
                            {r.image || r.imageUrl ? (
                              <img src={r.image || r.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-outline">
                                <Camera className="h-10 w-10 opacity-30" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                r.claimed ? 'bg-primary-container text-on-primary-container' : 
                                r.type === 'found' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
                              }`}>
                                {r.claimed ? 'RESOLVED' : r.type === 'found' ? 'FOUND ITEM' : 'LOST ITEM'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(r.id);
                              }}
                              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                                pinned ? "bg-tertiary-container text-on-tertiary-container" : "bg-black/30 text-white hover:bg-black/50"
                              }`}
                            >
                              <MapPin className="h-4 w-4" fill={pinned ? "currentColor" : "none"} />
                            </button>
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 
                              className="font-headline-md text-lg font-bold text-on-surface mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                              onClick={() => {
                                setSelectedItemId(r.id);
                                setActiveTab("itemDetail");
                              }}
                            >
                              {r.title}
                            </h3>
                            <div className="space-y-1.5 mb-4 flex-1">
                              <p className="flex items-center text-sm text-on-surface-variant">
                                <MapPin className="h-4 w-4 mr-2 text-outline shrink-0" />
                                <span className="truncate">{r.location}</span>
                              </p>
                              <p className="flex items-center text-sm text-on-surface-variant">
                                <Clock className="h-4 w-4 mr-2 text-outline shrink-0" />
                                <span>{r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString() : 'Recent'}</span>
                              </p>
                            </div>
                            <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                              <button 
                                onClick={() => {
                                  setSelectedItemId(r.id);
                                  setActiveTab("itemDetail");
                                }}
                                className="text-sm font-bold text-primary hover:text-primary-dim"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => deleteItem(r.id)}
                                className="text-sm font-bold text-error hover:text-error-container"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {items.filter((item) => item.userId === auth.currentUser?.uid).length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
                      <Inbox className="h-12 w-12 text-outline mx-auto mb-4" />
                      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2">No items yet</h3>
                      <p className="text-on-surface-variant mb-6">You haven't reported any lost or found items.</p>
                      <button 
                        onClick={() => setActiveTab("report")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 font-label-md font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-dim transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" /> Report an Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* PANEL: PINNED ITEMS */}
            <section
              id="pinned"
              className={`${activeTab === "pinned" ? "block" : "hidden"}`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Pinned Items</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">Quick access to items you are keeping track of.</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[240px]">
                  {items
                    .filter((item) => pinnedIds.includes(item.id))
                    .map((r, i) => {
                      const isLarge = i % 5 === 0;
                      return (
                        <div 
                          key={r.id} 
                          className={`${isLarge ? "md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"} bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative`}
                          onClick={() => {
                            setSelectedItemId(r.id);
                            setActiveTab("itemDetail");
                          }}
                        >
                          <div className={`${isLarge ? "h-3/5" : "h-1/2"} bg-surface-variant relative overflow-hidden`}>
                            {r.image || r.imageUrl ? (
                              <img src={r.image || r.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-outline">
                                <Camera className="h-10 w-10 opacity-30" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                r.claimed ? 'bg-primary-container text-on-primary-container' : 
                                r.type === 'found' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
                              }`}>
                                {r.claimed ? 'RESOLVED' : r.type === 'found' ? 'FOUND ITEM' : 'LOST ITEM'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(r.id);
                              }}
                              className="absolute top-3 right-3 p-2 rounded-full bg-tertiary-container text-on-tertiary-container backdrop-blur-md transition-colors hover:scale-110"
                            >
                              <MapPin className="h-4 w-4" fill="currentColor" />
                            </button>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className={`font-headline-md font-bold text-on-surface mb-1 truncate ${isLarge ? "text-xl" : "text-base"}`}>
                                {r.title}
                              </h3>
                              <p className="flex items-center text-xs text-on-surface-variant">
                                <MapPin className="h-3 w-3 mr-1 text-outline shrink-0" />
                                <span className="truncate">{r.location}</span>
                              </p>
                            </div>
                            <div className="mt-2 text-xs text-on-surface-variant flex items-center justify-between">
                              <span>{r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString() : 'Recent'}</span>
                              <span className="font-bold text-primary">View Details &rarr;</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {items.filter((item) => pinnedIds.includes(item.id)).length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
                      <MapPin className="h-12 w-12 text-outline mx-auto mb-4" />
                      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2">No pinned items</h3>
                      <p className="text-on-surface-variant mb-6">You haven't bookmarked any items yet.</p>
                      <button 
                        onClick={() => setActiveTab("search")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 font-label-md font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-dim transition-colors"
                      >
                        <Search className="h-4 w-4" /> Browse Items
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* PANEL: CATEGORIES BROWSER */}
            <section
              id="categories"
              className={`${activeTab === "categories" ? "block" : "hidden"}`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Browse Categories</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">Filter lost and found items by type.</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category 1 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["bag", "backpack", "purse", "wallet", "luggage", "suitcase", "handbag"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform">
                      🎒
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Bags &amp; Backpacks</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Purses, wallets, luggage, etc.</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["bag", "backpack", "purse", "wallet", "luggage", "suitcase", "handbag"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["phone", "laptop", "tablet", "charger", "headphone", "earphone", "computer", "iphone", "samsung", "ipad", "macbook"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Smartphone className="h-8 w-8" />
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Electronics</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Phones, laptops, tablets, chargers</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["phone", "laptop", "tablet", "charger", "headphone", "earphone", "computer", "iphone", "samsung", "ipad", "macbook"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["book", "notebook", "textbook", "pen", "pencil", "id", "card", "stationery", "notes"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Info className="h-8 w-8" />
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Books &amp; Stationery</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Textbooks, IDs, pens, notes</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["book", "notebook", "textbook", "pen", "pencil", "id", "card", "stationery", "notes"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>

                  {/* Category 4 */}
                  <div 
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
                    onClick={() => {
                      setCategoryKeywords(["jacket", "shirt", "pants", "uniform", "glasses", "watch", "coat", "shoes", "hat", "scarf"]);
                      setActiveTab("search");
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Tag className="h-8 w-8" />
                    </div>
                    <h3 className="font-headline-md font-bold text-on-surface mb-2">Clothing &amp; Accs.</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Jackets, uniforms, glasses, watches</p>
                    <div className="mt-auto inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">
                      {items.filter(i => ["jacket", "shirt", "pants", "uniform", "glasses", "watch", "coat", "shoes", "hat", "scarf"].some(kw => i.title.toLowerCase().includes(kw) || i.desc?.toLowerCase().includes(kw))).length} Items Active
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PANEL: ANALYTICS DESK */}
            <section
              id="analytics"
              className={`panel ${activeTab === "analytics" ? "active" : ""}`}
            >
              <div className="section-title">📊 Analytics Dashboard</div>
              <p className="section-subtitle">
                Visual overview of all reported items
              </p>

              <div className="analytics-grid" id="analyticsGrid">
                <div className="analytics-card">
                  <div className="big-num" style={{ color: "#ef4444" }}>
                    {stats.lost}
                  </div>
                  <div className="big-label">Active Lost</div>
                </div>
                <div className="analytics-card">
                  <div className="big-num" style={{ color: "#0ea5e9" }}>
                    {stats.found}
                  </div>
                  <div className="big-label">Found Items</div>
                </div>
                <div className="analytics-card">
                  <div className="big-num" style={{ color: "#10b981" }}>
                    {stats.claimed}
                  </div>
                  <div className="big-label">Claimed</div>
                </div>
                <div className="analytics-card">
                  <div className="big-num" style={{ color: "#8b5cf6" }}>
                    {items.length}
                  </div>
                  <div className="big-label">Total Reports</div>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "24px",
                  borderRadius: "20px",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border)",
                }}
              >
                <canvas
                  ref={canvasRef}
                  id="chartCanvas"
                  width={400}
                  height={220}
                  style={{
                    maxWidth: "100%",
                    display: "block",
                    margin: "0 auto",
                  }}
                ></canvas>
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "13px",
                    marginTop: "14px",
                  }}
                >
                  Item distribution by status
                </p>
              </div>
            </section>

            {/* PANEL: GENERAL LIST OF INFORMATION GUIDES */}
            <section
              id="tips"
              className={`panel ${activeTab === "tips" ? "active" : ""}`}
            >
              <div className="section-title">
                <Navigation className="h-5 w-5 inline mr-1 text-sky-500" /> Lost
                Item Recovery Guide
              </div>
              <p className="section-subtitle">
                Helpful tips to increase your chances of finding lost items
              </p>
              <div className="tips-grid">
                <div className="tip-card">
                  <Search className="h-5 w-5 text-sky-500 inline mr-1" />{" "}
                  <strong>Retrace Recent Locations</strong>
                  <br />
                  <br />
                  Carefully revisit the places you recently visited to help
                  locate missing items.
                </div>
                <div className="tip-card">
                  <MapPin className="h-5 w-5 text-red-500 inline mr-1" />{" "}
                  <strong>Check Nearby Areas</strong>
                  <br />
                  <br />
                  Inspect public spaces, offices, transportation stops, shops,
                  and common areas.
                </div>
                <div className="tip-card">
                  <Smartphone className="h-5 w-5 text-indigo-500 inline mr-1" />{" "}
                  <strong>Use Digital Tools</strong>
                  <br />
                  <br />
                  Post on forums, use FindTrack, check social media groups.
                </div>
                <div className="tip-card">
                  <CheckCircle2 className="h-5 w-5 text-green-500 inline mr-1" />{" "}
                  <strong>Act Quickly</strong>
                  <br />
                  <br />
                  Report and search within 2 hours for best results.
                </div>
                <div className="tip-card">
                  <Camera className="h-5 w-5 text-amber-500 inline mr-1" />{" "}
                  <strong>Add Photos</strong>
                  <br />
                  <br />
                  Upload a photo of your item for much faster identification.
                </div>
                <div className="tip-card">
                  <Bell className="h-5 w-5 text-pink-500 inline mr-1" />{" "}
                  <strong>Stay Updated</strong>
                  <br />
                  <br />
                  Receive updates and notifications about matched or recovered
                  items.
                </div>
                <div className="tip-card">
                  <PenTool className="h-5 w-5 text-slate-500 inline mr-1" />{" "}
                  <strong>Submit Detailed Reports</strong>
                  <br />
                  <br />
                  Provide accurate descriptions and item details for easier
                  identification.
                </div>
              </div>
            </section>

            <section
              id="packaging"
              className={`panel ${activeTab === "packaging" ? "active" : ""}`}
            >
              <div className="section-title">
                <Package className="h-5 w-5 inline mr-1 text-sky-500" />{" "}
                Packaging &amp; Handling Tips
              </div>
              <p className="section-subtitle">
                Best practices for securing found items
              </p>
              <div className="tips-grid">
                <div className="tip-card">
                  <ShieldCheck className="h-5 w-5 text-teal-500 inline mr-1" />{" "}
                  <strong>Protect Fragile Items</strong>
                  <br />
                  <br />
                  Use bubble wrap or padding for delicate objects.
                </div>
                <div className="tip-card">
                  <Package className="h-5 w-5 text-blue-500 inline mr-1" />{" "}
                  <strong>Seal Securely</strong>
                  <br />
                  <br />
                  Ensure items are properly contained before storage.
                </div>
                <div className="tip-card">
                  <Home className="h-5 w-5 text-indigo-500 inline mr-1" />{" "}
                  <strong>Classify Correctly</strong>
                  <br />
                  <br />
                  Hand keys and sensitive IDs straight to the Library security
                  safe desk.
                </div>
                <div className="tip-card">
                  <CheckCircle2 className="h-5 w-5 text-green-500 inline mr-1" />{" "}
                  <strong>Update Status</strong>
                  <br />
                  <br />
                  Mark items as claimed once they've been recovered.
                </div>
              </div>
            </section>

            <section
              id="about"
              className={`${activeTab === "about" ? "block" : "hidden"}`}
            >
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="mb-8">
                  <h2 className="font-headline-lg text-3xl font-bold text-on-surface">About &amp; Help</h2>
                  <p className="font-body-md text-on-surface-variant mt-2">Everything you need to know about FindTrack.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    {/* FAQ */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 md:p-8">
                      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <Info className="h-6 w-6 text-primary" /> Frequently Asked Questions
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="border-b border-outline-variant pb-6">
                          <h4 className="font-bold text-on-surface mb-2">How do I verify ownership?</h4>
                          <p className="text-on-surface-variant text-sm">When you claim a found item, you must correctly answer the secret security question set by the finder. Additionally, the finder may request further proof of ownership via contact before handing over the item.</p>
                        </div>
                        <div className="border-b border-outline-variant pb-6">
                          <h4 className="font-bold text-on-surface mb-2">What happens when an item is claimed?</h4>
                          <p className="text-on-surface-variant text-sm">Once an item is successfully claimed and verified, its status changes to 'Resolved'. Contact details are then shared securely between both parties to arrange the return.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface mb-2">Is FindTrack free to use?</h4>
                          <p className="text-on-surface-variant text-sm">Yes, FindTrack is completely free for all community members. Our mission is to restore trust and reunite lost items with their rightful owners.</p>
                        </div>
                      </div>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 md:p-8">
                      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" /> Community Guidelines
                      </h3>
                      <ul className="space-y-3 text-sm text-on-surface-variant">
                        <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Always meet in public, well-lit places when returning items.</li>
                        <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Do not share personal addresses or sensitive information until verified.</li>
                        <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Report any suspicious behavior or false claims immediately.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    {/* Contact Support */}
                    <div className="bg-primary text-on-primary rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mail className="h-8 w-8" />
                        </div>
                        <h3 className="font-headline-md text-xl font-bold mb-2">Need More Help?</h3>
                        <p className="text-sm text-on-primary/90 mb-6">Our support team is ready to assist you with any issues or disputes.</p>
                        <a href="mailto:novapulsarsupport@gmail.com" className="inline-block w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-surface-variant transition-colors shadow-sm">
                          Contact Support
                        </a>
                      </div>
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* App Info */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 text-center">
                      <div className="w-12 h-12 bg-surface-variant rounded-xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">✨</span>
                      </div>
                      <h4 className="font-bold text-on-surface">FindTrack</h4>
                      <p className="text-xs text-on-surface-variant mt-1 mb-4">Version 2.0.0 (Beta)</p>
                      <div className="flex justify-center gap-4 text-xs font-bold text-primary">
                        <button onClick={() => setCurrentView('privacy')}>Privacy Policy</button>
                        <span>&bull;</span>
                        <button onClick={() => setCurrentView('terms')}>Terms of Service</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
</main>

          {/* MOBILE HUD BOTTOM NAV */}
          <nav className="bottom-nav" id="bottomNav">
            <button
              onClick={() => {
                setActiveTab("home");
                setCategoryKeywords(null);
              }}
              className={`bnav-btn ${activeTab === "home" ? "active" : ""}`}
            >
              <span className="bnav-icon">
                <Home className="h-5 w-5" />
              </span>
              Home
            </button>
            <button
              onClick={() => {
                setActiveTab("search");
                setCategoryKeywords(null);
              }}
              className={`bnav-btn ${activeTab === "search" ? "active" : ""}`}
            >
              <span className="bnav-icon">
                <Search className="h-5 w-5" />
              </span>
              Search
            </button>
            <button
              onClick={() => {
                if (profileName === "Guest") {
                  setShowGuestModal(true);
                } else {
                  setActiveTab("notifications");
                }
              }}
              className={`bnav-btn ${activeTab === "notifications" ? "active" : ""}`}
            >
              <span className="bnav-icon">
                <Bell className="h-5 w-5" />
              </span>
              Alerts
            </button>
            <button
              onClick={() => {
                setActiveTab("profile");
              }}
              className={`bnav-btn ${activeTab === "profile" ? "active" : ""}`}
            >
              <span className="bnav-icon">
                <UserIcon className="h-5 w-5" />
              </span>
              Profile
            </button>
          </nav>

          {/* MOBILE REPORT INSTANT FAB */}
          <button
            onClick={() => {
              if (profileName === "Guest") {
                setShowGuestModal(true);
              } else {
                setActiveTab("report");
              }
            }}
            className="report-fab"
            title="Report Item"
          >
            <Package className="h-6 w-6 text-white" />
          </button>
          </div>
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
                  className={`onboard-pip ${idx < onboardStep ? "done" : idx === onboardStep ? "active" : ""}`}
                ></div>
              ))}
            </div>

            <div className="onboard-visual">
              <div className="onboard-icon-wrap" id="onboardIcon">
                {ONBOARD_STEPS[onboardStep].icon}
              </div>
            </div>

            <div className="onboard-body">
              <div className="onboard-step-label" id="onboardLabel">
                {ONBOARD_STEPS[onboardStep].label}
              </div>
              <div className="onboard-title" id="onboardTitle">
                {ONBOARD_STEPS[onboardStep].title}
              </div>
              <div className="onboard-desc" id="onboardDesc">
                {ONBOARD_STEPS[onboardStep].desc}
              </div>

              <div className="onboard-actions">
                <button
                  onClick={() => {
                    if (onboardStep < ONBOARD_STEPS.length - 1) {
                      setOnboardStep((prev) => prev + 1);
                    } else {
                      setShowOnboarding(false);
                      localStorage.setItem("ft_onboarded", "1");
                    }
                  }}
                  className="onboard-next"
                  id="onboardNext"
                >
                  {onboardStep === ONBOARD_STEPS.length - 1
                    ? "Get Started 🚀"
                    : "Next →"}
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
          <button className="zoom-close" onClick={() => setZoomImg(null)}>
            ✕
          </button>
          <img src={zoomImg} className="zoom-img" alt="Zoom view" />
          <div className="zoom-hint">Tap anywhere to close</div>
        </div>
      )}

      {/* ── GUEST ACCESS LOCK LOGIN REQUIRED MODAL ── */}
      {showGuestModal && (
        <div
          id="guestModal"
          className="modal"
          onClick={(e) => {
            if ((e.target as HTMLElement).id === "guestModal")
              setShowGuestModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-icon">🔒</div>
            <h2>Login Required</h2>
            <p>
              Please login or sign up to unlock the full features of FindTrack!
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  setShowGuestModal(false);
                  setCurrentView("login");
                }}
                className="modal-btn primary"
              >
                <Lock className="h-4 w-4 inline mr-1" /> Login
              </button>
              <button
                onClick={() => {
                  setShowGuestModal(false);
                  setCurrentView("signup");
                }}
                className="modal-btn secondary"
              >
                <UserPlus className="h-4 w-4 inline mr-1" /> Sign Up
              </button>
            </div>
            <button
              onClick={() => setShowGuestModal(false)}
              className="modal-close"
            >
              Maybe later
            </button>
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

  const textA =
    `${a.title} ${a.desc || a.description || ""} ${a.location}`.toLowerCase();
  const textB =
    `${b.title} ${b.desc || b.description || ""} ${b.location}`.toLowerCase();

  const stopWords = new Set([
    "a",
    "an",
    "the",
    "my",
    "i",
    "is",
    "at",
    "in",
    "on",
    "of",
    "and",
    "or",
    "was",
    "it",
    "this",
    "that",
    "with",
    "for",
    "to",
  ]);
  const tokenise = (t: string) =>
    t
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

  const tA = new Set(tokenise(textA));
  const tB = new Set(tokenise(textB));
  if (tA.size === 0 || tB.size === 0) return 0;

  let shared = 0;
  tA.forEach((w) => {
    if (tB.has(w)) shared++;
  });

  // Jaccard similarity
  const union = new Set([...Array.from(tA), ...Array.from(tB)]).size;
  const jaccard = shared / union;

  // Location bonus
  const locA = (a.location || "").toLowerCase();
  const locB = (b.location || "").toLowerCase();
  const locBonus =
    locA &&
    locB &&
    (locA.includes(locB.slice(0, 5)) || locB.includes(locA.slice(0, 5)))
      ? 0.15
      : 0;

  return Math.min(1, jaccard + locBonus);
}
