import type { CustomerMessage } from "@/types/index";

const dayMs = 24 * 60 * 60 * 1000;

export const mockMessages: CustomerMessage[] = [
  {
    id: "msg-1",
    sender: "Sarah Johnson",
    text: "Hi, is the 2-bedroom flat in Manchester still available? I'm looking to move next month and can view it this Saturday.",
    timestamp: Date.now() - 1 * dayMs,
    lastContactDays: 1,
    sentimentSignal: "positive",
  },
  {
    id: "msg-2",
    sender: "Ahmed Al-Rashid",
    text: "What's the monthly rent for the Birmingham property? Also is it pet-friendly? We have a small dog.",
    timestamp: Date.now() - 2 * dayMs,
    lastContactDays: 2,
    sentimentSignal: "neutral",
  },
  {
    id: "msg-3",
    sender: "Emma Clarke",
    text: "I applied last week for the London flat, just wondering if there's any update on my application?",
    timestamp: Date.now() - 5 * dayMs,
    lastContactDays: 5,
    sentimentSignal: "fading",
  },
  {
    id: "msg-4",
    sender: "Liam & Priya Patel",
    text: "We're relocating from abroad and need a furnished place ASAP, ideally 2-3 bedrooms. What do you have available?",
    timestamp: Date.now(),
    lastContactDays: 0,
    sentimentSignal: "positive",
  },
  {
    id: "msg-5",
    sender: "Olivia Bennett",
    text: "I was interested in the Leeds flat but haven't heard back for a few days. Is it still worth pursuing?",
    timestamp: Date.now() - 4 * dayMs,
    lastContactDays: 4,
    sentimentSignal: "fading",
  },
  {
    id: "msg-6",
    sender: "Noah Williams",
    text: "Thanks for sending the Bristol house details. It looks ideal and I can view today if there is a slot.",
    timestamp: Date.now(),
    lastContactDays: 0,
    sentimentSignal: "positive",
  },
];
