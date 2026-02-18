import { useState, useEffect, useMemo, useRef } from "react";
import { Send, MessageCircle, Search, Phone, Video, Download, Play, Pause, Image as ImageIcon, AlertTriangle, MoreVertical, Plus, ArrowRight, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, getChatMessages, sendChatMessage, uploadFile, getFileUrl, DirectusUser } from "@/lib/directus";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { FileAttachment } from "@/components/chat/FileAttachment";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { ProfilePictureModal } from "@/components/chat/ProfilePictureModal";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SupportCenter = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileAttachment, setShowFileAttachment] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("Normal");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendSoundRef = useRef<HTMLAudioElement>(null);
  const receiveSoundRef = useRef<HTMLAudioElement>(null);
  const prevMessageCountRef = useRef(0);

  // Fetch all messages for current user
  const { data: allMessages = [] } = useQuery({
    queryKey: ["chat-messages", user?.id],
    queryFn: () => getChatMessages(user?.id || ""),
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  // Fetch users list
  const { data: users = [] } = useQuery<DirectusUser[]>({
    queryKey: ["users-list-chat"],
    queryFn: () => listUsers("active"),
    staleTime: 1000 * 60 * 5,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ recipientId, msg, fileId, priority, senderId }: { recipientId: string; msg: string; fileId?: string; priority?: string; senderId?: string }) => {
      return sendChatMessage(recipientId, msg, priority || "Normal", fileId, senderId);
    },
    onSuccess: () => {
      setMessage("");
      setSelectedPriority("Normal");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      // Play send sound
      if (sendSoundRef.current) {
        sendSoundRef.current.play().catch(() => { });
      }
      toast.success("Message sent!");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Handle URL parameter for auto-selecting user
  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
    }
  }, [searchParams]);

  // Group messages into conversations and merge with all users
  const conversations = useMemo(() => {
    console.log("🔍 All messages received:", allMessages);
    const convMap = new Map<string, any>();

    // First, add all messages to conversation map
    allMessages.forEach((msg: any) => {
      const isOutbox = msg.collection === "support_chat_outbox";
      const partnerId = isOutbox ? msg.item : msg.sender;

      console.log("📨 Processing message:", {
        id: msg.id,
        collection: msg.collection,
        isOutbox,
        sender: msg.sender,
        item: msg.item,
        partnerId,
        message: msg.message
      });

      if (!partnerId || partnerId === user?.id) return;

      const existing = convMap.get(partnerId);
      if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
        convMap.set(partnerId, {
          partnerId,
          lastMessage: msg.message,
          timestamp: msg.timestamp,
          unread: !isOutbox && msg.status === "inbox",
          hasMessages: true,
        });
      }
    });

    // Then, add all users who don't have conversations yet
    users.forEach((u) => {
      if (u.id !== user?.id && !convMap.has(u.id)) {
        convMap.set(u.id, {
          partnerId: u.id,
          lastMessage: null,
          timestamp: null,
          unread: false,
          hasMessages: false,
        });
      }
    });

    // Sort: users with messages first (by timestamp), then users without messages (alphabetically)
    return Array.from(convMap.values()).sort((a, b) => {
      if (a.hasMessages && !b.hasMessages) return -1;
      if (!a.hasMessages && b.hasMessages) return 1;
      if (a.hasMessages && b.hasMessages) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      // Both have no messages, sort alphabetically
      const userA = users.find(u => u.id === a.partnerId);
      const userB = users.find(u => u.id === b.partnerId);
      const nameA = `${userA?.first_name} ${userA?.last_name}`.toLowerCase();
      const nameB = `${userB?.first_name} ${userB?.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [allMessages, users, user?.id]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter((conv) => {
      const partner = users.find((u) => u.id === conv.partnerId);
      const name = `${partner?.first_name} ${partner?.last_name}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [conversations, searchTerm, users]);

  // Get messages for selected conversation
  const selectedMessages = useMemo(() => {
    if (!selectedUserId) return [];
    const filtered = allMessages
      .filter((msg: any) => {
        const isOutbox = msg.collection === "support_chat_outbox";
        if (isOutbox) {
          return msg.item === selectedUserId;
        } else {
          return msg.sender === selectedUserId;
        }
      })
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log("💬 Selected messages for user", selectedUserId, ":", filtered);
    return filtered;
  }, [allMessages, selectedUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Detect new incoming messages and play sound
  useEffect(() => {
    const inboxMessages = allMessages.filter((msg: any) => msg.collection === "support_chat");

    if (prevMessageCountRef.current > 0 && inboxMessages.length > prevMessageCountRef.current) {
      // New message received
      if (receiveSoundRef.current) {
        receiveSoundRef.current.play().catch(() => { });
      }
    }

    prevMessageCountRef.current = inboxMessages.length;
  }, [allMessages]);

  // Auto-scroll to bottom on new messages or conversation change
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [selectedMessages, selectedUserId]);

  // WebRTC calling
  const {
    state: callState,
    localStream,
    remoteStream,
    partnerId: callPartnerId,
    startCall: initiateWebRTC,
    acceptCall,
    endCall
  } = useWebRTC(user?.id);

  const startCall = (type: "audio" | "video") => {
    if (!selectedUserId || !selectedUser) return;
    initiateWebRTC(selectedUserId, type);
  };

  const handleSendMessage = () => {
    if (!selectedUserId || !message.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ recipientId: selectedUserId, msg: message, priority: selectedPriority, senderId: user?.id });
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    if (!selectedUserId) return;
    try {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const uploaded = await uploadFile(file);
      sendMutation.mutate({ recipientId: selectedUserId, msg: "🎤 Voice message", fileId: uploaded.id, priority: selectedPriority });
      setShowVoiceRecorder(false);
    } catch (error) {
      toast.error("Failed to send voice message");
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!selectedUserId) return;
    try {
      const uploaded = await uploadFile(file);
      const msg = file.type.startsWith("image/") ? "📷 Image" : `📎 ${file.name}`;
      sendMutation.mutate({ recipientId: selectedUserId, msg, fileId: uploaded.id, priority: selectedPriority });
      setShowFileAttachment(false);
    } catch (error) {
      toast.error("Failed to send file");
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const renderMessageContent = (msg: any) => {
    if (msg.item && msg.collection === "support_chat") {
      const fileUrl = getFileUrl(msg.item);

      // Voice message
      if (msg.message.includes("🎤")) {
        return (
          <div className="flex items-center gap-2 bg-white/50 rounded p-2">
            <audio src={fileUrl} controls className="max-w-xs" />
          </div>
        );
      }

      // Image
      if (msg.message.includes("📷")) {
        return (
          <div className="space-y-1">
            <img src={fileUrl} alt="Shared image" className="max-w-xs rounded" />
            <p className="text-xs opacity-70">{msg.message}</p>
          </div>
        );
      }

      // File
      if (msg.message.includes("📎")) {
        return (
          <a
            href={fileUrl}
            download
            className="flex items-center gap-2 bg-white/50 rounded p-2 hover:bg-white/70 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">{msg.message}</span>
          </a>
        );
      }
    }

    return (
      <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {msg.subject && msg.subject !== "Normal" && (
          <Badge
            variant="outline"
            className={`text-[9px] h-4 uppercase font-bold mb-1 px-1.5 border-none shadow-sm ${msg.subject === "Critical"
              ? "bg-red-500/10 text-red-600 backdrop-blur-sm"
              : "bg-amber-500/10 text-amber-600 backdrop-blur-sm"
              }`}
          >
            {msg.subject === "Critical" && <AlertTriangle className="h-2 w-2 mr-1" />}
            {msg.subject}
          </Badge>
        )}
        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
      </div>
    );
  };

  return (
    <DashboardLayout title="Support Center">
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border overflow-hidden relative">
        {/* Conversations Sidebar */}
        <div className={cn(
          "w-full sm:w-80 border-r flex flex-col transition-all duration-300",
          selectedUserId ? "hidden sm:flex" : "flex"
        )}>
          <div className="p-4 border-b space-y-3">
            <h2 className="font-bold text-lg">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredConversations.map((conv) => {
              const partner = users.find((u) => u.id === conv.partnerId);
              if (!partner) return null;

              return (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedUserId(conv.partnerId)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-all duration-300 border-b relative group ${selectedUserId === conv.partnerId ? "bg-slate-100/50" : ""
                    }`}
                >
                  {selectedUserId === conv.partnerId && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.5)]" />
                  )}
                  <Avatar
                    className="h-12 w-12 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileModalUserId(partner.id);
                      setProfileModalOpen(true);
                    }}
                  >
                    {partner.avatar && <AvatarImage src={getFileUrl(partner.avatar)} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {partner.first_name?.[0]}{partner.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">
                        {partner.first_name} {partner.last_name}
                      </p>
                      {conv.timestamp && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatMessageDate(conv.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${conv.unread ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                      {conv.lastMessage || "Start a conversation..."}
                    </p>
                  </div>
                  {conv.unread && (
                    <div className="h-2 w-2 bg-emerald-500 rounded-full shrink-0 mt-2 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                  )}
                </button>
              );
            })}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedUserId && selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden -ml-2"
                  onClick={() => setSelectedUserId(null)}
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </Button>
                <Avatar
                  className="h-10 w-10 cursor-pointer"
                  onClick={() => {
                    setProfileModalUserId(selectedUser.id);
                    setProfileModalOpen(true);
                  }}
                >
                  {selectedUser.avatar && <AvatarImage src={getFileUrl(selectedUser.avatar)} />}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUser.title || "User"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startCall("audio")}
                  title="Start voice call"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startCall("video")}
                  title="Start video call"
                >
                  <Video className="h-4 w-4" />
                </Button>
                <div className="w-px h-8 bg-slate-200 mx-1" />
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea
              className="flex-1 p-4 relative"
              ref={scrollRef}
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.05) 1px, transparent 0)`,
                backgroundSize: '24px 24px',
                backgroundColor: '#f8fafc'
              }}
            >
              {/* Branded Pattern Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex flex-wrap gap-12 p-8 overflow-hidden items-center justify-center content-center rotate-[-15deg] scale-125">
                {Array.from({ length: 120 }).map((_, i) => (
                  <span key={i} className="text-xl font-black whitespace-nowrap tracking-tighter italic">ECAP +</span>
                ))}
              </div>

              <div className="space-y-6 relative z-10">
                {selectedMessages.map((msg: any) => {
                  const isOutbox = msg.collection === "support_chat_outbox";
                  const isMine = isOutbox;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${isMine
                          ? "bg-slate-900 border border-slate-800 text-white rounded-br-none"
                          : "bg-white/70 border border-white/50 backdrop-blur-md text-slate-900 rounded-bl-none"
                          }`}
                      >
                        {renderMessageContent(msg)}
                        <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider opacity-40 ${isMine ? "text-right" : "text-left"}`}>
                          {format(new Date(msg.timestamp), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-5 border-t bg-white/50 backdrop-blur-xl">
              {showVoiceRecorder ? (
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecording}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : showFileAttachment ? (
                <FileAttachment
                  onFileSelect={handleFileSelect}
                  onCancel={() => setShowFileAttachment(false)}
                />
              ) : (
                <div className="flex items-end gap-2">
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecording}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                  <FileAttachment
                    onFileSelect={handleFileSelect}
                    onCancel={() => setShowFileAttachment(false)}
                  />
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className={`w-[110px] h-10 text-[10px] font-black uppercase tracking-tighter border-none shadow-none rounded-xl transition-all ${selectedPriority === "Critical" ? "bg-red-500 text-white" : selectedPriority === "Urgent" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="Normal" className="text-[10px] font-bold uppercase tracking-widest">Normal</SelectItem>
                      <SelectItem value="Urgent" className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Urgent</SelectItem>
                      <SelectItem value="Critical" className="text-[10px] font-bold uppercase tracking-widest text-red-600">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all px-3">
                    <Input
                      placeholder="Type a premium message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="border-none shadow-none focus-visible:ring-0 px-0 h-11 text-sm bg-transparent"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMutation.isPending}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] w-8 h-8 shrink-0"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Picture Modal */}
      {profileModalUserId && (
        <ProfilePictureModal
          userId={profileModalUserId}
          currentAvatarUrl={
            users.find((u) => u.id === profileModalUserId)?.avatar
              ? getFileUrl(users.find((u) => u.id === profileModalUserId)!.avatar!)
              : undefined
          }
          open={profileModalOpen}
          onOpenChange={(open) => {
            setProfileModalOpen(open);
            if (!open) setProfileModalUserId(null);
          }}
        />
      )}

      {/* Hidden audio elements for notification sounds */}
      <audio ref={sendSoundRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE" type="audio/wav" />
      </audio>
      <audio ref={receiveSoundRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE" type="audio/wav" />
      </audio>

      {/* Call Overlay */}
      <CallOverlay
        state={callState}
        localStream={localStream}
        remoteStream={remoteStream}
        partner={users.find(u => u.id === callPartnerId)}
        onAccept={acceptCall}
        onDecline={endCall}
        onEnd={endCall}
      />
    </DashboardLayout>
  );
};

export default SupportCenter;
