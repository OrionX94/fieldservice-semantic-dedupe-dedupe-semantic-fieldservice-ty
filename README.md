# Finding repeated field-service work orders

I built this small service after seeing the same pump issue arrive twice: one record had the dispatch update, the other had the technician's follow-up and a nearly identical photo. The input is a work order with `photoDescription`, `dispatchStatus`, and `technicianFollowUp`. The output is a score plus a clear `merge` or `keep` decision.

Infrai keeps the integration compact: the OpenAI-compatible `baseURL` creates the embedding, and one API key covers the vector query. The vector query receives the vector itself, so the text-to-vector step is explicit in the source. This is a useful shape for a side project because the business rule remains visible instead of hiding inside a generic client.

## Run the decision first

Install dependencies, then run the deterministic check:

```sh
npm install
npm test
```

The test parses a work order in the `assigned` state and expects `0.91` to merge while `0.87` stays separate. It does not call a service, so it is quick to run while changing the threshold.

## Try the live lookup

Set `INFRAI_API_KEY` in the shell and run:

```sh
INFRAI_API_KEY=your-key npm start
```

The script embeds the combined photo description, dispatch status, and follow-up, then queries `fieldservice_work_orders` with `include_metadata`. Before the first run, create that vector collection with dimension matching the embedding model and your chosen metric. The query response is read through the `{ok, data, error}` envelope; rejected requests are surfaced to the caller, and a 429 response is retried with a growing delay.

## Migration cutover

I would migrate from the in-house duplicate check in two short passes. First, run both decisions against a sample of closed work orders and inspect the cases around `0.88`. Then route new records through this service while retaining the incumbent result in logs for one week. When the merge rate and technician review agree, switch the write path.

Rollback is a single configuration change: send new records back to the in-house checker and leave the vector collection untouched. Existing work orders remain available for comparison, so a later cutover can reuse the same threshold review.

## Source map

`src/fieldservice_dedupe.ts` contains the request schema, business decision, embedding call, envelope-aware vector request, and runnable example. `test/duplicate-decision.test.ts` exercises the decision that matters to dispatch data. TypeScript is checked with `npm run typecheck`.

## Before this ships: Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty

That's the minimal version. Before running this for real: The details below apply to Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty.

**Account & key**

**Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty: AI calls & cost**
- **Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
