import React, { useState, useEffect } from 'react';
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
  onSnapshot 
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
  Sparkles
} from 'lucide-react';

interface ItemDetailProps {
  item: Item;
  onClose: () => void;
  allOppositeItems: Item[]; // Candidates of opposite tracking category
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
  const [claimAnswer, setClaimAnswer] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimErrorObj, setClaimErrorObj] = useState<string | null>(null);

  // Real-time Claims tracking
  const [existingClaim, setExistingClaim] = useState<Claim | null>(null);
  const [fetchingClaim, setFetchingClaim] = useState(false);

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

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        createdAt: new Date().toISOString(), // Standardizing string ISO for cross consistency
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'claims', claimId), {
        ...claimPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setClaimAnswer('');
      setOpenClaimModal(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="item-details-drawer">
      <motion.div
        layoutId={`card-container-${item.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl "
      >
        {/* Header Ribbon */}
        <div className={`p-4 flex items-center justify-between border-b ${
          item.type === 'lost' 
            ? 'bg-rose-50/50 border-rose-100 text-rose-800' 
            : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold font-sans uppercase ${
              item.type === 'lost' ? 'bg-rose-100' : 'bg-emerald-100'
            }`}>
              {item.type}
            </span>
            <span className="font-mono text-xs text-slate-500 font-semibold tracking-wide capitalize">
              {item.category} Registry Item
            </span>
          </div>

          <button
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
                <div className="relative aspect-square w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className={`aspect-square w-full rounded-xl border flex flex-col items-center justify-center ${
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
                <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-sans text-[10px] text-slate-400 uppercase font-semibold">Location</p>
                    <p className="font-sans font-medium text-slate-800 truncate">{item.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
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
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50" id="contact-credentials">
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shrink-0">
                        {item.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-sans text-[10px] text-slate-400 font-medium">Reporter (Your Listing)</p>
                        <p className="font-sans text-xs text-slate-800 font-bold">{item.contactName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
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
                        <div className="flex items-start space-x-3 bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0 border border-indigo-100">
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
                          <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wide">
                                Claim Response History
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                existingClaim.status === 'pending' ? 'bg-amber-100 text-amber-805' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {existingClaim.status}
                              </span>
                            </div>

                            <p className="font-sans text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed italic">
                              "{existingClaim.securityQuestion}"
                            </p>
                            
                            <p className="text-[11px] text-slate-600 font-semibold">
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
                            
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={() => onStartChat && onStartChat(item.userId, item.id)}
                                className="flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg border border-slate-200 font-sans text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Message Finder</span>
                              </button>
                              
                              {existingClaim.status === 'rejected' && (
                                <button
                                  onClick={() => setOpenClaimModal(true)}
                                  className="flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg bg-slate-900 text-white font-sans text-[11px] font-bold hover:bg-slate-800 transition"
                                >
                                  <ShieldQuestion className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Submit Custom Proof</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Open submit claim trigger buttons */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => onStartChat && onStartChat(item.userId, item.id)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-sans text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 duration-200"
                            >
                              <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                              <span>Message Finder</span>
                            </button>
                            
                            <button
                              onClick={() => setOpenClaimModal(true)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-gradient-to-tr from-teal-850 to-indigo-900 hover:from-teal-900 hover:to-indigo-850 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 duration-200"
                            >
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300" />
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shrink-0">
                              {item.contactName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-sans text-[10px] text-slate-400 font-medium">Reporter</p>
                              <p className="font-sans text-xs text-slate-800 font-bold">{item.contactName}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                              <PhoneCall className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-sans text-[10px] text-slate-400 font-medium">Contact Coordinates</p>
                              <p className="font-sans text-xs text-slate-800 font-bold truncate">{item.contactInfo}</p>
                            </div>
                          </div>
                        </div>

                        {existingClaim?.status === 'approved' && (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800 font-sans text-xs">
                            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <p className="font-medium text-[11px] leading-snug">
                              <strong>Proof Approved:</strong> The reporter authenticated your answer. Safe transactions are unlocked!
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => onStartChat && onStartChat(item.userId, item.id)}
                            className="w-full flex items-center justify-center space-x-1.5 bg-gradient-to-tr from-teal-850 to-indigo-950 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 duration-200"
                          >
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span>Direct Chat Room</span>
                          </button>

                          {/* Fallback claim submission in case no security question was present but they still want to trigger one */}
                          {!existingClaim && (
                            <button
                              onClick={() => setOpenClaimModal(true)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-205 border border-slate-200 text-slate-700 font-sans text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 duration-200"
                            >
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" />
                              <span>Log Ownership Claim</span>
                            </button>
                          )}
                          
                          {existingClaim && existingClaim.status !== 'approved' && (
                            <div className="col-span-full py-1 text-center font-sans text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded">
                              ✓ Claim Status: {existingClaim.status.toUpperCase()}
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
            <Matchmaker
              item={item}
              allOppositeItems={allOppositeItems}
              onResolveItem={onResolveItem}
              userUid={currentUserUid}
            />
          )}

          {/* Technical Metadata logs */}
          <div className="flex flex-wrap items-center justify-between text-slate-400 font-sans text-[10px] pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1 uppercase font-semibold">
              <FileClock className="h-3.5 w-3.5 text-slate-350" />
              <span>Registered: {formattedPostedDate}</span>
            </span>

            {/* Owner controls: allow Delete */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center space-x-1 text-rose-500 hover:text-rose-700 transition"
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

      </motion.div>

      {/* ── CLAIMS VERIFICATION MODAL COHESIVE WITH OUR STYLE (Item 2) ── */}
      <AnimatePresence>
        {openClaimModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" id="claims-verification-modal">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
            >
              {/* Header with deep teal/blue gradient matching spec */}
              <div className="bg-gradient-to-tr from-teal-800 to-indigo-950 p-6 text-white relative">
                <button 
                  onClick={() => setOpenClaimModal(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition"
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
                  <div className="bg-slate-50 border border-slate-205/65 rounded-2xl p-4">
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
                    id="claimer-answer"
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    placeholder="Provide your exact verification answer or proof details here in as much descriptive precision as possible..."
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 font-sans text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 leading-relaxed placeholder:text-slate-400"
                    rows={4}
                    required
                  />
                  <p className="font-sans text-[10px] text-slate-400 italic">
                    The finder will inspect this proof and action your contact credentials request.
                  </p>
                </div>

                {claimErrorObj && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 font-sans text-[11px]">
                    ❌ {claimErrorObj}
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpenClaimModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-sans text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim || !claimAnswer.trim()}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-tr from-teal-850 to-indigo-950 text-white font-sans text-xs font-bold shadow-md hover:from-teal-900 hover:to-indigo-900 transition disabled:opacity-50 active:scale-95 duration-200 flex items-center justify-center space-x-1.5 cursor-pointer"
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
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
