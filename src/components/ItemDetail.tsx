import React from 'react';
import { Item } from '../types';
import { motion } from 'motion/react';
import { getCategoryIcon } from './ItemCard';
import Matchmaker from './Matchmaker';
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
  Loader2 
} from 'lucide-react';

interface ItemDetailProps {
  item: Item;
  onClose: () => void;
  allOppositeItems: Item[]; // Candidates of opposite tracking category
  onResolveItem: (itemId: string, matchingItemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  currentUserUid?: string;
}

export default function ItemDetail({
  item,
  onClose,
  allOppositeItems,
  onResolveItem,
  onDeleteItem,
  currentUserUid,
}: ItemDetailProps) {
  const [deleting, setDeleting] = React.useState(false);
  
  const isOwner = item.userId === currentUserUid;
  const isResolved = item.status === 'resolved';

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedPostedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shrink-0">
                    {item.contactName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-sans text-[10px] text-slate-400">Reporter</p>
                    <p className="font-sans text-xs text-slate-800 font-bold">{item.contactName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-sans text-[10px] text-slate-400">Method of contact</p>
                    <p className="font-sans text-xs text-slate-800 font-bold truncate">{item.contactInfo}</p>
                  </div>
                </div>
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
            <span className="flex items-center gap-1 uppercase">
              <FileClock className="h-3.5 w-3.5" />
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
    </div>
  );
}
