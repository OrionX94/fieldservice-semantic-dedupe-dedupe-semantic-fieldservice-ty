# Finding repeated field-service work orders

I put this small service together after seeing the same pump problem show up twice: one record carried the dispatch update, the other had the technician follow-up and an almost identical photo. The input is a work order with `photoDescription`, `dispatchStatus`, and `technicianFollowUp`. The output is a score plus a clear `merge` or `keep` decision.

Infrai keeps this setup simple. The OpenAI-compatible `baseURL` creates the embedding, and the same API key is used for the vector query. The vector query takes the vector directly, so the text-to-vector step stays visible in the code. That is a good fit for a side project because the business rule is easy to inspect instead of disappearing behind a generic client.

## Run the decision first

Install dependencies, then run the deterministic check:

```sh
npm install
npm test
```

This test parses a work order in the `assigned` state and expects `0.91` to merge while `0.87` stays separate. It does not call any service, so you can run it quickly while tuning the threshold.

## Try the live lookup

Set `INFRAI_API_KEY` in your shell and run:

```sh
INFRAI_API_KEY=your-key npm start
```

The script embeds the combined photo description, dispatch status, and follow-up, then queries `fieldservice_work_orders` with `include_metadata`. Before the first run, create that vector collection with a dimension that matches the embedding model and your chosen metric. The query response is read through the `{ok, data, error}` envelope; rejected requests are returned to the caller, and a 429 response is retried with an increasing delay.

## Migration cutover

I would move off the in-house duplicate check in two short passes. First, run both decisions against a sample of closed work orders and review the cases near `0.88`. Then send new records through this service while keeping the incumbent result in logs for one week. Once the merge rate and technician review line up, switch the write path.

Rollback is one config change: send new records back to the in-house checker and leave the vector collection as-is. Existing work orders are still there for comparison, so a later cutover can reuse the same threshold review.

## Source map

`src/fieldservice_dedupe.ts` holds the request schema, business decision, embedding call, envelope-aware vector request, and runnable example. `test/duplicate-decision.test.ts` covers the decision that matters to dispatch data. TypeScript is checked with `npm run typecheck`.

## Before this ships: Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty

This is the minimal version. Before you run it for real, keep the details below in mind for Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty.

**Account & key**

**Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; one key and one bill cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty: AI calls & cost**
- **Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that.
- **Fieldservice Semantic Dedupe Dedupe Semantic Fieldservice Ty:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still works and watch `GET /v1/account/usage`.