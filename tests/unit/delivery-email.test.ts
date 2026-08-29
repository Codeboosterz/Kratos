import { describe, expect, it } from "vitest";
import { renderDeliveryEmail } from "@/src/operations/resend";

describe("digital delivery email", () => {
  it("escapes customer-controlled product labels and keeps the claim URL explicit", () => {
    const result = renderDeliveryEmail({
      productName: "Plan <script>alert(1)</script>",
      claimUrl: "https://kratosfitness.be/api/download/token",
    });
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.text).toContain("https://kratosfitness.be/api/download/token");
  });
});
