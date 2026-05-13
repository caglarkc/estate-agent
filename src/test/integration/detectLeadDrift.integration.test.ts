import { describe, expect, it } from "vitest";
import { mockMessages } from "@/data/mockMessages";
import { detectDriftAlerts } from "@/tools/detectLeadDrift";

describe("detectLeadDrift — integration", () => {
  it("lastContactDays > 2 ve fading olan mesaj alert üretir", () => {
    const alerts = detectDriftAlerts(mockMessages);

    expect(alerts.length).toBeGreaterThan(0);
    expect(
      alerts.every(
        (alert) => alert.lastContactDays > 2 && alert.sentimentSignal === "fading",
      ),
    ).toBe(true);
  }, 60000);

  it("lastContactDays <= 2 olan mesaj alert üretmez", () => {
    const freshMessages = mockMessages.filter(
      (message) => message.lastContactDays <= 2,
    );
    const alerts = detectDriftAlerts(freshMessages);

    expect(alerts).toHaveLength(0);
  }, 60000);

  it("boş array girilince boş döndürür", () => {
    expect(detectDriftAlerts([])).toEqual([]);
  }, 60000);
});
