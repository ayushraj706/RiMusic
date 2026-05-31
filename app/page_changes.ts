// ─── page.tsx mein sirf yeh changes karo ────────────────────────────────────

// 1. Message interface mein "audio" type already hai — theek hai.

// 2. handleSendMedia signature update karo (audio type add):
const handleSendMedia = async (
  file: File,
  type: "image" | "video" | "document" | "audio"  // ← audio add kiya
): Promise<void> => {
  if (!activeContact || !phoneId || !accessToken) return;

  const recipientPhone = activeContact.phoneNumber;
  const now = Date.now();
  const localUrl = URL.createObjectURL(file);

  // WhatsApp media type determine karo
  const waType =
    type === "audio" ? "audio"       // ← pehle audio check karo
    : type === "image" ? "image"
    : type === "video" ? "video"
    : file.type.startsWith("audio") ? "audio"
    : "document";

  const tempId = `temp_media_${now}`;
  const optimisticMsg: Message = {
    id: tempId,
    text: "",
    sender: "me",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestamp: now,
    status: "sent",
    mediaType: waType as Message["mediaType"],
    mediaUrl: localUrl,
    mediaName: file.name,
  };

  setMessages((prev) => ({
    ...prev,
    [activeContact.id]: [...(prev[activeContact.id] || []), optimisticMsg],
  }));

  try {
    // ── 1. Upload to WhatsApp ──
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", file);
    formData.append("type", file.type); // "audio/ogg" ya "image/jpeg" etc.

    const uploadRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      }
    );
    const uploadData = await uploadRes.json();

    if (uploadData.error) throw new Error(uploadData.error.message);

    const mediaId: string = uploadData.id;

    // ── 2. Send via WhatsApp API ──
    const msgPayload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientPhone,
      type: waType,
      [waType]: { id: mediaId },
    };

    const sendRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msgPayload),
      }
    );
    const sendData = await sendRes.json();
    if (sendData.error) throw new Error(sendData.error.message);

    playSendSound();

    // ── 3. Firebase mein save karo ──
    const msgRef = ref(database, `chats/${phoneId}/${recipientPhone}/messages`);
    const newMsgRef = push(msgRef);
    await set(newMsgRef, {
      text: "",
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now,
      status: "sent",
      mediaType: waType,
      mediaUrl: localUrl,
      mediaName: file.name,
      mediaId,
      metaId: sendData.messages?.[0]?.id || null,
    });

    const lastMsg =
      waType === "image" ? "Photo"
      : waType === "video" ? "Video"
      : waType === "audio" ? "Voice message"
      : file.name;

    const infoRef = ref(database, `chats/${phoneId}/${recipientPhone}/info`);
    await set(infoRef, {
      name: activeContact.name,
      phoneNumber: recipientPhone,
      lastMessage: lastMsg,
      updatedAt: now,
      unread: 0,
    });

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: (prev[activeContact.id] || []).map((m) =>
        m.id === tempId ? { ...m, mediaId, status: "sent" } : m
      ),
    }));
  } catch (err: any) {
    alert(`Media send failed: ${err.message}`);
    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: (prev[activeContact.id] || []).filter((m) => m.id !== tempId),
    }));
    URL.revokeObjectURL(localUrl);
  }
};

// 3. ChatInput onSendMedia prop ka type bhi update karo:
// onSendMedia={handleSendMedia}  ← yeh same rehta hai, type match ho jaayega
