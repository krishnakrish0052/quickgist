import { NextResponse } from "next/server";
import { getPipelineRunState } from "@/lib/services/pipelineTracker";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPipelineRunState());
}
