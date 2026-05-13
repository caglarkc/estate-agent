import type { CustomerMessage } from "@/types/index";

export const mockMessages: CustomerMessage[] = [
  {
    id: "msg-1",
    sender: "Sarah Johnson",
    text: "Hi, is the 2-bedroom flat in Manchester still available? I'm looking to move next month and can view it this Saturday.",
    timestamp: "09:14",
  },
  {
    id: "msg-2",
    sender: "Ahmed Al-Rashid",
    text: "What's the monthly rent for the Birmingham property? Also is it pet-friendly? We have a small dog.",
    timestamp: "10:32",
  },
  {
    id: "msg-3",
    sender: "Emma Clarke",
    text: "I applied last week for the London flat, just wondering if there's any update on my application?",
    timestamp: "11:05",
  },
  {
    id: "msg-4",
    sender: "Liam & Priya Patel",
    text: "We're relocating from abroad and need a furnished place ASAP, ideally 2-3 bedrooms. What do you have available?",
    timestamp: "13:47",
  },
];
