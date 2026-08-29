export type ActionDefinition = {
  labels: string[];
  inputSchema: string;
  capability: string;
  validStates: string[];
  serverOperation: string;
  loadingResult: string;
  successResult: string;
  normalizedFailure: string;
  retryPath: string;
  retryable: boolean;
  idempotency: "required" | "not_required";
  auditEvent: string;
  testId: string;
};

export const actions = {
  NAV_HOME: {
    labels: ["Kratos logo"], inputSchema: "none", capability: "visible",
    validStates: ["any"], serverOperation: "none", loadingResult: "none",
    successResult: "/", normalizedFailure: "none", retryPath: "/",
    retryable: false, idempotency: "not_required", auditEvent: "none", testId: "nav-home",
  },
  NAV_TRAJECTORIES: {
    labels: ["Trajecten", "Bekijk trajecten"], inputSchema: "allowed category or goal query",
    capability: "visible", validStates: ["any"], serverOperation: "server catalogue filter",
    loadingResult: "route pending", successResult: "/trajecten", normalizedFailure: "catalogue error",
    retryPath: "/trajecten", retryable: true, idempotency: "not_required", auditEvent: "none", testId: "nav-trajectories",
  },
  OPEN_INTAKE: {
    labels: ["Plan een intake", "Volgende stap"], inputSchema: "allowed product/source or current draft",
    capability: "visible", validStates: ["marketing", "intake_step"], serverOperation: "none until submit",
    loadingResult: "step transition", successResult: "/intake or next step", normalizedFailure: "field errors",
    retryPath: "current step", retryable: true, idempotency: "not_required", auditEvent: "none", testId: "open-intake",
  },
  FILTER_PRODUCTS: {
    labels: ["Categoriefilter"], inputSchema: "categoryFilters enum", capability: "visible",
    validStates: ["catalogue"], serverOperation: "server filter", loadingResult: "route pending",
    successResult: "URL-backed filtered catalogue", normalizedFailure: "normalize to all",
    retryPath: "/trajecten", retryable: true, idempotency: "not_required", auditEvent: "none", testId: "filter-products",
  },
  OPEN_PRODUCT: {
    labels: ["Bekijk traject"], inputSchema: "active product slug", capability: "visible",
    validStates: ["active"], serverOperation: "resolve product", loadingResult: "route pending",
    successResult: "product detail", normalizedFailure: "not found", retryPath: "/trajecten",
    retryable: false, idempotency: "not_required", auditEvent: "none", testId: "open-product",
  },
  START_PRODUCT: {
    labels: ["Bekijk programma", "Veilig betalen", "Nog niet beschikbaar"], inputSchema: "server product",
    capability: "trainerize_navigation or stripe_checkout", validStates: ["mapped", "configured", "disabled"],
    serverOperation: "resolveStartAction", loadingResult: "pending", successResult: "allow-listed URL or checkout",
    normalizedFailure: "visible disabled reason", retryPath: "/intake", retryable: false,
    idempotency: "not_required", auditEvent: "product_start_resolved", testId: "start-product",
  },
  SUBMIT_INTAKE: {
    labels: ["Verstuur intake"], inputSchema: "intakeSchema", capability: "intake_submission",
    validStates: ["contact_valid"], serverOperation: "POST /api/intake", loadingResult: "submitting",
    successResult: "persisted fixture/destination reference", normalizedFailure: "safe retryable error",
    retryPath: "intake step 3", retryable: true, idempotency: "required", auditEvent: "intake_submitted", testId: "submit-intake",
  },
  OPEN_CHECKOUT: {
    labels: ["Veilig betalen"], inputSchema: "checkoutSessionSchema", capability: "stripe_checkout",
    validStates: ["verified_product", "connector_ready"], serverOperation: "POST /api/checkout/session",
    loadingResult: "creating_session", successResult: "safe session payload", normalizedFailure: "checkout unavailable",
    retryPath: "same checkout", retryable: true, idempotency: "required", auditEvent: "checkout_session_requested", testId: "open-checkout",
  },
  VERIFY_CHECKOUT: {
    labels: ["Betaling controleren"], inputSchema: "allow-listed session identifier", capability: "stripe_checkout",
    validStates: ["processing", "paid", "failed", "expired"], serverOperation: "GET /api/checkout/status",
    loadingResult: "verifying", successResult: "normalized authoritative status", normalizedFailure: "unknown",
    retryPath: "bounded refresh", retryable: true, idempotency: "not_required", auditEvent: "checkout_status_read", testId: "verify-checkout",
  },
  SAVE_COOKIE_PREFS: {
    labels: ["Voorkeuren opslaan"], inputSchema: "essential-only preference", capability: "visible",
    validStates: ["default", "saved"], serverOperation: "none", loadingResult: "saving",
    successResult: "device-local preference", normalizedFailure: "preference unavailable", retryPath: "/cookies",
    retryable: true, idempotency: "not_required", auditEvent: "none", testId: "save-cookie-preferences",
  },
} satisfies Record<string, ActionDefinition>;

export type ActionId = keyof typeof actions;
