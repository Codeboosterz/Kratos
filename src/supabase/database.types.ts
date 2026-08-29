export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      cms_memberships: {
        Row: { user_id: string; role: "super_admin" | "owner" | "editor"; display_name: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; role: "super_admin" | "owner" | "editor"; display_name?: string | null; active?: boolean };
        Update: { role?: "super_admin" | "owner" | "editor"; display_name?: string | null; active?: boolean; updated_at?: string };
        Relationships: [];
      };
      content_pages: {
        Row: { id: string; slug: string; title: string; published_revision_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; title: string; published_revision_id?: string | null };
        Update: { title?: string; published_revision_id?: string | null; updated_at?: string };
        Relationships: [];
      };
      content_revisions: {
        Row: { id: string; page_id: string; version: number; status: "draft" | "published" | "archived"; content: Json; change_summary: string | null; created_by: string | null; created_at: string; published_by: string | null; published_at: string | null };
        Insert: { id?: string; page_id: string; version: number; status?: "draft" | "published" | "archived"; content: Json; change_summary?: string | null; created_by?: string | null };
        Update: { status?: "draft" | "published" | "archived"; content?: Json; change_summary?: string | null; published_by?: string | null; published_at?: string | null };
        Relationships: [];
      };
      media_assets: {
        Row: { id: string; storage_path: string; public_url: string; filename: string; mime_type: string; size_bytes: number; alt_text: string; focal_x: number; focal_y: number; created_by: string; created_at: string; archived_at: string | null };
        Insert: { id?: string; storage_path: string; public_url: string; filename: string; mime_type: string; size_bytes: number; alt_text?: string; focal_x?: number; focal_y?: number; created_by: string };
        Update: { alt_text?: string; focal_x?: number; focal_y?: number; archived_at?: string | null };
        Relationships: [];
      };
      cms_audit_events: {
        Row: { id: number; actor_id: string | null; action: string; object_type: string; object_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: number; actor_id?: string | null; action: string; object_type: string; object_id?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      integration_connections: TableDefinition<{
        provider: "stripe" | "resend" | "trainerize" | "openrouter" | "calendly";
        status: "connected" | "not_connected" | "configuration_required" | "permission_expired" | "degraded";
        config: Json;
        last_checked_at: string | null;
        last_error: string | null;
        updated_by: string | null;
        updated_at: string;
      }, {
        provider: "stripe" | "resend" | "trainerize" | "openrouter" | "calendly";
        status?: "connected" | "not_connected" | "configuration_required" | "permission_expired" | "degraded";
        config?: Json;
        last_checked_at?: string | null;
        last_error?: string | null;
        updated_by?: string | null;
        updated_at?: string;
      }>;
      integration_secret_refs: TableDefinition<{
        provider: "stripe" | "resend" | "trainerize" | "openrouter" | "calendly";
        credential_name: string;
        vault_secret_id: string;
        updated_by: string | null;
        updated_at: string;
      }, {
        provider: "stripe" | "resend" | "trainerize" | "openrouter" | "calendly";
        credential_name: string;
        vault_secret_id: string;
        updated_by?: string | null;
        updated_at?: string;
      }>;
      cms_products: TableDefinition<{
        id: string;
        slug: string;
        name: string;
        description: string;
        status: "draft" | "active" | "archived";
        price_cents: number | null;
        currency: string;
        stripe_product_id: string | null;
        stripe_price_id: string | null;
        trainerize_plan_id: string | null;
        digital_asset_id: string | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }, {
        id: string;
        slug: string;
        name: string;
        description?: string;
        status?: "draft" | "active" | "archived";
        price_cents?: number | null;
        currency?: string;
        stripe_product_id?: string | null;
        stripe_price_id?: string | null;
        trainerize_plan_id?: string | null;
        digital_asset_id?: string | null;
        created_by?: string | null;
        updated_by?: string | null;
        created_at?: string;
        updated_at?: string;
      }>;
      digital_assets: TableDefinition<{
        id: string;
        storage_path: string;
        filename: string;
        mime_type: "application/pdf";
        size_bytes: number;
        source: "upload" | "ai_generated";
        status: "draft" | "ready" | "archived";
        checksum_sha256: string | null;
        created_by: string | null;
        created_at: string;
        archived_at: string | null;
      }, {
        id?: string;
        storage_path: string;
        filename: string;
        mime_type: "application/pdf";
        size_bytes: number;
        source?: "upload" | "ai_generated";
        status?: "draft" | "ready" | "archived";
        checksum_sha256?: string | null;
        created_by?: string | null;
        created_at?: string;
        archived_at?: string | null;
      }>;
      orders: TableDefinition<{
        id: string;
        stripe_checkout_session_id: string;
        stripe_payment_intent_id: string | null;
        product_id: string;
        customer_email: string;
        status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled" | "failed";
        amount_total: number;
        currency: string;
        paid_at: string | null;
        fulfilled_at: string | null;
        created_at: string;
        updated_at: string;
      }, {
        id?: string;
        stripe_checkout_session_id: string;
        stripe_payment_intent_id?: string | null;
        product_id: string;
        customer_email: string;
        status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled" | "failed";
        amount_total: number;
        currency: string;
        paid_at?: string | null;
        fulfilled_at?: string | null;
        created_at?: string;
        updated_at?: string;
      }>;
      entitlements: TableDefinition<{
        id: string;
        order_id: string;
        asset_id: string;
        status: "active" | "revoked" | "expired";
        claim_token_hash: string;
        expires_at: string | null;
        download_count: number;
        last_downloaded_at: string | null;
        created_at: string;
      }, {
        id?: string;
        order_id: string;
        asset_id: string;
        status?: "active" | "revoked" | "expired";
        claim_token_hash: string;
        expires_at?: string | null;
        download_count?: number;
        last_downloaded_at?: string | null;
        created_at?: string;
      }>;
      provider_webhook_events: TableDefinition<{
        provider: "stripe" | "resend" | "trainerize" | "calendly";
        provider_event_id: string;
        event_type: string;
        status: "received" | "processing" | "completed" | "failed" | "ignored";
        attempts: number;
        payload_hash: string;
        last_error: string | null;
        received_at: string;
        processed_at: string | null;
      }, {
        provider: "stripe" | "resend" | "trainerize" | "calendly";
        provider_event_id: string;
        event_type: string;
        status?: "received" | "processing" | "completed" | "failed" | "ignored";
        attempts?: number;
        payload_hash: string;
        last_error?: string | null;
        received_at?: string;
        processed_at?: string | null;
      }>;
      intake_requests: TableDefinition<{
        id: string;
        reference: string;
        idempotency_key: string;
        goal: string;
        experience: string;
        training_format: string;
        availability: string;
        note: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        contact_channel: "email" | "telefoon";
        consent_version: string;
        product_slug: string | null;
        source: string | null;
        appointment_status: "awaiting_booking" | "scheduled" | "canceled";
        lead_status: "new" | "contacted" | "qualified" | "closed" | "spam";
        read_at: string | null;
        read_by: string | null;
        internal_note: string;
        created_at: string;
        updated_at: string;
      }, {
        id?: string;
        reference: string;
        idempotency_key: string;
        goal: string;
        experience: string;
        training_format: string;
        availability: string;
        note?: string;
        customer_name: string;
        customer_email: string;
        customer_phone?: string;
        contact_channel: "email" | "telefoon";
        consent_version: string;
        product_slug?: string | null;
        source?: string | null;
        appointment_status?: "awaiting_booking" | "scheduled" | "canceled";
        lead_status?: "new" | "contacted" | "qualified" | "closed" | "spam";
        read_at?: string | null;
        read_by?: string | null;
        internal_note?: string;
        created_at?: string;
        updated_at?: string;
      }>;
      calendar_appointments: TableDefinition<{
        id: string;
        provider_event_uri: string;
        provider_invitee_uri: string;
        event_type_uri: string | null;
        event_name: string;
        invitee_name: string;
        invitee_email: string;
        status: "scheduled" | "canceled";
        start_time: string;
        end_time: string;
        timezone: string;
        location: string | null;
        cancel_url: string | null;
        reschedule_url: string | null;
        intake_reference: string | null;
        provider_created_at: string;
        created_at: string;
        updated_at: string;
      }, {
        id?: string;
        provider_event_uri: string;
        provider_invitee_uri: string;
        event_type_uri?: string | null;
        event_name: string;
        invitee_name: string;
        invitee_email: string;
        status: "scheduled" | "canceled";
        start_time: string;
        end_time: string;
        timezone?: string;
        location?: string | null;
        cancel_url?: string | null;
        reschedule_url?: string | null;
        intake_reference?: string | null;
        provider_created_at: string;
        created_at?: string;
        updated_at?: string;
      }>;
      email_threads: TableDefinition<{
        id: string;
        customer_email: string;
        customer_name: string | null;
        subject: string;
        status: "open" | "waiting" | "closed" | "spam";
        last_message_at: string;
        assigned_to: string | null;
        created_at: string;
      }>;
      email_messages: TableDefinition<{
        id: string;
        thread_id: string;
        provider_message_id: string | null;
        direction: "inbound" | "outbound";
        sender: string;
        recipients: Json;
        subject: string;
        text_body: string | null;
        html_body: string | null;
        delivery_status: "queued" | "sent" | "delivered" | "bounced" | "complained" | "suppressed" | "failed" | "received";
        in_reply_to: string | null;
        created_at: string;
      }, {
        id?: string;
        thread_id: string;
        provider_message_id?: string | null;
        direction: "inbound" | "outbound";
        sender: string;
        recipients: Json;
        subject: string;
        text_body?: string | null;
        html_body?: string | null;
        delivery_status?: "queued" | "sent" | "delivered" | "bounced" | "complained" | "suppressed" | "failed" | "received";
        in_reply_to?: string | null;
        created_at?: string;
      }>;
      trainerize_provisioning_jobs: TableDefinition<{
        id: string;
        order_id: string;
        trainerize_plan_id: string;
        status: "queued" | "running" | "completed" | "completed_with_warnings" | "failed";
        attempts: number;
        last_error: string | null;
        next_attempt_at: string | null;
        created_at: string;
        updated_at: string;
      }, {
        id?: string;
        order_id: string;
        trainerize_plan_id: string;
        status?: "queued" | "running" | "completed" | "completed_with_warnings" | "failed";
        attempts?: number;
        last_error?: string | null;
        next_attempt_at?: string | null;
        created_at?: string;
        updated_at?: string;
      }>;
      ai_jobs: TableDefinition<{
        id: string;
        job_type: "pdf_generation" | "cms_assist" | "free_tool_explanation" | "email_draft";
        model: string;
        status: "queued" | "running" | "completed" | "completed_with_warnings" | "failed";
        input_summary: Json;
        output_asset_id: string | null;
        error_code: string | null;
        created_by: string | null;
        created_at: string;
        completed_at: string | null;
      }, {
        id?: string;
        job_type: "pdf_generation" | "cms_assist" | "free_tool_explanation" | "email_draft";
        model: string;
        status?: "queued" | "running" | "completed" | "completed_with_warnings" | "failed";
        input_summary?: Json;
        output_asset_id?: string | null;
        error_code?: string | null;
        created_by?: string | null;
        created_at?: string;
        completed_at?: string | null;
      }>;
      ai_usage_events: TableDefinition<{
        id: number;
        ai_job_id: string | null;
        provider: string;
        model: string;
        prompt_tokens: number;
        completion_tokens: number;
        cost_usd: number;
        latency_ms: number | null;
        created_at: string;
      }, {
        id?: never;
        ai_job_id?: string | null;
        provider?: string;
        model: string;
        prompt_tokens?: number;
        completion_tokens?: number;
        cost_usd?: number;
        latency_ms?: number | null;
        created_at?: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      cms_save_content_revision: {
        Args: { target_slug: string; revision_content: Json; revision_summary?: string | null };
        Returns: { revision_id: string; revision_version: number }[];
      };
      cms_publish_content_revision: {
        Args: { target_revision_id: string };
        Returns: { published_revision_id: string; published_version: number }[];
      };
      cms_store_integration_secret: {
        Args: { target_provider: string; target_credential_name: string; secret_value: string };
        Returns: string;
      };
      get_integration_secret_for_server: {
        Args: { target_provider: string; target_credential_name: string };
        Returns: string | null;
      };
      consume_api_rate_limit: {
        Args: { target_namespace: string; target_key_hash: string; target_limit: number; target_window_seconds: number };
        Returns: { allowed: boolean; retry_after_seconds: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
