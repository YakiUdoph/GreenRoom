import { createMindsClient } from "@animocabrands/minds-client-lib";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const apiKey = process.env.MINDS_BUILDER_API_KEY;

  if (!apiKey && command !== "help") {
    console.log(JSON.stringify({ ok: false, error: "MINDS_BUILDER_API_KEY environment variable is missing" }));
    process.exit(1);
  }

  const client = createMindsClient({ builderApiKey: apiKey });

  try {
    if (command === "get-mind") {
      const mindId = args[1];
      if (!mindId) throw new Error("mindId required");
      const mind = await client.getMind(mindId);
      console.log(JSON.stringify({ ok: true, mind }));
    } else if (command === "interact") {
      const mindId = args[1];
      const prompt = args[2];
      const alias = args[3] || "greenroom-main";
      if (!mindId || !prompt) throw new Error("mindId and prompt required");

      await client.ensureConversation(alias, mindId);

      const before = await client.getLatestHistoryFingerprint(alias);
      await client.sendMessage({ alias, messageText: prompt });

      const timeoutMs = parseInt(process.env.MINDS_REPLY_TIMEOUT_MS || "30000", 10);
      const outcome = await client.waitForReply({
        alias,
        timeoutMs,
        afterFingerprint: before,
        sentMessageText: prompt,
      });

      if (outcome.timedOut || !outcome.reply) {
        console.log(JSON.stringify({
          ok: false,
          error: "Mind reply timed out without response",
          timedOut: true,
          afterFingerprint: before
        }));
        process.exit(1);
      }

      const replyText = outcome.reply.messageText || outcome.reply.text || JSON.stringify(outcome.reply);
      console.log(JSON.stringify({
        ok: true,
        reply: replyText,
        mindId,
        alias,
        afterFingerprint: before,
        record: outcome.reply
      }));
    } else if (command === "cognition-balance") {
      const mindId = args[1];
      if (!mindId) throw new Error("mindId required");
      const balance = await client.getCognitionBalance(mindId);
      console.log(JSON.stringify({ ok: true, balance }));
    } else if (command === "list-minds") {
      const minds = await client.listMinds();
      console.log(JSON.stringify({ ok: true, minds }));
    } else {
      console.log(JSON.stringify({ ok: false, error: `Unknown command: ${command}` }));
      process.exit(1);
    }
  } catch (err) {
    console.log(JSON.stringify({ ok: false, error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
