import { revalidatePath } from "next/cache";
import { badRequest, internalGuard, ok, readJson } from "@/lib/api";

interface Body {
  path?: string;
}

export async function POST(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  const body = await readJson<Body>(request);
  if (!body.path) return badRequest("path is required");
  revalidatePath(body.path);
  return ok({ revalidated: true, path: body.path });
}
