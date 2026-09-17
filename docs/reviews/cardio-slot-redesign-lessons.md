# Verification lessons

- Symptom: preview rendered blank at the deployment subpath. Cause: Vite's preview command used the default base while the build used `/cardio-slot/`. Prevention: pass the same base to build and preview. Apply in Playwright's managed server command.
- Symptom: keyboard focus left the native dialog in Safari. Cause: relying on browser Tab defaults, which vary with full keyboard access. Prevention: cycle the dialog's enabled focus targets explicitly. Apply to receipt keyboard acceptance in both engines.
- Symptom: WebKit offline emulation blocked navigation before the service worker. Cause: network instrumentation bypassed the normal browser failure path. Prevention: shut down a test-owned HTTP origin and navigate a fresh page. Apply to cross-engine offline tests; do not claim real offline proof from cache inventory alone.
- Symptom: Canvas preparation waited under an emulated clock. Cause: freezing rendering time during native Canvas work. Prevention: resume real time before verifying generated files. Apply after deterministic runtime/result assertions.
- Symptom: localStorage policy crashed startup. Cause: default argument evaluation escaped the adapter's catch. Prevention: acquire fallible browser APIs inside guarded adapter bodies. Apply to both read and write entry points and test the getter, not only methods.

- Symptom: sharing remained at Preparing image while another font was pending. Cause: the Canvas adapter waited for the entire page font set. Prevention: load only the faces the image uses, in parallel. Apply to Canvas preparation and test with a held unrelated font request; do not treat a green retry as a clean CI result.
