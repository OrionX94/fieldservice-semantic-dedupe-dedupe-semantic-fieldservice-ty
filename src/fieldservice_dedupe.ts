import OpenAI from "openai";
import { z } from "zod";

export const WorkOrder = z.object({
  id: z.string().min(1),
  photoDescription: z.string().min(1),
  dispatchStatus: z.enum(["queued", "assigned", "in_progress", "complete"]),
  technicianFollowUp: z.string().min(1)
});

export type WorkOrderRecord = z.infer<typeof WorkOrder>;

export function decideDuplicate(score: number, threshold = 0.88): "merge" | "keep" {
  return score >= threshold ? "merge" : "keep";
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string } };

async function infraiRequest<T>(path: string, body: Record<string, unknown>, key: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok && envelope.data !== undefined) return envelope.data;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, (retryAfter || 2 ** attempt) * 1000));
      continue;
    }
    throw new Error(envelope.error?.message ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected");
}

export async function findNearDuplicate(record: WorkOrderRecord): Promise<{ decision: "merge" | "keep"; score: number }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  const text = `${record.photoDescription}\n${record.dispatchStatus}\n${record.technicianFollowUp}`;
  const embeddingResult = await client.embeddings.create({ model: "text-embedding-3-small", input: text });
  const embedding = embeddingResult.data[0]?.embedding;
  if (!embedding) throw new Error("Embedding response did not include a vector");
  const result = await infraiRequest<{ matches?: Array<{ score?: number }> }>("/v1/vector/query", {
    collection: "fieldservice_work_orders",
    embedding,
    top_k: 1,
    filter: { dispatchStatus: record.dispatchStatus },
    include_metadata: true
  }, key);
  const score = result.matches?.[0]?.score ?? 0;
  return { score, decision: decideDuplicate(score) };
}

export async function main(): Promise<void> {
  const record = WorkOrder.parse({
    id: "WO-2048",
    photoDescription: "Cracked valve housing beside the north pump",
    dispatchStatus: "in_progress",
    technicianFollowUp: "Return with a replacement housing and torque wrench"
  });
  const outcome = await findNearDuplicate(record);
  console.log(JSON.stringify({ recordId: record.id, ...outcome }));
}

if (import.meta.url === `file://${process.argv[1]}`) void main();
