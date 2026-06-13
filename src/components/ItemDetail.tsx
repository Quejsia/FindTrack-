import React, { useState, useEffect, useRef } from 'react';
import { Item, Claim } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryIcon } from './ItemCard';
import Matchmaker from './Matchmaker';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  setDoc, 
  doc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDoc,
  addDoc,
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  User, 
  PhoneCall, 
  FileClock, 
  Lock, 
  Trash2, 
  Loader2,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  Send,
  Radio
} from 'lucide-react';

interface ItemDetailProps {
  item: Item;
  onClose: () => void;
  allOppositeItems: Item[]; 
  onResolveItem: (itemId: string, matchingItemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  currentUserUid?: string;
  onStartChat?: (otherUserUid: string, itemId: string) => void;
}

export default function ItemDetail({
  item,
  onClose,
  allOppositeItems,
  onResolveItem,
  onDeleteItem,
  currentUserUid,
  onStartChat,
}: ItemDetailProps) {
  const [deleting, setDeleting] = useState(false);
  const [openClaimModal, setOpenClaimModal] = useState(false);
  const [claimView, setClaimView] = useState(false);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimQuestion, setClaimQuestion] = useState('Enter your question here...');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimErrorObj, setClaimErrorObj] = useState<string | null>(null);

  // Real-time Claims tracking
  const [existingClaim, setExistingClaim] = useState<Claim | null>(null);
  const [fetchingClaim, setFetchingClaim] = useState(false);
  const [activeView, setActiveView] = useState<'details' | 'chat'>('details');

  const isOwner = item.userId === currentUserUid;
  const isResolved = item.status === 'resolved';

  const hasSecurityQuestion = !!item.securityQuestion && item.securityQuestion.trim().length > 0;

  // Sync claim state
  useEffect(() => {
    if (!currentUserUid || !item.id || isOwner) {
      setExistingClaim(null);
      return;
    }
    setFetchingClaim(true);
    const claimsRef = collection(db, 'claims');
    const q = query(claimsRef, where('itemId', '==', item.id), where('claimerId', '==', currentUserUid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFetchingClaim(false);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setExistingClaim({ id: docSnap.id, ...docSnap.data() } as Claim);
      } else {
        setExistingClaim(null);
      }
    }, (err) => {
      console.error("Error setting up claim onSnapshot:", err);
      setFetchingClaim(false);
    });

    return () => unsubscribe();
  }, [item.id, currentUserUid, isOwner]);

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedPostedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Just now';

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this listing?')) return;
    setDeleting(true);
    try {
      await onDeleteItem(item.id);
      onClose();
    } catch (err) {
      console.error('Delete click exception:', err);
      alert('Failed to delete registry entry.');
    } finally {
      setDeleting(false);
    }
  };

  const handleClaimSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUserUid) return;

    setSubmittingClaim(true);
    setClaimErrorObj(null);

    const claimId = `claim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const claimsPath = `claims/${claimId}`;

    try {
      const claimPayload: Claim = {
        id: claimId,
        itemId: item.id,
        itemTitle: item.title,
        imageUrl: item.imageUrl || '',
        claimerId: currentUserUid,
        claimerName: auth.currentUser?.displayName || 'Representative Name',
        claimerEmail: auth.currentUser?.email || '',
        claimerContact: auth.currentUser?.phoneNumber || '',
        finderId: item.userId,
        securityQuestion: item.securityQuestion || 'Please verify physical details for item ownership confirmation.',
        providedAnswer: claimAnswer.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'claims', claimId), {
        ...claimPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setClaimAnswer('');
      setOpenClaimModal(false);
      setClaimView(false);
    } catch (err: any) {
      console.error("Failed to post claim:", err);
      setClaimErrorObj(err.message || String(err));
      try {
        handleFirestoreError(err, OperationType.WRITE, claimsPath);
      } catch (e) {}
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Check if contact info should be hidden under security rules
  const isCredentialsLocked = hasSecurityQuestion && !isOwner && (!existingClaim || existingClaim.status !== 'approved');

  if (claimView) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="dedicated-claim-page">
        <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
          
          {/* THE HEADER: Keep the teal "Log Ownership Claim / Prove-It Verification Layer" header clean and isolated at the top. */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-500 text-white shrink-0">
            <div className="flex flex-col">
              <span className="text-base font-bold text-white leading-tight">Log Ownership Claim</span>
              <span className="text-teal-105 text-xs font-mono">Prove-It Verification Layer</span>
            </div>
            <button
              type="button"
              onClick={() => setClaimView(false)}
              className="text-white hover:text-teal-100 bg-teal-800/40 hover:bg-teal-800/60 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
            >
              ← Back
            </button>
          </div>

          {/* MAIN WRAPPER: Use a clean vertical flex container with proper padding so elements don't collide */}
          <div className="p-5 flex flex-col gap-4 w-full overflow-y-auto bg-slate-50">
            
            {/* ITEM SUMMARY CARD */}
            <div className="bg-white rounded-md p-4 border border-slate-200 shadow-sm border-l-4 border-l-teal-500">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1">🏷️ Current Claim Item</span>
              <h4 className="text-base font-bold text-slate-800">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{item.location} · {formattedDate}</p>
            </div>

            <div className="bg-amber-50 rounded-2xl shadow-sm p-4 border-l-4 border-amber-400">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                ⚠️ Ownership Challenge
              </p>
              <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                Describe how we can verify that this item belongs to you.
              </p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Specify any unique decals, stickers, contents, or circumstances where it was lost/found.
              </p>
            </div>

            {/* RESTORED ANSWER INPUT: Bring back the label and the spacious text input area. */}
            <div className="flex flex-col gap-2">
              <label htmlFor="claim-answer-textarea" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                YOUR VERIFICATION ANSWER *
              </label>
              <textarea
                id="claim-answer-textarea"
                rows={5}
                value={claimAnswer}
                onChange={(e) => setClaimAnswer(e.target.value)}
                placeholder="Provide your exact verification answer or physical proof details here in as much descriptive precision as possible..."
                className="rounded-md border border-slate-300 p-4 w-full focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm text-slate-800 placeholder-slate-400 bg-white shadow-sm leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 italic">
                The finder will inspect this proof and action your contact credentials request.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={claimQuestion}
                onChange={(e) => setClaimQuestion(e.target.value)}
                className="rounded-md border border-slate-300 p-4 w-full focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm text-slate-800 bg-white shadow-sm leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 italic">
                The finder will answer this question to verify your claim.
              </p>
            </div>

            {/* TIPS CARD */}
            <div className="bg-blue-50/60 border border-blue-150 rounded-md p-4 space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">💡 Tips for a strong claim</span>
              <p className="text-xs text-slate-650 leading-relaxed">• State items inside (e.g. specific cards, quantity of cash, etc.)</p>
              <p className="text-xs text-slate-650 leading-relaxed">• Mention distinct scratches, custom keychains, stickers, or wallpaper setups</p>
              <p className="text-xs text-slate-650 leading-relaxed">• State the exact date, time range and place you lost or found it</p>
            </div>

            {claimErrorObj && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs font-semibold">
                ❌ {claimErrorObj}
              </div>
            )}

            {/* CLEAN BUTTON LAYOUT: Move the "Cancel" and "✅ Submit Answer" buttons BELOW the text input area. */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setClaimView(false)}
                className="px-5 py-3 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm transition active:scale-95 duration-150 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingClaim || !claimAnswer.trim()}
                onClick={() => handleClaimSubmit()}
                className="flex-1 px-5 py-3 rounded-md bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 duration-150"
              >
                {submittingClaim ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>✅ Submit Answer</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="item-details-drawer">
      <motion.div
        layoutId={`card-container-${item.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-2xl overflow-hidden rounded-md bg-white shadow-2xl transition-all duration-300 ${
          activeView === 'chat' 
            ? 'h-[85vh] sm:h-[600px] flex flex-col justify-between' 
            : 'h-auto pb-6'
        }`}
      >
        {activeView === 'details' ? (
          <>
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-teal-600 font-semibold text-sm px-4 py-3"
            >
              ← Back to Results
            </button>

            {/* Header Ribbon */}
            <div className={`p-4 flex items-center justify-between border-b ${
              item.type === 'lost' 
                ? 'bg-rose-50/50 border-rose-100 text-rose-800' 
                : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
            }`}>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold font-sans uppercase ${
                  item.type === 'lost' ? 'bg-rose-100' : 'bg-emerald-100'
                }`}>
                  {item.type}
                </span>
                <span className="font-mono text-xs text-slate-500 font-semibold tracking-wide capitalize">
                  {item.category} Registry Item
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
              
              {/* Hero Banner Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Left side: Photo or placeholder */}
                <div className="sm:col-span-1">
                  {item.imageUrl ? (
                    <div className="relative aspect-square w-full rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className={`aspect-square w-full rounded-md border flex flex-col items-center justify-center ${
                      item.type === 'lost' 
                        ? 'bg-rose-50/50 border-rose-100 text-rose-500' 
                        : 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
                    }`}>
                      {getCategoryIcon(item.category, "h-12 w-12")}
                      <span className="font-mono text-[9px] font-bold text-slate-400 mt-2 uppercase">{item.category}</span>
                    </div>
                  )}
                </div>

                {/* Right side: Summary Details */}
                <div className="sm:col-span-2 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-sans text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="font-sans text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Status and metadata tags */}
                  <div className="grid grid-cols-2 gap-3 text-slate-600 font-sans text-xs">
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] text-slate-400 uppercase font-semibold">Location</p>
                        <p className="font-sans font-medium text-slate-800 truncate">{item.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="font-sans text-[10px] text-slate-400 uppercase font-semibold">Date Logged</p>
                        <p className="font-sans font-medium text-slate-800">{formattedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details (PII Privacy-first protection) */}
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50" id="contact-credentials">
                <h4 className="font-sans text-xs font-bold text-slate-700 tracking-wider uppercase mb-3 flex items-center space-x-1">
                  <User className="h-3.5 w-3.5" />
                  <span>Contact Credentials</span>
                </h4>

                {currentUserUid ? (
                  <div>
                    {isOwner ? (
                      /* OWNER VIEW */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shrink-0">
                            {item.contactName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-sans text-[10px] text-slate-400 font-medium">Reporter (Your Listing)</p>
                            <p className="font-sans text-xs text-slate-800 font-bold">{item.contactName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                            <PhoneCall className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-sans text-[10px] text-slate-400 font-medium">Method of contact</p>
                            <p className="font-sans text-xs text-slate-800 font-bold truncate">{item.contactInfo}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* NON-OWNER VIEW (ZERO TRUST SHIELD) */
                      <div>
                        {isCredentialsLocked ? (
                          /* Mask PII Details behind claims block */
                          <div className="space-y-4">
                            <div className="flex items-start space-x-3 bg-white p-3.5 rounded-md border border-slate-200/60 shadow-sm">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 shrink-0 border border-indigo-100">
                                <Lock className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="font-sans text-xs font-bold text-slate-800">PII Privacy Lock Active</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                                  This listing requires answering a verification question. Submit a claim demonstrating you are the true owner to unlock contact credentials.
                                </p>
                              </div>
                            </div>

                            {/* Claims progress or claim submission button */}
                            {existingClaim ? (
                              <div className="p-4 bg-white border border-slate-200/80 rounded-md shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wide">
                                    Claim Response History
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                    existingClaim.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {existingClaim.status}
                                  </span>
                                </div>

                                <p className="font-sans text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-md border border-slate-100 leading-relaxed italic">
                                  "{existingClaim.securityQuestion}"
                                </p>
                                
                                <p className="text-[11px] text-slate-600 font-semibold font-sans">
                                  🔑 Your submitted answer: <span className="font-normal font-sans italic text-slate-500">"{existingClaim.providedAnswer}"</span>
                                </p>

                                <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    {existingClaim.status === 'pending' 
                                      ? 'Under review by the reporter. You can message them to expedite verification.' 
                                      : 'Declined by reporter. Double check your details and try re-submitting if needed.'}
                                  </p>
                                </div>
                                
                                <div className="flex flex-col space-y-3 w-full pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onStartChat) {
                                        onStartChat(item.userId, item.id);
                                        onClose();
                                      }
                                    }}
                                    className="w-full flex items-center justify-center space-x-1.5 bg-teal-850 hover:bg-teal-900 border border-teal-800 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-md shadow-md cursor-pointer transition active:scale-95 duration-200"
                                  >
                                    <MessageSquare className="h-4 w-4 shrink-0 text-white/90" />
                                    <span>Message Finder</span>
                                  </button>
                                  
                                  {existingClaim.status === 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => setClaimView(true)}
                                      className="w-full flex items-center justify-center space-x-1.5 py-3.5 px-4 rounded-md bg-slate-900 text-white font-sans text-xs font-bold hover:bg-slate-800 transition active:scale-95 duration-200 cursor-pointer shadow-md"
                                    >
                                      <ShieldQuestion className="h-4 w-4 text-emerald-400 shrink-0" />
                                      <span>Submit Custom Proof</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Open submit claim trigger buttons */
                              <div className="flex flex-col space-y-3.5 w-full pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onStartChat) {
                                      onStartChat(item.userId, item.id);
                                      onClose();
                                    }
                                  }}
                                  className="w-full flex items-center justify-center space-x-1.5 bg-teal-850 hover:bg-teal-900 border border-teal-800 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-md shadow-md cursor-pointer transition active:scale-95 duration-200"
                                >
                                  <MessageSquare className="h-4 w-4 shrink-0 text-white/90" />
                                  <span>Message Finder</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setClaimView(true)}
                                  className="w-full flex items-center justify-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50/50 text-slate-700 font-sans text-xs font-bold py-3.5 px-4 rounded-md shadow-sm cursor-pointer transition active:scale-95 duration-200"
                                >
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                                  <span>Prove Ownership & Claim</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* UNLOCKED VIEW (Approved Claim or No Questions registered) */
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                              <div className="flex items-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shrink-0">
                                  {item.contactName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-sans text-[10px] text-slate-400 font-medium">Reporter</p>
                                  <p className="font-sans text-xs text-slate-800 font-bold">{item.contactName}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                                  <PhoneCall className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-sans text-[10px] text-slate-400 font-medium">Contact Coordinates</p>
                                  <p className="font-sans text-xs text-slate-800 font-bold truncate">{item.contactInfo}</p>
                                </div>
                              </div>
                            </div>

                            {existingClaim?.status === 'approved' && (
                              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md p-3 text-emerald-800 font-sans text-xs">
                                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                                <p className="font-medium text-[11px] leading-snug">
                                  <strong>Proof Approved:</strong> The reporter authenticated your answer. Safe transactions are unlocked!
                                </p>
                              </div>
                            )}

                            <div className="flex flex-col space-y-3 w-full pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onStartChat) {
                                    onStartChat(item.userId, item.id);
                                    onClose();
                                  }
                                }}
                                className="w-full flex items-center justify-center space-x-1.5 bg-teal-850 hover:bg-teal-900 border border-teal-800 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-md shadow-md cursor-pointer transition active:scale-95 duration-200"
                              >
                                <MessageSquare className="h-4 w-4 shrink-0 text-white/95" />
                                <span>Direct Chat Room</span>
                              </button>

                              {!existingClaim && (
                                <button
                                  type="button"
                                  onClick={() => setClaimView(true)}
                                  className="w-full flex items-center justify-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50/50 text-slate-700 font-sans text-xs font-bold py-3.5 px-4 rounded-md shadow-sm cursor-pointer transition active:scale-95 duration-200"
                                >
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                                  <span>Log Ownership Claim</span>
                                </button>
                              )}
                              
                              {existingClaim && existingClaim.status !== 'approved' && (
                                <div className="py-2.5 text-center font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100 uppercase tracking-wider">
                                  ✓ Claim Status: {existingClaim.status}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-500 font-sans text-xs space-y-1.5">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <p className="font-bold text-slate-800">Credentials Layer Locked</p>
                    <p className="text-[11px] leading-relaxed max-w-sm mx-auto">
                      For PII privacy preservation, contact information can only be viewed by authenticated users. Please sign in with your account to access details.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Matchmaker Panel (Active entries only) */}
              {!isResolved && (
                <div className="mt-6 border border-slate-100 bg-slate-50/80 p-4 rounded-md animate-fade-in" id="gemini-matchmaker-container">
                  <Matchmaker
                    item={item}
                    allOppositeItems={allOppositeItems}
                    onResolveItem={onResolveItem}
                    userUid={currentUserUid}
                  />
                </div>
              )}

              {/* Technical Metadata logs */}
              <div className="flex flex-wrap items-center justify-between text-slate-400 font-sans text-[10px] pt-4 border-t border-slate-100 gap-2">
                <span className="flex items-center gap-1 uppercase font-semibold">
                  <FileClock className="h-3.5 w-3.5 text-slate-350" />
                  <span>Registered: {formattedPostedDate}</span>
                </span>

                {/* Owner controls: allow Delete */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center space-x-1 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                  >
                    {deleting ? (
                      <Loader2 className="h-3 animate-spin w-3" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span className="font-bold">Delete Entry</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          currentUserUid && (
            <div className="w-full h-full flex flex-col" id="embedded-chat-view" style={{ minHeight: '350px' }}>
              <ChatView
                chatId={[currentUserUid, item.userId, item.id].sort().join("_")}
                currentUserUid={currentUserUid}
                itemTitle={item.title}
                otherUserId={item.userId}
                reporterName={item.contactName}
                onBack={() => setActiveView('details')}
              />
            </div>
          )
        )}
      </motion.div>

      {/* ── CLAIMS VERIFICATION MODAL COHESIVE WITH OUR STYLE (Item 2) ── */}
      <AnimatePresence>
        {openClaimModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4" id="claims-verification-modal">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-2xl border border-slate-150"
            >
              <div className="bg-gradient-to-tr from-teal-800 to-indigo-950 p-6 text-white relative">
                <button 
                  type="button"
                  onClick={() => setOpenClaimModal(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
                
                <div className="flex items-center space-x-2 text-teal-300 font-mono text-[9px] font-bold tracking-wider uppercase mb-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                  <span>Interactive Proof Shield</span>
                  <span className="h-1 w-1 rounded-full bg-teal-400"></span>
                  <span>Prove Ownership</span>
                </div>
                
                <h3 className="font-sans text-lg font-bold">"Prove It" Identity Verification</h3>
                <p className="font-sans text-[11px] text-teal-100/90 leading-relaxed mt-1">
                  Authenticate your claims ownership details below for <strong>{item.title}</strong> so the listing recorder can verify securely.
                </p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleClaimSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Verification Question
                  </label>
                  <div className="bg-slate-50 border border-slate-205/65 rounded-md p-4">
                    <p className="font-sans text-xs font-bold text-slate-800 leading-relaxed">
                      {hasSecurityQuestion 
                        ? item.securityQuestion 
                        : "Describe how we can verify that this item belongs to you. Specify any unique decals, stickers, contents, or circumstances where it was lost/found."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="claimer-answer" className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Your Verification Answer *
                  </label>
                  <textarea
                    id="claimer-answer-modal"
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    placeholder="Provide your exact verification answer or proof details here in as much descriptive precision as possible..."
                    className="w-full rounded-md border border-slate-250 bg-white p-4 font-sans text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 leading-relaxed placeholder:text-slate-400"
                    rows={4}
                    required
                  />
                  <p className="font-sans text-[10px] text-slate-400 italic">
                    The finder will inspect this proof and action your contact credentials request.
                  </p>
                </div>

                {claimErrorObj && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-750 font-sans text-[11px]">
                    ❌ {claimErrorObj}
                  </div>
                )}

                {/* Footer buttons with responsive block-stacking */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={submittingClaim || !claimAnswer.trim()}
                    className="w-full py-3.5 px-4 rounded-md bg-gradient-to-tr from-teal-850 to-indigo-950 text-white font-sans text-xs font-bold shadow-md hover:from-teal-900 hover:to-indigo-900 transition disabled:opacity-50 active:scale-95 duration-200 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {submittingClaim ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-teal-300" />
                        <span>Submit Answer</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenClaimModal(false)}
                    className="w-full py-3.5 px-4 rounded-md border border-slate-205 font-sans text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition active:scale-95 duration-200 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChatViewProps {
  chatId: string;
  currentUserUid: string;
  itemTitle: string;
  otherUserId: string;
  reporterName: string;
  onBack: () => void;
}

function ChatView({ chatId, currentUserUid, itemTitle, otherUserId, reporterName, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    const messagesCollection = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore message listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);
      if (!chatSnap.exists()) {
        await setDoc(chatDocRef, {
          chatId,
          participants: [currentUserUid, otherUserId],
          itemId: chatId.split('_').slice(-1)[0] || '',
          itemTitle,
          lastMessage: textToSend,
          timestamp: serverTimestamp()
        });
      }

      const messagesCollection = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesCollection, {
        senderId: currentUserUid,
        text: textToSend,
        createdAt: serverTimestamp()
      });

      await updateDoc(chatDocRef, {
        lastMessage: textToSend,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col justify-between bg-white text-slate-800 overflow-hidden" id="item-conversation-container">
      {/* 1. Rigid Header Box shrink-0 */}
      <div className="w-full bg-gradient-to-r from-teal-800 to-slate-900 p-4 flex items-center gap-4 text-white shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-bold hover:bg-white/20 active:scale-95 transition cursor-pointer"
        >
          ← Back
        </button>

        <div className="flex flex-col items-start justify-center flex-1 min-w-0">
          <span className="text-sm font-bold truncate block w-full">
            {reporterName}
          </span>
          <span className="text-[10px] text-teal-300 font-medium block">
            Direct Message Stream
          </span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/30 shrink-0">
          <Radio className="h-4 w-4 animate-pulse" />
        </div>
      </div>

      {/* 2. Middle messaging board independent scroll zone */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4 font-sans text-xs">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="font-sans text-xs font-medium">Connecting SECURE server channels...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-slate-800 text-sm">Send a message</h4>
              <p className="font-sans text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                Coordinate handoff spots, describe identification details in high accuracy, or exchange contact details.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserUid;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] flex flex-col space-y-1">
                  <div className={`px-4 py-2.5 rounded-md text-xs font-sans shadow-sm break-words ${
                    isMe 
                      ? 'bg-gradient-to-tr from-teal-800 to-indigo-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`font-mono text-[8.5px] text-slate-400 block px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* 3. Input layout locked safely directly above global elements */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-100 bg-white p-3 flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type secure handoff messages..."
          className="flex-1 rounded-md border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-sans focus:border-indigo-500 focus:bg-white focus:outline-none transition placeholder:text-slate-400 duration-155"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-teal-850 to-indigo-950 text-white shadow-md transition-all active:scale-95 duration-150 disabled:opacity-50 cursor-pointer"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 transform rotate-45 text-teal-300" />
          )}
        </button>
      </form>
    </div>
  );
}
