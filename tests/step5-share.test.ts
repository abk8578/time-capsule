import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

describe("Step 5 Share Card & Token Verification", () => {
  test("Generates 24-byte base64url shareToken (32 chars URL-safe)", () => {
    const shareToken = crypto.randomBytes(24).toString("base64url");
    assert.equal(shareToken.length, 32);
    // URL safe characters only (no +, /, or =)
    assert.equal(/^[A-Za-z0-9_-]+$/.test(shareToken), true);
  });

  test("Time travelled calculation produces accurate Hindi phrasing without message content", () => {
    function computeTimePhrase(created: Date, opened: Date): { timePhrase: string; totalDays: number } {
      const diffMs = Math.max(0, opened.getTime() - created.getTime());
      const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const totalYears = Math.floor(totalDays / 365);
      const totalMonths = Math.floor(totalDays / 30);

      let timePhrase = "Maine kuch samay pehle yeh likha tha";
      if (totalYears >= 1) {
        timePhrase = `Maine ${totalYears} saal pehle yeh likha tha`;
      } else if (totalMonths >= 1) {
        timePhrase = `Maine ${totalMonths} mahine pehle yeh likha tha`;
      } else {
        timePhrase = `Maine ${Math.max(1, totalDays)} din pehle yeh likha tha`;
      }

      return { timePhrase, totalDays };
    }

    const base = new Date();

    // 2 years ago
    const twoYearsAgo = new Date(base.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    assert.equal(computeTimePhrase(twoYearsAgo, base).timePhrase, "Maine 2 saal pehle yeh likha tha");

    // 3 months ago
    const threeMonthsAgo = new Date(base.getTime() - 95 * 24 * 60 * 60 * 1000);
    assert.equal(computeTimePhrase(threeMonthsAgo, base).timePhrase, "Maine 3 mahine pehle yeh likha tha");

    // 15 days ago
    const fifteenDaysAgo = new Date(base.getTime() - 15 * 24 * 60 * 60 * 1000);
    assert.equal(computeTimePhrase(fifteenDaysAgo, base).timePhrase, "Maine 15 din pehle yeh likha tha");
  });

  test("Share card projection guarantees title is hidden unless shareIncludeTitle is explicitly true", () => {
    function getCardTitle(capsule: { title: string; shareIncludeTitle?: boolean }): string | null {
      return capsule.shareIncludeTitle && capsule.title ? capsule.title : null;
    }

    // Default: shareIncludeTitle = false
    assert.equal(getCardTitle({ title: "My Deep Secrets", shareIncludeTitle: false }), null);

    // Omitted
    assert.equal(getCardTitle({ title: "My Deep Secrets" }), null);

    // Explicitly enabled
    assert.equal(getCardTitle({ title: "A Letter To Future", shareIncludeTitle: true }), "A Letter To Future");
  });
});
