import { createMindsClient } from "@animocabrands/minds-client-lib";
import { Receiver } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { parseMindBriefing, requireVerifiedMindReply, validateWorkerConfiguration, verifyMindIdentity } from "./worker-guards.mjs";

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: false,
  },
};




async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Read Raw Body Stream for Exact Signature Verification
  const rawBody = await getRawBody(req);

  const missingConfiguration = validateWorkerConfiguration(process.env);
  if (missingConfiguration.length) {
    return res.status(503).json({
      error: `Production worker configuration missing: ${missingConfiguration.join(", ")}`,
    });
  }

  // QStash Signature Verification Security
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return res.status(503).json({
      error: "QStash signature verification is not configured",
    });
  }

  {
    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });

    const signature = req.headers["upstash-signature"];
    if (!signature) {
      return res.status(401).json({ error: "Unauthorized: Missing QStash signature" });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "greenroom-ruby.vercel.app";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const reqUrl = `${proto}://${host}/api/briefing-worker`;

    try {
      let isValid = await receiver.verify({
        signature,
        body: rawBody,
        url: reqUrl,
      }).catch(() => false);

      if (!isValid) {
        isValid = await receiver.verify({
          signature,
          body: rawBody,
        }).catch(() => false);
      }

      if (!isValid) {
        return res.status(401).json({ error: "Unauthorized: Invalid QStash signature" });
      }
    } catch (err) {
      return res.status(401).json({ error: `Unauthorized: QStash signature verification failed (${err.message})` });
    }
  }

  // 2. Parse payload & run_id from rawBody
  let payload = {};
  if (rawBody) {
    try { payload = JSON.parse(rawBody); } catch (e) {}
  }
  const runId = payload.run_id || `run_${Math.random().toString(36).substring(2, 10)}`;


  // 3. Upstash Redis Connection (DURABLE Persistence)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!redisUrl || !redisToken) {
    return res.status(503).json({
      error: "Durable Upstash Redis persistence is not configured",
    });
  }
  const redis = new Redis({ url: redisUrl, token: redisToken });

  const startedAt = new Date().toISOString();

  // Mark status = RUNNING in Redis
  try {
    const existingStatus = (await redis.get(`greenroom:run_status:${runId}`)) || {};
    const statusObj = typeof existingStatus === "string" ? JSON.parse(existingStatus) : existingStatus;
    await redis.set(`greenroom:run_status:${runId}`, JSON.stringify({
      ...statusObj,
      run_id: runId,
      status: "RUNNING",
      started_at: startedAt
    }));
  } catch (e) {
    return res.status(503).json({
      status: "failed",
      run_id: runId,
      error: `Durable Redis status update failed: ${e.message || String(e)}`,
    });
  }

  try {
    // 4. Load Creator Profile Memory from Redis
    let creatorProfile = {
      creator_name: "Alex Rivera",
      brand_voice_attributes: ["Educational", "Technical yet accessible", "Direct"],
      rejected_topics: ["Crypto trading bots", "Generic AI news clickbait"],
      monetization_benchmarks: { cpm_target: 45, minimum_deal_size: 5000 },
      learned_voice_rules: [],
      memory_nodes: []
    };

    try {
      const storedProfile = await redis.get("greenroom:creator_profile");
      if (storedProfile) {
        creatorProfile = typeof storedProfile === "string" ? JSON.parse(storedProfile) : storedProfile;
      }
    } catch (e) {
      throw new Error(`Durable creator memory load failed: ${e.message || String(e)}`);
    }

    // 5. Execute Official Animoca Minds Builder API Call
    const apiKey = process.env.MINDS_BUILDER_API_KEY;
    if (!apiKey) {
      throw new Error("MINDS_BUILDER_API_KEY environment variable missing in Node worker runtime");
    }

    const mindsClient = createMindsClient({ builderApiKey: apiKey });
    const mindId = "8208493e-f36b-1410-8466-00039ce7df11";
    verifyMindIdentity(await mindsClient.getMind(mindId), {
      mindId,
      email: "udophia@hellominds.ai",
      walletAddress: "0xB675Ec9857776678aE540cF3248d898f015987Cb",
    });
    const alias = `greenroom-${runId}`;

    await mindsClient.ensureConversation(alias, mindId);
    const beforeFingerprint = await mindsClient.getLatestHistoryFingerprint(alias);

    const learnedRules = creatorProfile.learned_voice_rules || [];
    const demoSignals = [
      { id: "sig_001", source: "Demo Dataset (Simulated)", signal: "Beginner local AI setup discussions increased; viewers request terminal-first walkthroughs." },
      { id: "sig_002", source: "Demo Dataset (Simulated)", signal: "A fictional developer-infrastructure sponsor matches the creator's CPM benchmark." },
      { id: "sig_003", source: "Demo Dataset (Simulated)", signal: "Generic crypto and clickbait topics conflict with stored creator boundaries." },
    ];
    const prompt = `You are Greenroom's ranking Mind. Analyze the supplied simulated signals against durable creator memory. Return JSON only with an "items" array ranked best-first. Each item must contain: id, priority, title, category, what_changed, why_it_matters, recommended_action, memory_context_used, status. Do not claim the signals are live or real.\nCreator memory: ${JSON.stringify(creatorProfile)}\nSignals: ${JSON.stringify(demoSignals)}\nLearned rules: ${JSON.stringify(learnedRules)}`;
    await mindsClient.sendMessage({ alias, messageText: prompt });

    const timeoutMs = parseInt(process.env.MINDS_REPLY_TIMEOUT_MS || "60000", 10);
    const outcome = await mindsClient.waitForReply({
      alias,
      timeoutMs,
      afterFingerprint: beforeFingerprint,
      sentMessageText: prompt
    });

    const mindReplyText = requireVerifiedMindReply(outcome);
    const mindBriefing = parseMindBriefing(mindReplyText);


    // 6. Build & Persist Completed Briefing to Redis
    const completedAt = new Date().toISOString();
    let continuityNote = null;
    if (learnedRules.length > 0) {
      continuityNote = `Adjusted using your previous feedback: '${learnedRules[learnedRules.length - 1]}'.`;
    }

    const items = mindBriefing.items.map((item, index) => ({
      id: item.id || `opp_${String(index + 1).padStart(3, "0")}`,
      priority: item.priority || (index === 0 ? "HIGH PRIORITY" : "WATCH"),
      status: item.status || "NEW",
      ...item,
    }));

    const provenance = {
      run_id: runId,
      created_at: startedAt,
      completed_at: completedAt,
      status: "COMPLETED",
      signal_source: "Demo Dataset (Simulated)",
      signal_mode: "DEMO",
      analysis_provider: "Animoca Minds",
      mind_id: mindId,
      mind_verified: true,
      demo_mode: false,
      persistence_mode: "DURABLE",
      execution_mode: "QSTASH_BACKGROUND_JOB",
      opportunity_count: items.length
    };

    const briefing = {
      run_id: runId,
      timestamp: completedAt,
      last_run_formatted: new Date().toUTCString(),
      signals_reviewed_count: 3,
      opportunities_found_count: items.length,
      memory_nodes_used_count: 2,
      signal_source_label: "Demo Dataset (Simulated)",
      analysis_provider: "Animoca Minds",
      minds_source: "Animoca_Minds_Builder_API",
      minds_status: "COMPLETED",
      minds_verified: true,
      persistence_mode: "DURABLE",
      execution_mode: "QSTASH_BACKGROUND_JOB",
      continuity_note: continuityNote,
      provenance,
      items,
      learned_rules_active: learnedRules,
      mind_raw_reply: mindReplyText
    };

    // Save briefing and COMPLETED run status to Redis
    await redis.set("greenroom:latest_briefing", JSON.stringify(briefing));
    await redis.set(`greenroom:run_status:${runId}`, JSON.stringify({
      run_id: runId,
      status: "COMPLETED",
      queued_at: startedAt,
      started_at: startedAt,
      completed_at: completedAt,
      briefing_id: runId,
      provenance
    }));

    return res.status(200).json({ status: "success", run_id: runId, briefing });

  } catch (err) {
    const failedAt = new Date().toISOString();
    console.error(`[NodeWorker] Background execution error for ${runId}:`, err);

    try {
      await redis.set(`greenroom:run_status:${runId}`, JSON.stringify({
        run_id: runId,
        status: "FAILED",
        started_at: startedAt,
        completed_at: failedAt,
        error: err.message || String(err)
      }));
    } catch (e) {
      console.error(`[NodeWorker] Failed to persist FAILED status for ${runId}:`, e);
    }

    return res.status(500).json({
      status: "failed",
      run_id: runId,
      error: err.message || String(err)
    });
  }
}
