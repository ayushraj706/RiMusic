// lib/whatsapp/engine.ts
import { db } from "@/prisma/lib/db"; // your Prisma client singleton
import type { WhatsAppNode, WhatsAppNodeData } from "@/store/useChatbotStore";
import type { Edge } from "@xyflow/react";
import { sendWhatsAppMessage } from "./sender";

interface FlowGraph {
  nodes: WhatsAppNode[];
  edges: Edge[];
}

interface IncomingSignal {
  type: "text" | "button_reply" | "list_reply" | "start";
  value: string; // text body, OR button/list reply id
}

// ─── 1. Find the entry node: the one node nobody points TO ───
function findEntryNode(graph: FlowGraph): WhatsAppNode | null {
  const targets = new Set(graph.edges.map((e) => e.target));
  return graph.nodes.find((n) => !targets.has(n.id)) ?? graph.nodes[0] ?? null;
}

// ─── 2. Given current node + signal, find which edge to follow ───
function resolveNextEdge(node: WhatsAppNode, signal: IncomingSignal, graph: FlowGraph): Edge | null {
  const outgoing = graph.edges.filter((e) => e.source === node.id);
  if (outgoing.length === 0) return null;

  if (node.data.type === "buttons" && signal.type === "button_reply") {
    const handleId = `btn-${signal.value}`;
    return outgoing.find((e) => e.sourceHandle === handleId) ?? outgoing.find((e) => e.sourceHandle === "default") ?? outgoing[0];
  }

  if (node.data.type === "list" && signal.type === "list_reply") {
    const handleId = `row-${signal.value}`;
    return outgoing.find((e) => e.sourceHandle === handleId) ?? outgoing.find((e) => e.sourceHandle === "default") ?? outgoing[0];
  }

  // Plain text/media nodes just fall through
  return outgoing.find((e) => e.sourceHandle === "default") ?? outgoing[0];
}

// ─── 3. Render + send a node's content via Meta API, return true if it PAUSES (waits for reply) ───
async function renderNode(node: WhatsAppNode, phoneId: string, to: string): Promise<boolean> {
  const data = node.data as WhatsAppNodeData;

  switch (data.type) {
    case "text":
      await sendWhatsAppMessage(phoneId, to, { type: "text", text: { body: data.body } });
      return false; // auto-continue to next node

    case "media":
      await sendWhatsAppMessage(phoneId, to, {
        type: data.mediaType,
        [data.mediaType]: { link: data.mediaUrl, caption: data.caption },
      });
      return false;

    case "buttons":
      await sendWhatsAppMessage(phoneId, to, {
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: data.body },
          footer: data.footer ? { text: data.footer } : undefined,
          action: {
            buttons: data.buttons.map((b: any) => ({
              type: "reply",
              reply: { id: b.id, title: b.text.slice(0, 20) }, // Meta caps button titles at 20 chars
            })),
          },
        },
      });
      return true; // PAUSE — waiting for user tap

    case "list":
      await sendWhatsAppMessage(phoneId, to, {
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: data.body },
          action: {
            button: data.buttonText,
            sections: data.sections.map((s: any) => ({
              title: s.title,
              rows: s.rows.map((r: any) => ({ id: r.id, title: r.title, description: r.description })),
            })),
          },
        },
      });
      return true; // PAUSE — waiting for user selection
      
    default:
      return false;
  }
}

// ─── 4. THE ENGINE — call this from the webhook ───
export async function runFlowEngine(
  phoneId: string, 
  from: string, 
  signal: IncomingSignal, 
  userId: string, 
  flowData: any
) {
  // 1. Agar Firebase se flow data khali aaya, toh flow run nahi hoga
  if (!flowData || !flowData.nodes || !flowData.edges) {
    console.log(`⚠️ No active flow data found in Firebase for userId: ${userId}`);
    return;
  }

  // 2. Firebase se mile data ko Graph mein set kar diya
  const graph: FlowGraph = {
    nodes: flowData.nodes as WhatsAppNode[],
    edges: flowData.edges as Edge[]
  };

  const contact = await db.contact.findUnique({ where: { phoneNumber: from } });
  let currentNode: WhatsAppNode | null = null;

  if (!contact?.activeFlowNodeId) {
    // Fresh conversation — start at entry node regardless of what they typed
    currentNode = findEntryNode(graph);
  } else {
    const cursor = graph.nodes.find((n) => n.id === contact.activeFlowNodeId) ?? null;
    if (cursor) {
      const edge = resolveNextEdge(cursor, signal, graph);
      currentNode = edge ? graph.nodes.find((n) => n.id === edge.target) ?? null : null;
    }
  }

  // Walk forward, auto-rendering non-interactive nodes, until we hit a PAUSE or dead end
  while (currentNode) {
    const paused = await renderNode(currentNode, phoneId, from);

    await db.contact.upsert({
      where: { phoneNumber: from },
      update: { activeFlowNodeId: paused ? currentNode.id : null },
      create: { phoneNumber: from, activeFlowNodeId: paused ? currentNode.id : null },
    });

    if (paused) return; // stop and wait for the next inbound message

    const nextEdge = graph.edges.find((e) => e.source === currentNode!.id);
    currentNode = nextEdge ? graph.nodes.find((n) => n.id === nextEdge.target) ?? null : null;
  }
}
