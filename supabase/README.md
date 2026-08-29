# Kratos CMS provisioning

The application uses Supabase Auth, Postgres and Storage. The browser receives only the modern publishable key; authorization is enforced by Postgres grants and RLS.

## One-time setup

1. Apply every file in `supabase/migrations/` in timestamp order. The operations hub is defined in `20260828104426_cms_operations_hub.sql`.
2. Create the owner's Auth account in Supabase Authentication. Public sign-up is intentionally not exposed by the website.
3. Add the generated user to the CMS allow-list from the SQL editor:

   ```sql
   insert into public.cms_memberships (user_id, role, display_name)
   select id, 'super_admin', 'Super admin'
   from auth.users
   where email = 'OWNER_EMAIL_HERE'
   on conflict (user_id) do update
     set role = excluded.role,
         display_name = excluded.display_name,
         active = true,
         updated_at = now();
   ```

4. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` locally and in the hosting provider. Add `SUPABASE_SECRET_KEY` server-side for Vault reads, private PDF fulfillment, durable rate limits and provider workers.
5. Add the production origin and `http://localhost:3000` to the Supabase Auth URL allow-list.

Do not place a secret key, legacy service-role key or database password in a `NEXT_PUBLIC_*` variable.

## Operations activation

1. Apply the operations migration and verify that the `digital-products` bucket is private.
2. Open `/beheer/instellingen`, enter credentials as the super admin, and test every provider.
3. Configure Stripe and Resend webhook endpoints and copy their signing secrets into the matching write-only slots.
4. Confirm the account-specific Trainerize Studio/Enterprise API URLs before enabling provisioning.
5. Upload or generate a PDF, review AI-generated drafts, and mark only approved assets ready before activating a product.
6. Run Stripe test-mode checkout, webhook, e-mail delivery, signed download and recovery tests before switching a product to active.
