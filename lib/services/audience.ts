import type { Subscriber } from "@/lib/types";
import { subscribe as subscribeRepository } from "@/lib/repositories/platformRepository";

export function subscribe(email: string, topics: string[] = ["top-stories"]): Promise<Subscriber> {
  return subscribeRepository(email, topics);
}
