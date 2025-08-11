// src/components/Vediomeet.jsx
import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import "../styles/videocomponent.css";

const SOCKET_SERVER_URL = "http://localhost:8000";
const ICE_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function Vediomeet() {
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // { peerId: { pc, senders } }
  const localVideoRef = useRef(null);

  const [username, setUsername] = useState("");
  const [inLobby, setInLobby] = useState(true);
  const [remotePeers, setRemotePeers] = useState([]); // [{ socketId, username, stream }]
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [screenSharing, setScreenSharing] = useState(false);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      // close peers
      Object.values(peersRef.current).forEach((p) => {
        try { p.pc.close(); } catch (e) {}
      });
      // stop local tracks
      const s = localStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const getLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert("Could not access camera/microphone. Allow permissions and reload.");
      throw err;
    }
  };

  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("signal", peerId, { type: "ice", candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemotePeers((list) => {
        const exists = list.find((p) => p.socketId === peerId);
        if (exists) {
          return list.map((p) => (p.socketId === peerId ? { ...p, stream: remoteStream } : p));
        } else {
          return [...list, { socketId: peerId, username: "Unknown", stream: remoteStream }];
        }
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        // cleanup
        try { pc.close(); } catch (e) {}
        delete peersRef.current[peerId];
        setRemotePeers((list) => list.filter((p) => p.socketId !== peerId));
      }
    };

    // add local tracks
    const localStream = localStreamRef.current;
    const senders = { video: null, audio: null };
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, localStream);
        if (track.kind === "video") senders.video = sender;
        if (track.kind === "audio") senders.audio = sender;
      });
    }

    peersRef.current[peerId] = { pc, senders };
    return pc;
  };

  const cleanupPeer = (peerId) => {
    const peer = peersRef.current[peerId];
    if (peer) {
      try { peer.pc.close(); } catch (e) {}
      delete peersRef.current[peerId];
    }
    setRemotePeers((list) => list.filter((p) => p.socketId !== peerId));
  };

  const handleSignal = async (fromId, payload) => {
    if (!peersRef.current[fromId]) {
      createPeerConnection(fromId);
    }
    const { pc } = peersRef.current[fromId];

    if (payload.type === "sdp" && payload.sdp) {
      const desc = payload.sdp;
      await pc.setRemoteDescription(new RTCSessionDescription(desc));
      if (desc.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.emit("signal", fromId, { type: "sdp", sdp: pc.localDescription });
      }
    } else if (payload.type === "ice" && payload.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.warn("addIceCandidate err", e);
      }
    }
  };

  const callExistingClients = async (clients) => {
    // clients: array of socketIds
    for (const clientId of clients) {
      if (clientId === socketRef.current.id) continue;
      if (!peersRef.current[clientId]) {
        const pc = createPeerConnection(clientId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit("signal", clientId, { type: "sdp", sdp: pc.localDescription, username });
        } catch (e) {
          console.error("createOffer error", e);
        }
      }
    }
  };

  const connectSocket = async () => {
    await getLocalMedia();

    socketRef.current = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      // Use URL as room id for simplicity
      socketRef.current.emit("join-call", { room: window.location.href, username });
    });

    socketRef.current.on("room-clients", ({ clients }) => {
      // clients is array of { socketId, username }
      const ids = clients.map((c) => c.socketId);
      callExistingClients(ids);
      // set remote peers list with usernames (no streams yet)
      setRemotePeers(clients.map((c) => ({ socketId: c.socketId, username: c.username, stream: null })));
    });

    socketRef.current.on("user-joined", ({ socketId, username: otherUsername }) => {
      // add to list (will receive offer/answer)
      setRemotePeers((list) => {
        if (list.find((p) => p.socketId === socketId)) return list;
        return [...list, { socketId, username: otherUsername, stream: null }];
      });
    });

    socketRef.current.on("signal", (fromId, payload) => {
      handleSignal(fromId, payload);
    });

    socketRef.current.on("chat-message", (text, sender) => {
      setChatMessages((m) => [...m, { sender, text }]);
    });

    socketRef.current.on("chat-history", (history) => {
      setChatMessages(history.map((h) => ({ sender: h.sender, text: h.text })));
    });

    socketRef.current.on("user-left", (socketId) => {
      cleanupPeer(socketId);
    });
  };

  const joinRoom = async () => {
    if (!username.trim()) {
      alert("Enter username");
      return;
    }
    setInLobby(false);
    await connectSocket();
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit("chat-message", chatInput, username);
    setChatMessages((m) => [...m, { sender: username, text: chatInput }]);
    setChatInput("");
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      alert("Screen share not supported.");
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace track on each peer sender
      Object.values(peersRef.current).forEach(({ senders }) => {
        if (senders && senders.video) {
          senders.video.replaceTrack(screenTrack).catch((e) => console.warn("replaceTrack err", e));
        }
      });

      // Show local video as screen
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setScreenSharing(true);

      screenTrack.onended = async () => {
        const localStream = localStreamRef.current || (await getLocalMedia());
        const cameraTrack = localStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(({ senders }) => {
          if (senders && senders.video) senders.video.replaceTrack(cameraTrack).catch((e) => {});
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        setScreenSharing(false);
      };
    } catch (err) {
      console.error("Screen share error", err);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {inLobby ? (
        <div id="lobby">
          <h2>Enter Lobby</h2>
          <TextField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            label="Username"
            variant="outlined"
          />
          <Button variant="contained" onClick={joinRoom} style={{ marginLeft: 8 }}>
            Connect
          </Button>
          <div style={{ marginTop: 12 }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 320, border: "1px solid #ccc" }} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <h3>You: {username}</h3>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 320, border: "1px solid #ccc" }} />
            <div style={{ marginTop: 8 }}>
              <Button variant="contained" onClick={startScreenShare}>
                {screenSharing ? "Sharing Screen" : "Share Screen"}
              </Button>
            </div>
          </div>

          <div>
            <h3>Remotes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {remotePeers.map((p) => (
                <div key={p.socketId} style={{ border: "1px solid #ddd", padding: 8 }}>
                  <strong>{p.username || p.socketId}</strong>
                  <div>
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (!el) return;
                        // find the latest stream for this peer
                        const found = remotePeers.find((r) => r.socketId === p.socketId && r.stream);
                        if (found && found.stream && el.srcObject !== found.stream) {
                          el.srcObject = found.stream;
                        }
                      }}
                      style={{ width: 320, marginTop: 6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 300 }}>
            <h3>Chat</h3>
            <div style={{ height: 300, overflowY: "auto", border: "1px solid #ccc", padding: 8 }}>
              {chatMessages.map((m, i) => (
                <div key={i}>
                  <strong>{m.sender}: </strong>
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <TextField  InputPros={{ style: { color: "red", fontSize: "16px" } }}  value={chatInput} onChange={(e) => setChatInput(e.target.value)} label="Message" variant="outlined" />
              <Button onClick={sendChat} variant="contained" style={{ marginLeft: 8 }}>
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
