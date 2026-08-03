/**
 * lib/chatLogic.ts
 * ─────────────────────────────────────────────────────────────────────────
 * LAYER 1 — SERVICE / BACKEND LAYER
 *
 * This file owns every external API call the app makes:
 *   - Firebase Realtime Database (contacts, chat threads, user config)
 *   - Cloudinary (permanent media hosting for chat attachments)
 *   - Meta WhatsApp Cloud API (send messages, upload media, fetch templates)
 *
 * RULES ENFORCED IN THIS FILE:
 *   1. No JSX / React / UI code lives here.
 *   2. The UI layer never calls `fetch()` against Meta or Firebase `set()`
 *      directly — it only imports and calls the functions exported below.
 *   3. Every function is pure input -> side-effect/output, easy to test
 *      and swap out later (e.g. moving Cloudinary -> S3).
 * ─────────────────────────────────────────────────────────────────────────
 */

import axios from "axios";
import { database } from "./firebase"; // existing firebase app init (auth + rtdb)
import {
  ref,
  push,
  set,
  update,
  remove,
  get,
  onValue,
  off,
  query,
  orderByChild,
  serverTimestamp,
  DataSnapshot,
} from "firebase/database";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "document"
  | "audio"
  | "location"
  | "template";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  timestamp: number;
  status?: "sent" | "delivered" | "read" | "failed";
  replyTo?: string | null;
  type: MessageType;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  location?: { lat: number; lng: number };
  templateName?: string;
}

// Updated to match the "info" node in your Firebase DB structure
export interface Contact {
  id: string;
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  lastMessage?: string;
  updatedAt?: number;
  unread?: number;
  wallpaperId?: string;
}

export interface UserConfig {
  phoneId: string;
  accessToken: string;
  wabaId?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
}

export interface MetaTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  components?: any[];
}

// ─────────────────────────────────────────────────────────────────────────
// Small internal helpers (not exported — implementation detail only)
// ─────────────────────────────────────────────────────────────────────────

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function graphUrl(path: string): string {
  return `https://graph.facebook.com/v21.0/${path}`;
}

// ─────────────────────────────────────────────────────────────────────────
// 1. USER CONFIG (Firebase)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Reads the logged-in user's Meta/Cloudinary credentials from
 * `users/{uid}/config`. Returns null if not configured yet.
 * Note: Config usually remains under Auth UID even if chats are under phoneId.
 */
export async function getUserConfig(uid: string): Promise<UserConfig | null> {
  const configRef = ref(database, `users/${uid}/config`);
  const snapshot = await get(configRef);
  if (!snapshot.exists()) return null;
  const val = snapshot.val();
  if (!val.phoneId || !val.accessToken) return null;
  return {
    phoneId: val.phoneId,
    accessToken: val.accessToken,
    wabaId: val.wabaId,
    cloudinaryCloudName: val.cloudinaryCloudName,
    cloudinaryUploadPreset: val.cloudinaryUploadPreset,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. CONTACTS (Firebase RTDB — real-time sidebar list)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to `chats/{phoneId}`, lists all contacts and their `info`.
 * Calls `callback` with the full contact list on every change.
 */
export function listenToContacts(
  phoneId: string,
  callback: (contacts: Contact[]) => void
): () => void {
  const chatsRef = ref(database, `chats/${phoneId}`);

  const handler = (snapshot: DataSnapshot) => {
    const list: Contact[] = [];
    snapshot.forEach((child) => {
      const contactData = child.val();
      // Extract only the 'info' node to build the contact list
      if (contactData && contactData.info) {
        list.push({ id: child.key as string, ...contactData.info });
      }
    });
    
    // Sort by most recent activity (updatedAt)
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    callback(list);
  };

  onValue(chatsRef, handler);
  return () => off(chatsRef, "value", handler);
}

/**
 * Updates or creates the `info` node for a specific contact.
 */
export async function upsertContact(
  phoneId: string,
  contactId: string,
  data: Partial<Contact>
): Promise<void> {
  const infoRef = ref(database, `chats/${phoneId}/${contactId}/info`);
  await update(infoRef, data);
}

export async function markContactRead(phoneId: string, contactId: string): Promise<void> {
  const infoRef = ref(database, `chats/${phoneId}/${contactId}/info`);
  await update(infoRef, { unread: 0 });
}

export async function setContactWallpaper(
  phoneId: string,
  contactId: string,
  wallpaperId: string
): Promise<void> {
  const infoRef = ref(database, `chats/${phoneId}/${contactId}/info`);
  await update(infoRef, { wallpaperId });
}

// ─────────────────────────────────────────────────────────────────────────
// 3. CHAT THREAD (Firebase RTDB — messages for one contact)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to `chats/{phoneId}/{contactId}/messages`.
 */
export function listenToChat(
  phoneId: string,
  contactId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const msgsRef = query(
    ref(database, `chats/${phoneId}/${contactId}/messages`),
    orderByChild("timestamp")
  );

  const handler = (snapshot: DataSnapshot) => {
    const list: ChatMessage[] = [];
    snapshot.forEach((child) => {
      list.push({ id: child.key as string, ...child.val() });
    });
    callback(list);
  };

  onValue(msgsRef, handler);
  return () => off(msgsRef, "value", handler);
}

/**
 * Writes a single message into `chats/{phoneId}/{contactId}/messages`
 * and bumps the contact's `lastMessage` / `updatedAt` preview in `info`.
 */
export async function saveMessageToFirebase(
  phoneId: string,
  contactId: string,
  message: Omit<ChatMessage, "id">
): Promise<string> {
  const msgsRef = ref(database, `chats/${phoneId}/${contactId}/messages`);
  const newRef = push(msgsRef);
  await set(newRef, message);

  const previewText =
    message.type === "text"
      ? message.text
      : message.type === "template"
      ? `📋 Template: ${message.templateName}`
      : message.type === "location"
      ? "📍 Location"
      : `📎 ${message.type[0].toUpperCase()}${message.type.slice(1)}`;

  await upsertContact(phoneId, contactId, {
    lastMessage: previewText,
    updatedAt: message.timestamp,
  });

  return newRef.key as string;
}

export async function updateMessageStatus(
  phoneId: string,
  contactId: string,
  messageId: string,
  status: ChatMessage["status"]
): Promise<void> {
  const msgRef = ref(database, `chats/${phoneId}/${contactId}/messages/${messageId}`);
  await update(msgRef, { status });
}

export async function deleteMessageFromFirebase(
  phoneId: string,
  contactId: string,
  messageId: string
): Promise<void> {
  const msgRef = ref(database, `chats/${phoneId}/${contactId}/messages/${messageId}`);
  await remove(msgRef);
}

export async function deleteMessagesFromFirebase(
  phoneId: string,
  contactId: string,
  messageIds: string[]
): Promise<void> {
  const updates: Record<string, null> = {};
  messageIds.forEach((id) => {
    updates[`chats/${phoneId}/${contactId}/messages/${id}`] = null;
  });
  await update(ref(database), updates);
}

export async function clearChatInFirebase(phoneId: string, contactId: string): Promise<void> {
  const msgsRef = ref(database, `chats/${phoneId}/${contactId}/messages`);
  await remove(msgsRef);
  await upsertContact(phoneId, contactId, { lastMessage: "", updatedAt: Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────
// 4. CLOUDINARY
// ─────────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  secureUrl: string;
  bytes: number;
  format: string;
}

export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const { data } = await axios.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    secureUrl: data.secure_url,
    bytes: data.bytes,
    format: data.format,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 5. META GRAPH API
// ─────────────────────────────────────────────────────────────────────────

export async function uploadMediaToMeta(
  phoneId: string,
  accessToken: string,
  file: File
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("messaging_product", "whatsapp");

  const res = await fetch(graphUrl(`${phoneId}/media`), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.id as string;
}

export async function sendToMetaAPI(
  phoneId: string,
  accessToken: string,
  payload: Record<string, any>
): Promise<any> {
  const res = await fetch(graphUrl(`${phoneId}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function fetchMetaTemplates(
  wabaId: string,
  accessToken: string
): Promise<MetaTemplate[]> {
  const res = await fetch(graphUrl(`${wabaId}/message_templates`), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.data || []).filter((t: MetaTemplate) => t.status === "APPROVED");
}

// ─────────────────────────────────────────────────────────────────────────
// 6. HIGH-LEVEL ORCHESTRATION
// ─────────────────────────────────────────────────────────────────────────

interface SendTextParams {
  phoneId: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  text: string;
  replyTo?: string | null;
}

export async function sendTextMessage({
  phoneId,
  contactId,
  recipientPhone,
  config,
  text,
  replyTo,
}: SendTextParams): Promise<ChatMessage> {
  const base: Omit<ChatMessage, "id"> = {
    text,
    sender: "me",
    time: nowTimeLabel(),
    timestamp: Date.now(),
    status: "sent",
    type: "text",
    replyTo: replyTo ?? null,
  };

  const id = await saveMessageToFirebase(phoneId, contactId, base);

  try {
    await sendToMetaAPI(config.phoneId, config.accessToken, {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: text },
    });
  } catch (err) {
    await updateMessageStatus(phoneId, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}

interface SendMediaParams {
  phoneId: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  file: File;
  type: "image" | "video" | "document" | "audio";
}

export async function sendMediaMessage({
  phoneId,
  contactId,
  recipientPhone,
  config,
  file,
  type,
}: SendMediaParams): Promise<ChatMessage> {
  let mediaUrl = "";
  if (config.cloudinaryCloudName && config.cloudinaryUploadPreset) {
    const uploaded = await uploadToCloudinary(
      file,
      config.cloudinaryCloudName,
      config.cloudinaryUploadPreset
    );
    mediaUrl = uploaded.secureUrl;
  } else {
    mediaUrl = URL.createObjectURL(file);
  }

  const base: Omit<ChatMessage, "id"> = {
    text: "",
    sender: "me",
    time: nowTimeLabel(),
    timestamp: Date.now(),
    status: "sent",
    type,
    mediaUrl,
    mediaName: file.name,
    mediaSize: formatBytes(file.size),
  };

  const id = await saveMessageToFirebase(phoneId, contactId, base);

  try {
    const mediaId = await uploadMediaToMeta(config.phoneId, config.accessToken, file);
    const mediaObject: Record<string, any> = { id: mediaId };
    if (type === "document") mediaObject.filename = file.name;

    await sendToMetaAPI(config.phoneId, config.accessToken, {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type,
      [type]: mediaObject,
    });
  } catch (err) {
    await updateMessageStatus(phoneId, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}

interface SendLocationParams {
  phoneId: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  lat: number;
  lng: number;
}

export async function sendLocationMessage({
  phoneId,
  contactId,
  recipientPhone,
  config,
  lat,
  lng,
}: SendLocationParams): Promise<ChatMessage> {
  const base: Omit<ChatMessage, "id"> = {
    text: "",
    sender: "me",
    time: nowTimeLabel(),
    timestamp: Date.now(),
    status: "sent",
    type: "location",
    location: { lat, lng },
  };

  const id = await saveMessageToFirebase(phoneId, contactId, base);

  try {
    await sendToMetaAPI(config.phoneId, config.accessToken, {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "location",
      location: {
        latitude: lat,
        longitude: lng,
        name: "Current Location",
        address: "Shared via BaseKey",
      },
    });
  } catch (err) {
    await updateMessageStatus(phoneId, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}

interface SendTemplateParams {
  phoneId: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  template: MetaTemplate;
}

export async function sendTemplateMessage({
  phoneId,
  contactId,
  recipientPhone,
  config,
  template,
}: SendTemplateParams): Promise<ChatMessage> {
  const base: Omit<ChatMessage, "id"> = {
    text: "",
    sender: "me",
    time: nowTimeLabel(),
    timestamp: Date.now(),
    status: "sent",
    type: "template",
    templateName: template.name,
  };

  const id = await saveMessageToFirebase(phoneId, contactId, base);

  try {
    await sendToMetaAPI(config.phoneId, config.accessToken, {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
      },
    });
  } catch (err) {
    await updateMessageStatus(phoneId, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}
