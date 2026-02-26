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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMOJI_REGEX = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\s\u200d])+$/u;

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
  const [isProfileEditable, setIsProfileEditable] = useState(false);
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
  const { data: rawUsers = [] } = useQuery<DirectusUser[]>({
    queryKey: ["users-list-chat"],
    queryFn: () => listUsers("active"),
    refetchInterval: 30000, // Refetch users every 30s to update presence
  });

  // Apply role-based visibility filtering (same rules as Users page)
  const users = useMemo(() => {
    if (!user) return rawUsers;

    // Resolve current user's role name
    let myRoleName = "User";
    if (typeof user.role === "string") {
      myRoleName = user.role;
    } else if (user.role?.name) {
      myRoleName = user.role.name;
    }

    const isMyRoleSupport = myRoleName.toLowerCase().includes("support");
    const isMyRoleAdmin = myRoleName === "Administrator";

    // Support and Admin users can see everyone
    if (isMyRoleSupport || isMyRoleAdmin) return rawUsers;

    // Standard ECAP+ Users: hide ECAP II Support and Directus Admins
    return rawUsers.filter((u) => {
      let targetRoleName = "User";
      if (typeof u.role === "string") {
        targetRoleName = u.role;
      } else if (u.role?.name) {
        targetRoleName = u.role.name;
      }

      const isTargetAdmin = targetRoleName === "Administrator";
      const isTargetEcapII = targetRoleName.toLowerCase().includes("ecap ii") || targetRoleName.toLowerCase().includes("ecapii");

      if (isTargetAdmin) return false;
      if (isTargetEcapII) return false;
      return true;
    });
  }, [rawUsers, user]);

  const isOnline = (lastAccess?: string) => {
    if (!lastAccess) return false;
    const lastSeen = new Date(lastAccess).getTime();
    const now = new Date().getTime();
    return now - lastSeen < 1000 * 60 * 5; // Online if active in last 5 minutes
  };

  const formatLastSeen = (lastAccess?: string) => {
    if (!lastAccess) return "Offline";
    if (isOnline(lastAccess)) return "Online";
    return `Last seen ${formatDistanceToNow(new Date(lastAccess), { addSuffix: true })}`;
  };

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

    const convMap = new Map<string, any>();

    // First, add all messages to conversation map
    allMessages.forEach((msg: any) => {
      const isOutbox = msg.collection === "support_chat_outbox";
      const partnerId = isOutbox ? msg.item : msg.sender;



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


    return filtered;
  }, [allMessages, selectedUserId]);

  const selectedUser = useMemo(() => {
    const userFromList = users.find((u) => u.id === selectedUserId);
    if (userFromList) return userFromList;

    // Fallback: Resolve from conversations (remote users)
    const conv = conversations.find(c => c.partnerId === selectedUserId);
    if (conv) {
      const partnerName = conv.partnerId.substring(0, 5);
      return {
        id: conv.partnerId,
        first_name: "Remote",
        last_name: `User (${partnerName})`,
        title: "Platform User"
      } as any;
    }
    return null;
  }, [users, selectedUserId, conversations]);

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
    if (!selectedUserId) return;
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
    // Check if the message is purely emojis (Jumboji)
    const isJumboji = EMOJI_REGEX.test(msg.message.trim());

    if (msg.item && msg.collection === "support_chat") {
      const fileUrl = getFileUrl(msg.item);

      // Voice message
      if (msg.message.includes("🎤")) {
        return (
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-sm">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" />
            </div>
            <audio src={fileUrl} controls className="h-8 max-w-[180px] filter invert hue-rotate-180 brightness-110" />
            <div className="text-[10px] font-bold text-slate-400 rotate-90 tracking-widest">Voice</div>
          </div>
        );
      }

      // Image
      if (msg.message.includes("📷")) {
        return (
          <div className="space-y-2 group relative">
            <div className="overflow-hidden rounded-2xl border border-white/40 shadow-lg transition-transform duration-500 group-hover:scale-[1.02]">
              <img src={fileUrl} alt="Shared image" className="max-w-xs object-cover" />
            </div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 pl-1">{msg.message.replace("📷 ", "") || "Shared image"}</p>
          </div>
        );
      }

      // File
      if (msg.message.includes("📎")) {
        return (
          <a
            href={fileUrl}
            download
            className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/60 transition-all shadow-sm group"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
              <Download className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{msg.message.replace("📎 ", "")}</span>
              <span className="text-[9px] font-black tracking-tighter text-slate-400">Download file</span>
            </div>
          </a>
        );
      }
    }

    if (isJumboji) {
      return (
        <div className="text-5xl py-2 drop-shadow-xl animate-in zoom-in-50 duration-500">
          {msg.message.trim()}
        </div>
      );
    }

    return (
      <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {msg.subject && msg.subject !== "Normal" && (
          <Badge
            variant="outline"
            className={`text-[9px] h-4 font-black mb-1 px-1.5 border-none shadow-sm ${msg.subject === "Critical"
              ? "bg-rose-500 text-white"
              : "bg-amber-400 text-slate-900"
              }`}
          >
            {msg.subject === "Critical" && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
            {msg.subject}
          </Badge>
        )}
        <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px] font-medium tracking-tight">{msg.message}</p>
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
          <div className="p-5 border-b space-y-4 bg-slate-50/50 backdrop-blur-md sticky top-0 z-10">
            <h2 className="font-black text-xl tracking-tight text-slate-900">Messages</h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white transition-all rounded-xl"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredConversations.map((conv) => {
              const partner = users.find((u) => u.id === conv.partnerId);
              // Fallback for partner if not in users list (critical for cross-app support)
              const partnerName = partner ? `${partner.first_name} ${partner.last_name}` : `User ${conv.partnerId.substring(0, 5)}...`;
              const partnerAvatar = partner?.avatar;
              const initials = partner ? `${partner.first_name?.[0]}${partner.last_name?.[0]}` : "?";

              return (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedUserId(conv.partnerId)}
                  className={`w-full p-4 flex items-start gap-4 hover:bg-slate-50 transition-all duration-500 border-b relative group ${selectedUserId === conv.partnerId ? "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] z-10" : "bg-transparent"
                    }`}
                >
                  {selectedUserId === conv.partnerId && (
                    <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-emerald-500 rounded-r-full shadow-[2px_0_15px_rgba(16,185,129,0.6)] animate-in slide-in-from-left duration-500" />
                  )}
                  <Avatar
                    className="h-12 w-12 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (partner) {
                        setProfileModalUserId(partner.id);
                        setIsProfileEditable(partner.id === user?.id);
                        setProfileModalOpen(true);
                      }
                    }}
                  >
                    {partnerAvatar && <AvatarImage src={getFileUrl(partnerAvatar)} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                    {isOnline(partner?.last_access) && (
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    )}
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">
                        {partnerName}
                        {!partner && <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-500 px-1 rounded">Remote</span>}
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
                    setIsProfileEditable(selectedUser.id === user?.id);
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
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isOnline(selectedUser.last_access) ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isOnline(selectedUser.last_access) ? "Online" : formatLastSeen(selectedUser.last_access)}
                    </p>
                  </div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuItem
                      className="text-xs font-semibold py-2.5 cursor-pointer"
                      onClick={() => {
                        setProfileModalUserId(selectedUser.id);
                        setIsProfileEditable(selectedUser.id === user?.id);
                        setProfileModalOpen(true);
                      }}
                    >
                      View {selectedUserId === user?.id ? "my" : ""} profile
                    </DropdownMenuItem>
                    {selectedUser.id === user?.id && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs font-semibold py-2.5 cursor-pointer text-slate-600 focus:text-slate-700"
                          onClick={() => {
                            if (window.location.pathname !== "/profile") {
                              window.location.href = "/profile";
                            }
                          }}
                        >
                          Account settings
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] select-none flex flex-wrap gap-12 p-8 overflow-hidden items-center justify-center content-center rotate-[-15deg] scale-150 transition-opacity duration-1000">
                {Array.from({ length: 80 }).map((_, i) => (
                  <span key={i} className="text-2xl font-black whitespace-nowrap tracking-tighter italic">ECAP +</span>
                ))}
              </div>

              <div className="space-y-6 relative z-10">
                {selectedMessages.map((msg: any) => {
                  const isOutbox = msg.collection === "support_chat_outbox";
                  const isMine = isOutbox;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div
                          className={cn(
                            "px-4 py-2.5 shadow-sm transition-all hover:shadow-md",
                            EMOJI_REGEX.test(msg.message.trim())
                              ? "bg-transparent shadow-none px-0"
                              : isMine
                                ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-[24px] rounded-br-[4px] shadow-emerald-500/10 border-t border-white/10"
                                : "bg-white border border-slate-100 text-slate-800 rounded-[24px] rounded-bl-[4px] shadow-slate-200/50"
                          )}
                        >
                          {renderMessageContent(msg)}
                        </div>
                        <div className={cn(
                          "flex items-center gap-1.5 px-2",
                          isMine ? "justify-end" : "justify-start"
                        )}>
                          <p className="text-[10px] font-bold tracking-tighter text-slate-400">
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </p>
                          {isMine && (
                            <div className="flex gap-0.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-50" />
                            </div>
                          )}
                        </div>
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
                    <SelectTrigger className={`w-[110px] h-10 text-[10px] font-black tracking-tighter border-none shadow-none rounded-xl transition-all ${selectedPriority === "Critical" ? "bg-red-500 text-white" : selectedPriority === "Urgent" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="Normal" className="text-[10px] font-bold tracking-widest">Normal</SelectItem>
                      <SelectItem value="Urgent" className="text-[10px] font-bold tracking-widest text-amber-600">Urgent</SelectItem>
                      <SelectItem value="Critical" className="text-[10px] font-bold tracking-widest text-red-600">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all px-3">
                    <Input
                      placeholder="Type a message..."
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
            if (!open) {
              setProfileModalUserId(null);
              setIsProfileEditable(false);
            }
          }}
          isEditable={isProfileEditable}
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
        partner={users.find(u => u.id === callPartnerId) || {
          id: callPartnerId,
          first_name: "Remote",
          last_name: "User",
        }}
        onAccept={acceptCall}
        onDecline={endCall}
        onEnd={endCall}
      />
    </DashboardLayout>
  );
};

export default SupportCenter;
