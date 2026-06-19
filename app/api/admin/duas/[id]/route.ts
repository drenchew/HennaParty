import { NextRequest } from "next/server";
import { deleteDuaForAdmin, unassignDuaForAdmin } from "@/lib/admin/server";
import { requireAdminSecret, adminUnauthorized } from "@/lib/api/admin";
import { handleAdminError } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** DELETE /api/admin/duas/[id] */
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!requireAdminSecret(request)) {
    return adminUnauthorized();
  }

  try {
    const { id } = await context.params;
    const duaId = Number(id);

    if (!Number.isInteger(duaId) || duaId <= 0) {
      throw new Error("INVALID_PAYLOAD:Invalid dua id");
    }

    await deleteDuaForAdmin(duaId);
    return jsonOk({ deleted: true, id: duaId });
  } catch (error) {
    return handleAdminError(error);
  }
}

/** PATCH /api/admin/duas/[id] — release an assigned dua back to the pool */
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!requireAdminSecret(request)) {
    return adminUnauthorized();
  }

  try {
    const { id } = await context.params;
    const duaId = Number(id);

    if (!Number.isInteger(duaId) || duaId <= 0) {
      throw new Error("INVALID_PAYLOAD:Invalid dua id");
    }

    await unassignDuaForAdmin(duaId);
    return jsonOk({ released: true, id: duaId });
  } catch (error) {
    return handleAdminError(error);
  }
}
