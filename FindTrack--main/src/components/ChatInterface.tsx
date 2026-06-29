import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Clock, 
  User, 
  Loader2, 
  Radio,
  ExternalLink
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface Chat {
  chatId: string;
  itemId: string;
  itemTitle?: string;
  participants: string[];
  lastMessage?: string;
  timestamp: any;
}

interface ChatInterfaceProps {
  activeChatId: string | null;
  currentUserUid: string | null;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export default function ChatInterface({
  activeChatId,
  currentUserUid,
  onClose,
  onSelectChat,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [reporterName, setReporterName] = useState('Item Finder');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Chat details and configure real-time messages listener
  useEffect(() => {
    if (!activeChatId || !currentUserUid) {
      setMessages([]);
      setChatInfo(null);
      setReporterName('Item Finder');
      return;
    }

    setLoading(true);

    // Fetch parent chat metadata once
    const chatDocRef = doc(db, 'chats', activeChatId);
    getDoc(chatDocRef).then(async (snap) => {
      if (snap.exists()) {
        const data = { chatId: snap.id, ...snap.data() } as Chat;
        setChatInfo(data);

        // Fetch original item to get the reporter's contact name
        if (data.itemId) {
          try {
            const itemRef = doc(db, 'items', data.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
              const itemData = itemSnap.data();
              if (itemData.contactName) {
                setReporterName(itemData.contactName);
              } else if (itemData.title) {
                setReporterName(itemData.title);
              }
            } else if (data.itemTitle) {
              setReporterName(data.itemTitle);
            }
          } catch (itemErr) {
            console.error("Error fetching item for chat contact name:", itemErr);
            if (data.itemTitle) {
              setReporterName(data.itemTitle);
            }
          }
        }
      }
    }).catch(err => {
      console.error("Error fetching chat meta:", err);
    });

    // Real-time messages subcollection listener
    const messagesCollection = collection(db, 'chats', activeChatId, 'messages');
    const messagesQuery = query(messagesCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `chats/${activeChatId}/messages`);
    });

    return unsubscribe;
  }, [activeChatId, currentUserUid]);

  // 2. Scroll to the bottom of the feed when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Sender actions
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !currentUserUid || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const messagesCollection = collection(db, 'chats', activeChatId, 'messages');
      
      // Add individual message to subcollection
      await addDoc(messagesCollection, {
        senderId: currentUserUid,
        text: textToSend,
        createdAt: serverTimestamp()
      });

      // Update parent chat with the last message preview and active timestamp
      const chatDocRef = doc(db, 'chats', activeChatId);
      await updateDoc(chatDocRef, {
        lastMessage: textToSend,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message securely. Try again.");
    } finally {
      setSending(false);
    }
  };

  // Helper formatting for dates/times
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activeChatId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-0 bottom-[64px] top-[56px] bg-slate-50 flex flex-col z-40 shadow-2xl"
        id="chat-system-overlay"
      >
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 shadow-md flex-shrink-0">
          <button
            onClick={onClose}
            className="text-white font-bold text-lg leading-none p-1 cursor-pointer"
          >
            ← Back
          </button>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm">{reporterName || "Chat"}</span>
            <span className="text-cyan-100 text-xs">Secure Handoff Messaging</span>
          </div>
        </div>

        {/* Active Conversation Feed */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="font-sans text-xs">Loading secure message logs...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-sans font-bold text-slate-800 text-sm">No Messages Yet</h4>
                <p className="font-sans text-xs text-slate-500 max-w-xs mt-1">
                  Introduce yourself! Mention how or where you can sync up to return this item.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msgRef) => {
              const isMe = msgRef.senderId === currentUserUid;
              return (
                <div 
                  key={msgRef.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[80%] flex flex-col space-y-1">
                    {/* Message Bubble */}
                    <div 
                      className={`px-4 py-2.5 rounded-2xl text-xs font-sans shadow-xs break-words ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msgRef.text}
                    </div>
                    
                    {/* Time indicators */}
                    <span className={`font-mono text-[9px] text-slate-400 flex items-center space-x-1 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}>
                      <Clock className="h-2.5 w-2.5 opacity-60" />
                      <span>{formatTime(msgRef.createdAt)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Secure Baseline Form Input Tray Area */}
        <div className="p-3 bg-white border-t border-slate-100 shadow-xl shrink-0">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 max-w-md mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type secure handoff messages..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm hover:bg-teal-700 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// 4. Compact Inbox Helper List
interface ChatListProps {
  currentUserUid: string | null;
  onSelectChat: (chatId: string) => void;
  activeChatId?: string | null;
}

export function ChatInboxList({
  currentUserUid,
  onSelectChat,
  activeChatId,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserUid) {
      setChats([]);
      return;
    }

    setLoading(true);

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', currentUserUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Chat[] = [];
      snapshot.forEach(docSnap => {
        list.push({ chatId: docSnap.id, ...docSnap.data() } as Chat);
      });
      
      // Sort client-side timestamp descending (latest message first)
      list.sort((a, b) => {
        const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });

      setChats(list);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      console.error("Error reading chat list:", error);
    });

    return unsubscribe;
  }, [currentUserUid]);

  if (!currentUserUid) {
    return (
      <div className="p-4 text-center text-slate-500 font-sans text-xs">
        Please sign in to read your direct messages.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        <span className="font-sans text-[11px]">Syncing direct messages...</span>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/20">
        <MessageSquare className="mx-auto h-7 w-7 text-slate-300 mb-2" />
        <h5 className="font-sans font-bold text-slate-700 text-xs text-center">No Active Chats</h5>
        <p className="font-sans text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Open a lost or found item details page and tap "Message Finder" to connect instantly and privately.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {chats.map((chat) => {
        const isActive = activeChatId === chat.chatId;
        const formattedDate = chat.timestamp 
          ? (chat.timestamp.seconds ? new Date(chat.timestamp.seconds * 1000) : new Date(chat.timestamp)).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          : '';

        return (
          <div
            key={chat.chatId}
            onClick={() => onSelectChat(chat.chatId)}
            className={`group relative flex items-start justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isActive 
                ? 'bg-teal-50/50 border-teal-200 shadow-sm ring-1 ring-teal-500/10' 
                : 'bg-white border-slate-100 hover:bg-slate-50/40 hover:border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              {/* Launcher conversation Avatar bubble */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold font-sans text-xs ${
                isActive 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
              }`}>
                {chat.itemTitle ? chat.itemTitle.charAt(0).toUpperCase() : 'C'}
              </div>

              {/* Chat details summary */}
              <div className="text-left min-w-0 flex-1">
                <p className="font-sans text-[11px] text-slate-400 font-medium">
                  {chat.itemTitle ? `About "${chat.itemTitle}"` : 'Direct Messaging'}
                </p>
                <h4 className="font-sans font-bold text-slate-800 text-xs mt-0.5 truncate leading-snug">
                  Discussion Participant {chat.participants.find(p => p !== currentUserUid)?.substring(0, 5)}
                </h4>
                <p className="font-sans text-[11px] text-slate-500 mt-1 truncate leading-normal">
                  {chat.lastMessage || 'Message logs started...'}
                </p>
              </div>
            </div>

            {/* Timestamps and open arrows */}
            <div className="flex flex-col items-end justify-between self-stretch shrink-0 ml-3">
              <span className="font-mono text-[9px] text-slate-400 font-semibold">{formattedDate}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-teal-600">
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
