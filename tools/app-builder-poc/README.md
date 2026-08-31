# App Builder POC — RainFocus events feed (reference)

Training reference for backend devs (see `docs/rainfocus-integration.md`).

`actions/events-feed/index.cjs` is a sample Adobe App Builder / I/O Runtime action that
turns a (mocked) RainFocus response into the **exact JSON feed contract** the EDS
`event-cards` block consumes. It is NOT deployed — it's a code sample to study and extend.

## Run it locally
```
node actions/events-feed/index.cjs
```
Prints the feed JSON. Confirm the shape matches what the block expects:
`{ total, offset, limit, data:[{title,date,location,description,image,link,linktext}] }`.

## Turn it into a real integration
1. `aio app init` in a real App Builder project; drop this action in.
2. Replace `fetchRainFocus()` with a real authenticated call (key from params/env).
3. Keep `mapRainFocusEvent()` as the transform to the frozen contract.
4. Add caching (`@adobe/aio-lib-state`) + a cron trigger to refresh.
5. Deliver: CORS headers (option A) or write JSON into DA (option B, recommended).

The `.cjs` extension is only so it runs in this ESM repo (`package.json type:module`);
App Builder actions are CommonJS by default, so the code is deploy-ready as-is.
