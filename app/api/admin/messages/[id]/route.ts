import { NextRequest } from "next/server";
import { deleteMessageForAdmin } from "@/lib/admin/server";
import { requireAdminSecret, adminUnauthorized } from "@/lib/api/admin";
import { handleAdminError } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!requireAdminSecret(request)) {
    return adminUnauthorized();
  }

  try {
    const { id } = await context.params;
    await deleteMessageForAdmin(id);
    return jsonOk({ deleted: true, id });
  } catch (error) {
    return handleAdminError(error);
  }
}
