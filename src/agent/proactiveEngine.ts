interface ProcessedMessage {
  sender: string;
  status: string;
  processedAt: number;
}

export function startProactiveEngine(
  getProcessedMessages: () => ProcessedMessage[],
  onInsight: (insight: string) => void,
): () => void {
  const triggeredInsights = new Set<string>();

  const evaluate = () => {
    const messages = getProcessedMessages();
    const now = Date.now();
    const senderCounts = new Map<string, number>();

    for (const message of messages) {
      senderCounts.set(
        message.sender,
        (senderCounts.get(message.sender) ?? 0) + 1,
      );

      const elapsedMs = now - message.processedAt;
      const eligibleStatus =
        message.status === "pending" || message.status === "approved";

      if (eligibleStatus && elapsedMs >= 120_000) {
        const elapsed = Math.floor(elapsedMs / 60_000);
        const key = `aging:${message.sender}:${message.processedAt}`;

        if (!triggeredInsights.has(key)) {
          triggeredInsights.add(key);
          onInsight(`⚠️ Follow-up needed: ${message.sender} — ${elapsed} min ago`);
        }
      }
    }

    for (const [sender, count] of senderCounts) {
      const key = `repeat:${sender}`;

      if (count >= 2 && !triggeredInsights.has(key)) {
        triggeredInsights.add(key);
        onInsight(`🔄 Repeat contact detected: ${sender}`);
      }
    }
  };

  const id = window.setInterval(evaluate, 30_000);

  return () => window.clearInterval(id);
}
