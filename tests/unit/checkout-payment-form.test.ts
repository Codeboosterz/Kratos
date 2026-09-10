import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ state: vi.fn() }));
vi.mock("@stripe/react-stripe-js/checkout", () => ({
  useCheckoutElements: mocks.state,
  CheckoutElementsProvider: () => null,
  PaymentElement: () => "CARD_FIELDS",
  ContactDetailsElement: () => "BUYER_EMAIL_FIELDS",
}));
vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { StripePaymentForm } from "@/components/checkout-client";

describe("real payment form guards", () => {
  const checkout = { canConfirm: true, currency: "eur", total: { total: { minorUnitsAmount: 30000, amount: "€300.00" } } };
  const render = () => renderToStaticMarkup(createElement(StripePaymentForm, { sessionId: "cs_test_fixture", quote: { priceCents: 30000, currency: "eur" } }));
  beforeEach(() => mocks.state.mockReturnValue({ type: "success", checkout }));
  it("collects the buyer email and displays the provider total before confirmation", () => {
    const html = render();
    expect(html).toContain("BUYER_EMAIL_FIELDS");
    expect(html).toContain("CARD_FIELDS");
    expect(html).toContain("€300.00");
    expect(html).not.toContain('disabled=""');
  });
  it("shows loading without a premature payment form", () => {
    mocks.state.mockReturnValue({ type: "loading" });
    expect(render()).toContain('role="status"');
    expect(render()).not.toContain("CARD_FIELDS");
  });
  it("shows provider initialization failure without private diagnostic details", () => {
    mocks.state.mockReturnValue({ type: "error", error: { message: "private diagnostic" } });
    expect(render()).toContain('role="alert"');
    expect(render()).not.toContain("private diagnostic");
  });
  it("waits for Stripe to permit confirmation", () => {
    mocks.state.mockReturnValue({ type: "success", checkout: { ...checkout, canConfirm: false } });
    expect(render()).toContain('disabled=""');
  });
  it("blocks a provider total that no longer matches the displayed quote", () => {
    mocks.state.mockReturnValue({ type: "success", checkout: { ...checkout, total: { total: { minorUnitsAmount: 30100, amount: "€301.00" } } } });
    expect(render()).toContain('role="alert"');
    expect(render()).not.toContain("CARD_FIELDS");
  });
});
