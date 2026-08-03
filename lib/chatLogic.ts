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

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
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
 * Subscribes to `users/{uid}/contacts`, ordered by most recent activity.
 * Calls `callback` with the full contact list on every change.
 * Returns an unsubscribe function — call it on unmount.
 */
export function listenToContacts(
  uid: string,
  callback: (contacts: Contact[]) => void
): () => void {
  const contactsRef = query(ref(database, `users/${uid}/contacts`), orderByChild("lastMessageTime"));

  const handler = (snapshot: DataSnapshot) => {
    const list: Contact[] = [];
    snapshot.forEach((child) => {
      list.push({ id: child.key as string, ...child.val() });
    });
    // Most recent conversation first
    list.reverse();
    callback(list);
  };

  onValue(contactsRef, handler);
  return () => off(contactsRef, "value", handler);
}

/**
 * Creates a contact if it doesn't exist yet (e.g. first inbound message
 * from a new WhatsApp number, or manually starting a new chat).
 */
export async function upsertContact(
  uid: string,
  contactId: string,
  data: Partial<Contact>
): Promise<void> {
  const contactRef = ref(database, `users/${uid}/contacts/${contactId}`);
  await update(contactRef, data);
}

export async function markContactRead(uid: string, contactId: string): Promise<void> {
  const contactRef = ref(database, `users/${uid}/contacts/${contactId}`);
  await update(contactRef, { unreadCount: 0 });
}

export async function setContactWallpaper(
  uid: string,
  contactId: string,
  wallpaperId: string
): Promise<void> {
  const contactRef = ref(database, `users/${uid}/contacts/${contactId}`);
  await update(contactRef, { wallpaperId });
}

// ─────────────────────────────────────────────────────────────────────────
// 3. CHAT THREAD (Firebase RTDB — messages for one contact)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Subscribes to `users/{uid}/chats/{contactId}/messages`.
 * Calls `callback` with the ordered message array on every change.
 * Returns an unsubscribe function.
 */
export function listenToChat(
  uid: string,
  contactId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const msgsRef = query(
    ref(database, `users/${uid}/chats/${contactId}/messages`),
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
 * Writes a single message into `users/{uid}/chats/{contactId}/messages`
 * and bumps the contact's `lastMessage` / `lastMessageTime` preview.
 * Returns the generated Firebase key (== message id).
 */
export async function saveMessageToFirebase(
  uid: string,
  contactId: string,
  message: Omit<ChatMessage, "id">
): Promise<string> {
  const msgsRef = ref(database, `users/${uid}/chats/${contactId}/messages`);
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

  await upsertContact(uid, contactId, {
    lastMessage: previewText,
    lastMessageTime: message.timestamp,
  });

  return newRef.key as string;
}

export async function updateMessageStatus(
  uid: string,
  contactId: string,
  messageId: string,
  status: ChatMessage["status"]
): Promise<void> {
  const msgRef = ref(database, `users/${uid}/chats/${contactId}/messages/${messageId}`);
  await update(msgRef, { status });
}

export async function deleteMessageFromFirebase(
  uid: string,
  contactId: string,
  messageId: string
): Promise<void> {
  const msgRef = ref(database, `users/${uid}/chats/${contactId}/messages/${messageId}`);
  await remove(msgRef);
}

export async function deleteMessagesFromFirebase(
  uid: string,
  contactId: string,
  messageIds: string[]
): Promise<void> {
  const updates: Record<string, null> = {};
  messageIds.forEach((id) => {
    updates[`users/${uid}/chats/${contactId}/messages/${id}`] = null;
  });
  await update(ref(database), updates);
}

export async function clearChatInFirebase(uid: string, contactId: string): Promise<void> {
  const msgsRef = ref(database, `users/${uid}/chats/${contactId}/messages`);
  await remove(msgsRef);
  await upsertContact(uid, contactId, { lastMessage: "", lastMessageTime: Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────
// 4. CLOUDINARY (permanent hosting for attachments, used for the bubble URL
//    that gets persisted to Firebase — local blob: URLs don't survive reload)
// ─────────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  secureUrl: string;
  bytes: number;
  format: string;
}

/**
 * Uploads a File to Cloudinary using an unsigned upload preset.
 * `cloudName` / `uploadPreset` come from the user's saved config.
 */
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  // Cloudinary infers resource type from the endpoint; "auto" handles
  // images, video and raw documents/audio in one endpoint.
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
// 5. META GRAPH API (send messages, upload media, fetch templates)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Uploads a local file to Meta's `/media` endpoint. Meta requires media to
 * be uploaded there first — the returned id is what gets referenced inside
 * an actual `/messages` payload.
 */
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

/**
 * Sends an already-built WhatsApp Cloud API payload to Meta's `/messages`
 * endpoint. This is the single low-level "talk to Facebook" function —
 * every message type (text/media/location/template) funnels through it.
 */
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

/**
 * Fetches every approved message template for the given WABA id.
 */
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
//    These are the functions the UI actually calls. Each one: builds the
//    Firebase message record, saves it, resolves media (Cloudinary for a
//    durable URL + Meta media-id for delivery), then calls Meta to deliver.
// ─────────────────────────────────────────────────────────────────────────

interface SendTextParams {
  uid: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  text: string;
  replyTo?: string | null;
}

export async function sendTextMessage({
  uid,
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

  const id = await saveMessageToFirebase(uid, contactId, base);

  try {
    await sendToMetaAPI(config.phoneId, config.accessToken, {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: text },
    });
  } catch (err) {
    await updateMessageStatus(uid, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}

interface SendMediaParams {
  uid: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  file: File;
  type: "image" | "video" | "document" | "audio";
}

export async function sendMediaMessage({
  uid,
  contactId,
  recipientPhone,
  config,
  file,
  type,
}: SendMediaParams): Promise<ChatMessage> {
  // 1. Push a durable copy to Cloudinary so the bubble still renders after reload.
  let mediaUrl = "";
  if (config.cloudinaryCloudName && config.cloudinaryUploadPreset) {
    const uploaded = await uploadToCloudinary(
      file,
      config.cloudinaryCloudName,
      config.cloudinaryUploadPreset
    );
    mediaUrl = uploaded.secureUrl;
  } else {
    // Fallback so the UI still has something to render immediately.
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

  const id = await saveMessageToFirebase(uid, contactId, base);

  try {
    // 2. Upload to Meta separately — Meta needs its own media id, distinct
    //    from the Cloudinary URL used for display.
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
    await updateMessageStatus(uid, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}

interface SendLocationParams {
  uid: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  lat: number;
  lng: number;
}

export async function sendLocationMessage({
  uid,
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

  const id = await saveMessageToFirebase(uid, contactId, base);

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
    await updateMessageStatus(uid, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}

interface SendTemplateParams {
  uid: string;
  contactId: string;
  recipientPhone: string;
  config: UserConfig;
  template: MetaTemplate;
}

export async function sendTemplateMessage({
  uid,
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

  const id = await saveMessageToFirebase(uid, contactId, base);

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
    await updateMessageStatus(uid, contactId, id, "failed");
    throw err;
  }

  return { id, ...base };
}
