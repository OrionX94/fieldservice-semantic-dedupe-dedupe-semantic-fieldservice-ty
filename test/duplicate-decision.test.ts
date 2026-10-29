import assert from "node:assert/strict";
import { decideDuplicate, WorkOrder } from "../src/fieldservice_dedupe.ts";

const record = WorkOrder.parse({
  id: "WO-1",
  photoDescription: "Loose cable at the east panel",
  dispatchStatus: "assigned",
  technicianFollowUp: "Bring a cable gland"
});

assert.equal(record.dispatchStatus, "assigned");
assert.equal(decideDuplicate(0.91), "merge");
assert.equal(decideDuplicate(0.87), "keep");
console.log("duplicate decision test passed");
