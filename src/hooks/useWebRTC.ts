import { useState, useEffect, useRef, useCallback } from "react";
import Peer, { MediaConnection } from "peerjs";

export type CallState = "idle" | "incoming" | "outgoing" | "connecting" | "active" | "ended";

export const useWebRTC = (userId: string | undefined) => {
  const [state, setState] = useState<CallState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);

  const cleanup = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setState("idle");
    setPartnerId(null);
  }, [localStream]);

  // Initialize PeerJS
  useEffect(() => {
    if (!userId) return;

    const peer = new Peer(userId, {
      debug: 2
    });

    peer.on("open", (id) => {
      console.log("PeerJS: Connected with ID", id);
    });

    peer.on("call", (incomingCall) => {
      console.log("PeerJS: Incoming call from", incomingCall.peer);
      setPartnerId(incomingCall.peer);
      setState("incoming");
      callRef.current = incomingCall;

      incomingCall.on("stream", (remoteStream) => {
        console.log("PeerJS: Received remote stream");
        setRemoteStream(remoteStream);
        setState("active");
      });

      incomingCall.on("close", () => {
        console.log("PeerJS: Call closed by remote");
        cleanup();
      });

      incomingCall.on("error", (err) => {
        console.error("PeerJS: Call error", err);
        cleanup();
      });
    });

    peer.on("error", (err) => {
      console.error("PeerJS: Peer error", err);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [userId]);

  const startCall = async (targetId: string, type: "audio" | "video") => {
    if (!peerRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      setPartnerId(targetId);
      setState("outgoing");

      const call = peerRef.current.call(targetId, stream);
      callRef.current = call;

      call.on("stream", (remoteStream) => {
        console.log("PeerJS: Received remote stream (outgoing)");
        setRemoteStream(remoteStream);
        setState("active");
      });

      call.on("close", () => {
        console.log("PeerJS: Outgoing call closed");
        cleanup();
      });

      call.on("error", (err) => {
        console.error("PeerJS: Outgoing call error", err);
        cleanup();
      });

    } catch (err) {
      console.error("PeerJS: Failed to start call", err);
      cleanup();
    }
  };

  const acceptCall = async () => {
    if (!callRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setState("connecting");

      console.log("PeerJS: Answering call with local stream");
      callRef.current.answer(stream);
      // Wait for 'stream' event to set state to active
    } catch (err) {
      console.error("PeerJS: Failed to accept call", err);
      cleanup();
    }
  };

  const endCall = useCallback(async () => {
    cleanup();
  }, [cleanup]);

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
