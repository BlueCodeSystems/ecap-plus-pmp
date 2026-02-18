import { useState, useEffect, useRef, useCallback } from "react";
import { getCallSignals, sendCallSignal, markNotificationRead } from "@/lib/directus";

export type CallState = "idle" | "incoming" | "outgoing" | "connecting" | "active" | "ended";

const CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useWebRTC = (userId: string | undefined) => {
  const [state, setState] = useState<CallState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  const cleanup = useCallback(() => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setState("idle");
    setPartnerId(null);
  }, [localStream]);

  const initPeerConnection = useCallback((targetId: string) => {
    const peer = new RTCPeerConnection(CONFIGURATION);

    peer.onicecandidate = (event) => {
      if (event.candidate && userId) {
        sendCallSignal(targetId, userId, { type: "candidate", candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.current = peer;
    return peer;
  }, [userId]);

  const startCall = async (targetId: string, type: "audio" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      setPartnerId(targetId);
      setState("outgoing");

      const peer = initPeerConnection(targetId);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      if (userId) {
        await sendCallSignal(targetId, userId, { type: "offer", sdp: offer, callType: type });
      }
    } catch (err) {
      console.error("Failed to start call:", err);
      cleanup();
    }
  };

  const acceptCall = async () => {
    if (!partnerId || !userId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setState("connecting");

      const peer = pc.current;
      if (!peer) return;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      await sendCallSignal(partnerId, userId, { type: "answer", sdp: answer });
      setState("active");
    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanup();
    }
  };

  const endCall = useCallback(async () => {
    if (partnerId && userId) {
      await sendCallSignal(partnerId, userId, { type: "end" });
    }
    cleanup();
  }, [partnerId, userId, cleanup]);

  // Polling for signals
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      const signals = await getCallSignals(userId);
      for (const sig of signals) {
        const data = JSON.parse(sig.message);

        if (data.type === "offer" && state === "idle") {
          setPartnerId(sig.sender);
          setState("incoming");
          const peer = initPeerConnection(sig.sender);
          await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } else if (data.type === "answer" && pc.current) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setState("active");
        } else if (data.type === "candidate" && pc.current) {
          try {
            await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error("Error adding received ice candidate", e);
          }
        } else if (data.type === "end") {
          cleanup();
        }

        // Mark signal as processed
        await markNotificationRead(sig.id);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [userId, state, initPeerConnection, cleanup]);

  return {
    state,
    localStream,
    remoteStream,
    partnerId,
    startCall,
    acceptCall,
    endCall,
  };
};
