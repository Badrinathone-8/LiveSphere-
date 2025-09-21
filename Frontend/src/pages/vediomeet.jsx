// src/components/Vediomeet.jsx
import React, { useRef, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { AuthContext } from "../contexts/authContext";
import "../styles/videocomponent.css";

const SOCKET_SERVER_URL = "https://livesphere-backend-1sod.onrender.com";
const ICE_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function Vediomeet() {
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const localVideoRef = useRef(null);

  const [username, setUsername] = useState(user?.username || "");
  const [inLobby, setInLobby] = useState(true);
  const [remotePeers, setRemotePeers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [screenSharing, setScreenSharing] = useState(false);

  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach((p) => p.pc.close());
      const s = localStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const getLocalMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
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
        if (exists) return list.map((p) => (p.socketId === peerId ? { ...p, stream: remoteStream } : p));
        return [...list, { socketId: peerId, username: "Unknown", stream: remoteStream }];
      });
    };

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

  const handleSignal = async (fromId, payload) => {
    if (!peersRef.current[fromId]) createPeerConnection(fromId);
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
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  const joinRoom = async () => {
    if (!username.trim()) return alert("Enter username");
    setInLobby(false);
    await getLocalMedia();

    socketRef.current = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", { room: window.location.href, username });
    });

    socketRef.current.on("room-clients", ({ clients }) => {
      const ids = clients.map((c) => c.socketId);
      ids.forEach(async (id) => {
        if (id !== socketRef.current.id && !peersRef.current[id]) {
          const pc = createPeerConnection(id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit("signal", id, { type: "sdp", sdp: pc.localDescription });
        }
      });

      setRemotePeers(clients.map((c) => ({ socketId: c.socketId, username: c.username, stream: null })));
    });

    socketRef.current.on("user-joined", ({ socketId, username: otherUsername }) => {
      setRemotePeers((list) => [...list, { socketId, username: otherUsername, stream: null }]);
    });

    socketRef.current.on("signal", handleSignal);

    socketRef.current.on("user-left", (socketId) => {
      const peer = peersRef.current[socketId];
      if (peer) peer.pc.close();
      delete peersRef.current[socketId];
      setRemotePeers((list) => list.filter((p) => p.socketId !== socketId));
    });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit("chat-message", chatInput, username);
    setChatMessages((m) => [...m, { sender: username, text: chatInput }]);
    setChatInput("");
  };

  return (
    <div style={{ padding: 16 }}>
      {inLobby ? (
        <div id="lobby">
          <h2>Enter Lobby</h2>
          <TextField value={username} onChange={(e) => setUsername(e.target.value)} label="Username" variant="outlined" />
          <Button variant="contained" onClick={joinRoom} style={{ marginLeft: 8 }}>Connect</Button>
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
              <Button variant="contained" onClick={() => alert("Screen Share Coming Soon!")}>
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
                  <video autoPlay playsInline
                    ref={(el) => {
                      if (!el) return;
                      const found = remotePeers.find((r) => r.socketId === p.socketId && r.stream);
                      if (found && found.stream && el.srcObject !== found.stream) el.srcObject = found.stream;
                    }}
                    style={{ width: 320, marginTop: 6 }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 300 }}>
            <h3>Chat</h3>
            <div style={{ height: 300, overflowY: "auto", border: "1px solid #000", padding: 8 }}>
              {chatMessages.map((m, i) => (
                <div key={i}><strong>{m.sender}: </strong><span>{m.text}</span></div>
              ))}
            </div>
            <TextField value={chatInput} onChange={(e) => setChatInput(e.target.value)} label="Message" variant="outlined" style={{ width: "70%" }} />
            <Button onClick={sendChat} variant="contained" style={{ marginLeft: 8 }}>Send</Button>
          </div>
        </div>
      )}
    </div>
  );
}
