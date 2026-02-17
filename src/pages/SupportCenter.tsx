import { useState, useEffect, useMemo, useRef } from "react";
import { Send, MessageCircle, Search, Phone, Video, Download, Play, Pause, Image as ImageIcon, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
    mutationFn: async ({ recipientId, msg, fileId, priority }: { recipientId: string; msg: string; fileId?: string; priority?: string }) => {
      return sendChatMessage(recipientId, msg, priority || "Normal", fileId);
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

  // Jitsi calling - open in new window instead of iframe to avoid CSP issues
  const startCall = (type: "audio" | "video") => {
    if (!selectedUserId || !selectedUser) return;

    const roomName = `ECAP_PLUS_${[user?.id, selectedUserId].sort().join("_")}`;
    const displayName = encodeURIComponent(`${user?.first_name} ${user?.last_name}`);

    // Build Jitsi URL with configuration
    const jitsiUrl = new URL(`https://meet.jit.si/${roomName}`);
    jitsiUrl.searchParams.set("displayName", displayName);

    if (type === "audio") {
      jitsiUrl.hash = "#config.startWithVideoMuted=true";
    }

    // Open in new window
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      jitsiUrl.toString(),
      `jitsi_call_${roomName}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    toast.success(`${type === "video" ? "Video" : "Voice"} call started in new window`);
  };

  const handleSendMessage = () => {
    if (!selectedUserId || !message.trim()) return;
    sendMutation.mutate({ recipientId: selectedUserId, msg: message, priority: selectedPriority });
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
      <div className="space-y-1">
        {msg.subject && msg.subject !== "Normal" && (
          <Badge
            variant="outline"
            className={`text-[9px] h-4 uppercase font-black mb-1 ${msg.subject === "Critical"
              ? "border-red-500 text-red-600 bg-red-50"
              : "border-amber-500 text-amber-600 bg-amber-50"
              }`}
          >
            {msg.subject === "Critical" && <AlertTriangle className="h-2 w-2 mr-1" />}
            {msg.subject}
          </Badge>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
      </div>
    );
  };

  return (
    <DashboardLayout title="Support Center">
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r flex flex-col">
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
                  className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b ${selectedUserId === conv.partnerId ? "bg-slate-100" : ""
                    }`}
                >
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
                    <p className="text-xs text-slate-500 truncate">
                      {conv.lastMessage || "Start a conversation..."}
                    </p>
                  </div>
                  {conv.unread && <div className="h-2 w-2 bg-primary rounded-full shrink-0 mt-2" />}
                </button>
              );
            })}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedUserId && selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {selectedMessages.map((msg: any) => {
                  const isOutbox = msg.collection === "support_chat_outbox";
                  const isMine = isOutbox;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-slate-100 text-slate-900 rounded-bl-sm"
                          }`}
                      >
                        {renderMessageContent(msg)}
                        <p className="text-[10px] mt-1 opacity-60">
                          {format(new Date(msg.timestamp), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
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
                    <SelectTrigger className={`w-[110px] h-9 text-xs font-bold border-slate-200 ${selectedPriority === "Critical" ? "text-red-500 bg-red-50 border-red-200" : selectedPriority === "Urgent" ? "text-amber-500 bg-amber-50 border-amber-200" : "text-slate-500"
                      }`}>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="Urgent" className="text-xs text-amber-600 font-bold">Urgent</SelectItem>
                      <SelectItem value="Critical" className="text-xs text-red-600 font-bold">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
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
    </DashboardLayout>
  );
};

export default SupportCenter;
