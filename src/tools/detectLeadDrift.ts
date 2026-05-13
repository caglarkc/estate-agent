import type { CustomerMessage, DriftAlert } from "@/types/index";

export function detectDriftAlerts(messages: CustomerMessage[]): DriftAlert[] {
  return messages
    .filter(
      (message) =>
        message.lastContactDays > 2 && message.sentimentSignal === "fading",
    )
    .map((message) => ({
      messageId: message.id,
      senderName: message.sender,
      lastContactDays: message.lastContactDays,
      sentimentSignal: message.sentimentSignal,
    }));
}
