import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// This suite connects ONLY to a disposable local PostgreSQL, never Cloud.
describe.skipIf(process.env["PROSPECTOR_TEST_PG"] !== "1")("real isolated PostgreSQL security", () => {
  const sql = postgres({ host: "127.0.0.1", port: 55439, username: "nobody", database: "postgres", password: "", max: 40 });
  beforeAll(async () => {
    await sql.unsafe(`DROP SCHEMA public CASCADE; DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA public;
      DROP ROLE IF EXISTS anon; DROP ROLE IF EXISTS authenticated; DROP ROLE IF EXISTS service_role;`);
    await sql.unsafe(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
    for (const file of ["0000_migration", "0002_secure_places_budget_and_admin", "0003_restrict_role_table_grants", "0005_atomic_public_operation_limits", "0006_restrict_operation_window_grants"]) {
      await sql.unsafe(await readFile(`drizzle/migrations/${file}.sql`, "utf8"));
    }
  });
  afterAll(async () => { await sql.end(); });

  it("40 real competing reservations admit exactly 5 remaining calls at the 95% ceiling", async () => {
    await sql`UPDATE public.places_api_settings SET monthly_limit=100 WHERE id=1`;
    await sql`INSERT INTO public.places_api_usage(month,calls) VALUES(to_char(now() AT TIME ZONE 'UTC','YYYY-MM'),90)`;
    const rows = await Promise.all(Array.from({ length: 40 }, () => sql`SELECT * FROM public.reserve_places_call()`));
    expect(rows.filter((r) => r[0]?.["allowed"] === true)).toHaveLength(5);
    const stored = await sql`SELECT calls FROM public.places_api_usage`;
    expect(stored[0]?.["calls"]).toBe(95);
  });

  it("80 simultaneous requests admit exactly the global 60 search operations", async () => {
    const rows = await Promise.all(Array.from({ length: 80 }, () => sql`SELECT public.reserve_public_operation('search') AS allowed`));
    expect(rows.filter((r) => r[0]?.["allowed"] === true)).toHaveLength(60);
    const stored = await sql`SELECT calls FROM public.operation_rate_windows WHERE operation='search'`;
    expect(stored[0]?.["calls"]).toBe(60);
  });

  it("ordinary authenticated callers cannot grant roles or change limits; a verified fixture admin can", async () => {
    const user = "00000000-0000-0000-0000-000000000001";
    const admin = "00000000-0000-0000-0000-000000000002";
    await sql`INSERT INTO auth.users(id) VALUES(${user}),(${admin})`;
    await sql`INSERT INTO public.user_roles(user_id,role) VALUES(${admin},'admin')`;
    const act = (id: string, statement: string) => sql.begin(async (tx) => {
      await tx`SET LOCAL ROLE authenticated`;
      await tx`SELECT set_config('request.jwt.claim.sub',${id},true)`;
      return tx.unsafe(statement);
    });
    await expect(act(user, "SELECT public.set_places_limit_authorized(200)")).rejects.toThrow();
    await expect(act(user, `INSERT INTO public.user_roles(user_id,role) VALUES('${user}','admin')`)).rejects.toThrow();
    await expect(act(user, "SELECT public.reserve_public_operation('search')")).rejects.toThrow();
    await act(admin, "SELECT public.set_places_limit_authorized(200)");
    const stored = await sql`SELECT monthly_limit FROM public.places_api_settings WHERE id=1`;
    expect(stored[0]?.["monthly_limit"]).toBe(200);
  });
});