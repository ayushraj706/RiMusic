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
    else if (range === "15d") startDate.setDate(now.getDate() - 15);
    else if (range === "30d") startDate.setDate(now.getDate() - 30);

    // 2. Fetch Base Stats parallel for speed
    const [
      totalContacts, googleContacts, csvContacts, manualContacts,
      activeSessions, systemSettings, activeFlowsCount,
      approvedTemplatesCount, activeApiKeys, messages
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { source: "google" } }),
      prisma.contact.count({ where: { source: "csv" } }),
      prisma.contact.count({ where: { source: "manual" } }),
      prisma.contact.count({ where: { isSessionActive: true } }),
      prisma.systemSettings.findFirst(),
      prisma.chatFlow.count({ where: { isActive: true } }),
      prisma.template.count({ where: { status: "APPROVED" } }),
      prisma.apiKey.count({ where: { isRevoked: false } }),
      prisma.message.findMany({
        where: { timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' }
      })
    ]);

    // 3. Analytics Data Aggregation (100% REAL DATA FROM DB)
    const stats = {
      outbound: { total: 0, read: 0, delivered: 0, sent: 0, chat: 0, flow: 0, api: 0, campaign: 0 },
      inbound: { total: 0, text: 0, image: 0, video: 0, document: 0, audio: 0, location: 0, sticker: 0, interactive: 0 },
      types: { template: 0, text: 0, media: 0, interactive: 0 }
    };

    const chartDataArray: any[] = [];
    const intervalMap = new Map();

    // 4. Processing every single message exactly as it is in the database
    messages.forEach(msg => {
      
      // Graph Data ke liye bucket tayari
      let key = range === "24h" 
        ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!intervalMap.has(key)) {
        intervalMap.set(key, { date: key, sent: 0, received: 0, api: 0, campaign: 0, template: 0 });
      }
      const bucket = intervalMap.get(key);

      if (msg.direction === "OUTBOUND") {
        stats.outbound.total++;
        bucket.sent++;
        
        // FIX 1: CASCADING STATUS LOGIC
        // Agar Read hai toh iska matlab Deliver aur Send bhi hua hoga
        if (msg.status === "READ") {
          stats.outbound.read++;
          stats.outbound.delivered++; 
          stats.outbound.sent++;
        } else if (msg.status === "DELIVERED") {
          stats.outbound.delivered++;
          stats.outbound.sent++;
        } else {
          // Status SENT ya failed
          stats.outbound.sent++;
        }

        // Source Breakdown
        if (msg.source === "CHAT") stats.outbound.chat++;
        else if (msg.source === "FLOW") stats.outbound.flow++;
        else if (msg.source === "API") { 
          stats.outbound.api++; 
          bucket.api++; 
        }
        else if (msg.source === "CAMPAIGN") { 
          stats.outbound.campaign++; 
          bucket.campaign++; 
        }

        // FIX 2: TEMPLATE LOGIC (API & Campaign directly counted as Template)
        if (msg.type === "TEMPLATE" || msg.source === "API" || msg.source === "CAMPAIGN") {
          stats.types.template++;
          bucket.template++;
        } else if (msg.type === "TEXT") {
          stats.types.text++;
        } else if (msg.type === "INTERACTIVE") {
          stats.types.interactive++;
        } else {
          stats.types.media++;
        }
      } else {
        // INBOUND - Ek ek point ka hisaab (Document, Location sab idhar hai)
        stats.inbound.total++;
        bucket.received++;

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

    intervalMap.forEach(val => chartDataArray.push(val));

    // Calculate accurate read rate based ONLY on delivered messages
    const readRate = stats.outbound.delivered > 0 
      ? Math.round((stats.outbound.read / stats.outbound.delivered) * 100) 
      : 0;

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
      chartData: chartDataArray
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
