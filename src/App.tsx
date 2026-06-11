import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  where
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, loginWithGoogle, OperationType } from './firebase';
import { Item, ItemType, Category, ItemStatus } from './types';
import Header from './components/Header';
import ItemCard from './components/ItemCard';
import ItemDetail from './components/ItemDetail';
import SubmissionForm from './components/SubmissionForm';
import AuthModal from './components/AuthModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Radio, 
  AlertCircle,
  Database,
  Grid,
  Info
} from 'lucide-react';

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'keys', label: 'Keys' },
  { value: 'wallet', label: 'Wallets & Cash' },
  { value: 'documents', label: 'Documents' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'bags', label: 'Bags & Luggage' },
  { value: 'others', label: 'Others' }
];

export default function App() {
  // Authentication & Session state
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Firestore Sync item list
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  const hideSkeleton = () => setShowSkeleton(false);

  // Search & Filtering controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('active');

  // Modal / Selection overlays
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Dynamic user matching stats (Live updates)
  const [seeding, setSeeding] = useState<boolean>(false);

  // 1. Listen to Authentication State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // 2. Real-time Firestore Sync for tracking items
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoadingItems(false);
      hideSkeleton();
      return;
    }

    const path = 'items';
    setLoadingItems(true);
    setFirestoreError(null);

    let unsubscribe = () => {};

    try {
      const itemsCollection = collection(db, path);
      // Query securely filtered by current user's ID to respect Firestore security rules.
      // We do NOT use orderBy('createdAt') in the Firestore query to prevent Firebase index restriction warnings,
      // and instead perform highly efficient in-memory sorting of the results downstream.
      const itemsQuery = query(itemsCollection, where('userId', '==', user.uid));

      unsubscribe = onSnapshot(
        itemsQuery,
        (snapshot) => {
          try {
            const fetchedItems: Item[] = [];
            snapshot.forEach((docSnap) => {
              fetchedItems.push({ id: docSnap.id, ...docSnap.data() } as Item);
            });
            // Perform in-memory sorting securely and reliably
            fetchedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setItems(fetchedItems);
          } catch (err) {
            console.error('Snapshot parsing error:', err);
            setFirestoreError('Failed parsing registry entries.');
          } finally {
            setLoadingItems(false);
            hideSkeleton();
          }
        },
        (error) => {
          console.error('Firestore real-time sync failure:', error);
          setLoadingItems(false);
          setFirestoreError('Access is restricted or Firebase rules denied the read index query.');
          try {
            handleFirestoreError(error, OperationType.LIST, path);
          } catch (handlerErr) {
            // Error logged and rethrown
          } finally {
            hideSkeleton();
          }
        }
      );
    } catch (error) {
      console.error('Subscription setup failed:', error);
      setFirestoreError('Failed to establish secure real-time listener.');
      setLoadingItems(false);
      hideSkeleton();
    }

    return () => {
      unsubscribe();
    };
  }, [user]);

  // 3. Database Write operation: Create Item
  const handleCreateItem = async (itemData: {
    type: ItemType;
    title: string;
    description: string;
    category: Category;
    location: string;
    contactName: string;
    contactInfo: string;
    date: string;
    imageUrl?: string;
  }) => {
    if (!user) {
      throw new Error('You must be registered and signed in to publish items.');
    }

    const path = 'items';
    const cleanId = doc(collection(db, path)).id; // Safe alphanumeric ID
    const currentTimeString = new Date().toISOString();

    const fullItemObj: Item = {
      ...itemData,
      id: cleanId,
      userId: user.uid,
      status: 'active',
      createdAt: currentTimeString,
      updatedAt: currentTimeString,
    };

    try {
      await setDoc(doc(db, path, cleanId), fullItemObj);
      console.log('Item created successfully:', cleanId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${cleanId}`);
    }
  };

  // 4. Database Write operation: Resolve items in matchmaker
  const handleResolveItem = async (itemId: string, matchingItemId: string) => {
    const path1 = `items/${itemId}`;
    const path2 = `items/${matchingItemId}`;
    const currentTimeString = new Date().toISOString();

    try {
      // Resolve caller item
      await updateDoc(doc(db, 'items', itemId), {
        status: 'resolved',
        updatedAt: currentTimeString,
      });

      // Resolve linked item
      await updateDoc(doc(db, 'items', matchingItemId), {
        status: 'resolved',
        updatedAt: currentTimeString,
      });

      // If the selected item itself is currently being viewed, update its visual model too
      if (selectedItem?.id === itemId) {
        setSelectedItem((prev) => prev ? { ...prev, status: 'resolved' } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path1);
    }
  };

  // 5. Database Write operation: Delete listing
  const handleDeleteItem = async (itemId: string) => {
    const path = `items/${itemId}`;
    try {
      await deleteDoc(doc(db, 'items', itemId));
      console.log('Item deleted successfully:', itemId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // 6. Quality-of-life Feature: Interactive sandbox populator
  const seedPlaygroundData = async () => {
    if (!user) {
      alert('Please sign in first to seed records on your account.');
      return;
    }

    setSeeding(true);
    const mockItems = [
      {
        type: 'lost' as ItemType,
        title: 'Leather Zipper Bi-fold Wallet',
        category: 'wallet' as Category,
        description: 'Brown distress leather wallet with a zipper containing a driver license under the name Carl Jayan, transit tokens, and family photocard. Incredibly important heirloom.',
        location: 'Central Station Terminal Entrance near subway stairs',
        contactName: 'Carl Jayan',
        contactInfo: 'carl@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200'
      },
      {
        type: 'found' as ItemType,
        title: 'Distressed Brown Zip Wallet',
        category: 'wallet' as Category,
        description: 'Found a luxury distressed brown leather wallet. Zippered enclosing, containing local transit card and personal ID inside. Handed over to Central Lost & Found help desk.',
        location: 'Platform 3 Central Station Subway',
        contactName: 'Help Desk Staff',
        contactInfo: '+1 (555) 901-2104',
        imageUrl: 'https://images.unsplash.com/photo-1549923366-c87ebb14585f?auto=format&fit=crop&q=80&w=200'
      },
      {
        type: 'lost' as ItemType,
        title: 'Space Gray Aluminum MacBook Air 13',
        category: 'electronics' as Category,
        description: 'MacBook Air with dual USB-C ports on left, stickers on back (Google developer logo and a green turtle stickers). Serial No starts with C50F. Lost inside a gray felt pouch.',
        location: 'University Library East Wing 2nd Floor desk',
        contactName: 'Marcus Hall',
        contactInfo: 'marcus@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=200'
      },
      {
        type: 'found' as ItemType,
        title: 'Apple MacBook Laptop inside felt bag',
        category: 'electronics' as Category,
        description: 'Found a sleek silver/space-gray Apple laptop left behind on quiet study cubicle. Contains programming stickers on back shell. Logged under security safe.',
        location: 'Library Main Hall reception desk',
        contactName: 'Security Desk',
        contactInfo: '+1 (555) 700-1122'
      },
      {
        type: 'lost' as ItemType,
        title: 'Brass House Keys with Leather Strap',
        category: 'keys' as Category,
        description: 'Three metal keys: one gold brass house key, two Yale silver padlocks. Held together by a dark brown woven leather loop strap.',
        location: 'Patterson Park walking sidewalk near playground',
        contactName: 'Sara Vance',
        contactInfo: 'sara.v@example.com'
      }
    ];

    try {
      for (const mock of mockItems) {
        const fileId = doc(collection(db, 'items')).id;
        const creationTime = new Date(Date.now() - Math.random() * 86400000).toISOString();
        await setDoc(doc(db, 'items', fileId), {
          ...mock,
          id: fileId,
          userId: user.uid,
          status: 'active',
          date: new Date().toISOString(),
          createdAt: creationTime,
          updatedAt: creationTime
        });
      }
    } catch (err) {
      console.error('Core seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  // 7. Filter items list dynamically based on criteria
  const filteredItems = items.filter((item) => {
    // 1. Text Search matching
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(searchLow) ||
      item.description.toLowerCase().includes(searchLow) ||
      item.location.toLowerCase().includes(searchLow) ||
      item.contactName.toLowerCase().includes(searchLow);

    // 2. Type Filter (Lost, Found, All)
    const matchesType = selectedType === 'all' || item.type === selectedType;

    // 3. Category Filter
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    // 4. Status Filter (Active, Resolved, All)
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Calculate stats
  const activeLostCount = items.filter(i => i.type === 'lost' && i.status === 'active').length;
  const activeFoundCount = items.filter(i => i.type === 'found' && i.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" id="main-workflow-app">
      {/* Header component */}
      <Header
        user={user}
        loadingAuth={loadingAuth}
        onOpenNewItemModal={() => {
          if (user) {
            setIsNewItemModalOpen(true);
          } else {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }
        }}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Pitch Hero layout banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-indigo-900">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Radio className="h-40 w-40 animate-pulse text-indigo-200" />
          </div>
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/25 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enhanced with Gemini Flash AI Models</span>
            </span>
            <h2 className="font-sans text-2xl md:text-3xl font-extrabold tracking-tight">
              Reuniting Belongings, Intelligently.
            </h2>
            <p className="font-sans text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
              FindTrack brings Zero-Trust Firestore database safety and Gemini's cognitive analysis together. 
              Upload a snapshot of lost property to auto-extract details, and let our AI Matchmaker calculate exact overlap probabilities instantly!
            </p>
          </div>
        </div>

        {/* Dashboard statistics counters bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-4 shrink-0">
            <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold text-rose-500">Active lost filings</span>
            <p className="font-mono text-2xl font-bold text-rose-700 mt-1">{loadingItems ? '...' : activeLostCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/15 p-4 shrink-0">
            <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">Active found logs</span>
            <p className="font-mono text-2xl font-bold text-emerald-700 mt-1">{loadingItems ? '...' : activeFoundCount}</p>
          </div>
          <div className="rounded-xl border border-indigo-150 bg-indigo-50/10 p-4 shrink-0">
            <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold text-indigo-600">Total item repository</span>
            <p className="font-mono text-2xl font-bold text-indigo-900 mt-1">{loadingItems ? '...' : items.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shrink-0">
            <span className="font-sans text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Resolved Reunites</span>
            <p className="font-mono text-2xl font-bold text-slate-800 mt-1">
              {loadingItems ? '...' : items.filter(i => i.status === 'resolved').length}
            </p>
          </div>
        </div>

        {/* Filtering & Listing Controls */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-5 flex-shrink-0" id="filters-panel">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span>Search Filters</span>
                </span>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedCategory('all');
                    setSelectedStatus('active');
                  }}
                  className="font-sans text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Clear All
                </button>
              </div>

              {/* Text Search Input */}
              <div className="space-y-1">
                <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Keywords</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Title, description..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 font-sans text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-1">
                <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['all', 'lost', 'found'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`py-1 rounded text-center font-sans text-[10px] font-semibold tracking-wide uppercase transition capitalize ${
                        selectedType === t 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-sans text-xs text-slate-800 focus:outline-none capitalize"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector active vs resolved */}
              <div className="space-y-1">
                <label className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ItemStatus | 'all')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-sans text-xs text-slate-800 focus:outline-none capitalize"
                >
                  <option value="active">Active Trackings</option>
                  <option value="resolved">Resolved items</option>
                  <option value="all">All listings</option>
                </select>
              </div>
            </div>

            {/* Sandbox Seeding Panel (Appears when database has no listings) */}
            {items.length === 0 && !loadingItems && user && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center space-y-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-slate-900">Seed Sandbox Dataset</h4>
                  <p className="font-sans text-[10px] text-slate-500 leading-normal mt-0.5">
                    Your database is currently empty. Seed sandbox records directly to explore dynamic matching!
                  </p>
                </div>
                <button
                  onClick={seedPlaygroundData}
                  disabled={seeding}
                  className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-[10px] font-bold py-1.5 flex items-center justify-center space-x-1 border shadow-sm transition disabled:opacity-40"
                >
                  {seeding ? 'Syncing...' : 'Provision Samples'}
                </button>
              </div>
            )}
          </aside>

          {/* Grid list block */}
          <section className="flex-1 w-full" id="items-grid-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Grid className="h-4 w-4 text-slate-400" />
                <span>Found Registry Results ({filteredItems.length})</span>
              </h3>
            </div>

            {firestoreError && (
              <div className="flex items-start bg-rose-50 border border-rose-100 rounded-lg p-4 font-sans text-xs text-rose-800 space-x-2.5 mb-5 shadow-sm">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold">Sync warning</p>
                  <p className="leading-relaxed mt-0.5">{firestoreError}</p>
                </div>
              </div>
            )}

            {loadingItems || showSkeleton ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3" id="skeleton-loader">
                <Database className="h-8 w-8 text-indigo-500 animate-bounce" />
                <p className="font-sans text-xs font-medium text-slate-400">Synchronizing database indices...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-slate-200 rounded-2xl bg-white border-dashed">
                <Search className="h-9 w-9 text-slate-300 mb-2" />
                <p className="font-sans text-sm font-bold text-slate-800">No Registry Entries Found</p>
                <p className="font-sans text-xs text-slate-400 max-w-xs text-center mt-1">
                  We couldn't locate any matching records. Try modifying search keywords, categories, or sign in to submit a new entry.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={(clicked) => setSelectedItem(clicked)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* --- Overlay Modals --- */}
      <AnimatePresence>
        {/* Item Detail View Modular Overlay */}
        {selectedItem && (
          <ItemDetail
            item={selectedItem}
            currentUserUid={user?.uid}
            onClose={() => setSelectedItem(null)}
            allOppositeItems={items.filter((i) => i.type !== selectedItem.type && i.id !== selectedItem.id)}
            onResolveItem={handleResolveItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {/* New Item Submission Form Modal Overlay */}
        {isNewItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl my-8"
            >
              <SubmissionForm
                onSubmit={handleCreateItem}
                onClose={() => setIsNewItemModalOpen(false)}
                defaultContactName={user?.displayName || ''}
              />
            </motion.div>
          </div>
        )}

        {/* Custom Login and Signup Modal Overlay (Representing login.html and signup.html designs) */}
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
            }}
            initialMode={authModalMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
