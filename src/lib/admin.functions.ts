import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idInput = z.object({ userId: z.string().uuid() });

/**
 * Permanently removes a user account. Admin-only: the caller's role is checked
 * with their own (RLS-bound) client before the privileged client is loaded.
 */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin", {
      _uid: context.userId,
    });
    if (roleError) throw new Error("We couldn't verify your permissions.");
    if (!isAdmin) throw new Error("Only admins can delete accounts.");
    if (data.userId === context.userId) throw new Error("You can't delete your own account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
