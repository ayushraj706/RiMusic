import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "7d"; // 24h, 7d, 15d, 30d

  try {
    // 1. Calculate Date Range
    const now = new Date();
    let startDate = new Date();
    
    if (range === "24h") startDate.setHours(now.getHours() - 24);
    else if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "15d") startDate.setDate(now.getDate() - 15); // NAYA: 15 Din ka filter add kiya
    else if (range === "30d") startDate.setDate(now.getDate() - 30);

    // 2. Fetch Base Stats (Independent of time range for total system view)
    const totalContacts = await prisma.contact.count();
    const googleContacts = await prisma.contact.count({ where: { source: "google" } });
    const csvContacts = await prisma.contact.count({ where: { source: "csv" } });
    const manualContacts = await prisma.contact.count({ where: { source: "manual" } });
    
    const activeSessions = await prisma.contact.count({ where: { isSessionActive: true } });
    const systemSettings = await prisma.systemSettings.findFirst();
    const activeFlowsCount = await prisma.chatFlow.count({ where: { isActive: true } });
    const approvedTemplatesCount = await prisma.template.count({ where: { status: "APPROVED" } });
    const activeApiKeys = await prisma.apiKey.count({ where: { isRevoked: false } });

    // 3. Fetch Time-Filtered Messages
    const messages = await prisma.message.findMany({
      where: { timestamp: { gte: startDate } },
      orderBy: { timestamp: 'asc' }
    });

    // 4. Analytics Data Aggregation (ZERO DUMMY DATA)
    const stats = {
      outbound: { total: 0, read: 0, delivered: 0, sent: 0, chat: 0, flow: 0, api: 0, campaign: 0 },
      inbound: { total: 0, text: 0, image: 0, video: 0, document: 0, audio: 0, location: 0, sticker: 0, interactive: 0 },
      types: { template: 0, text: 0, media: 0, interactive: 0 }
    };

    // Process every single message exactly as it is in the database
    messages.forEach(msg => {
      if (msg.direction === "OUTBOUND") {
        stats.outbound.total++;
        if (msg.status === "READ") stats.outbound.read++;
        else if (msg.status === "DELIVERED") stats.outbound.delivered++;
        else stats.outbound.sent++;

        // Source Breakdown
        if (msg.source === "CHAT") stats.outbound.chat++;
        if (msg.source === "FLOW") stats.outbound.flow++;
        if (msg.source === "API") stats.outbound.api++;
        if (msg.source === "CAMPAIGN") stats.outbound.campaign++;

        // Outbound Type Breakdown
        if (msg.type === "TEMPLATE") stats.types.template++;
        else if (msg.type === "TEXT") stats.types.text++;
        else if (msg.type === "INTERACTIVE") stats.types.interactive++;
        else stats.types.media++;
      } else {
        // INBOUND
        stats.inbound.total++;
        if (msg.type === "TEXT") stats.inbound.text++;
        else if (msg.type === "IMAGE") stats.inbound.image++;
        else if (msg.type === "VIDEO") stats.inbound.video++;
        else if (msg.type === "DOCUMENT") stats.inbound.document++;
        else if (msg.type === "AUDIO") stats.inbound.audio++;
        else if (msg.type === "LOCATION") stats.inbound.location++;
        else if (msg.type === "STICKER") stats.inbound.sticker++;
        else if (msg.type === "INTERACTIVE") stats.inbound.interactive++;
      }
    });

    // 5. Generate Continuous Chart Data (Time Series for Graph)
    const chartData: any[] = [];
    const intervalMap = new Map();

    messages.forEach(msg => {
      let key = "";
      if (range === "24h") {
        key = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      } else {
        // Yeh logic 7d, 15d, aur 30d teeno ke liye perfectly kaam karega
        key = new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!intervalMap.has(key)) intervalMap.set(key, { date: key, sent: 0, received: 0 });
      
      const bucket = intervalMap.get(key);
      if (msg.direction === "OUTBOUND") bucket.sent++;
      else bucket.received++;
    });

    // Convert map to array
    intervalMap.forEach(val => chartData.push(val));

    const readRate = stats.outbound.total > 0 ? Math.round((stats.outbound.read / stats.outbound.total) * 100) : 0;

    return NextResponse.json({
      contacts: { total: totalContacts, google: googleContacts, csv: csvContacts, manual: manualContacts },
      system: {
        botActive: systemSettings?.isAiBotActive || false,
        activeFlows: activeFlowsCount,
        approvedTemplates: approvedTemplatesCount,
        activeApiKeys: activeApiKeys,
        activeSessions: activeSessions
      },
      outbound: stats.outbound,
      inbound: stats.inbound,
      types: stats.types,
      readRate,
      chartData
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
