# Higgsfield command-desk production handoff

## Status — 2026-09-17

**Three images completed on the existing Starter plan; no upgrade.**
The user explicitly requested adding Higgsfield generation tools. The plugin's
skill is available, but its generation tools are not exposed to this session;
the earlier in-app browser fallback also failed to attach on two attempts.

The provider's official connection page recommends its CLI for Codex. Installed
the official `@higgsfield/cli` package globally using npm and verified
`higgsfield version`: **1.1.25**, build
`b56caad0be879b6594ae69cfbf047e356678b7af`. This is a workstation tool, not a game
runtime dependency. The original OAuth attempt timed out; a new login on loopback
port 8765 completed with **Successfully authenticated** after the user approved it.
No access token was requested, printed or copied into this project.

The sole listed, user-owned workspace was selected. The first military pilot,
Nano Banana Pro at 4K, returned **`Error: "Pro" or "Ultimate" plan required`**,
without a job ID or charge; balance stayed at **253 credits**. That sequence stopped.

The user then requested the best usable model within their existing subscription.
Live image schemas and cost estimates were checked again. GPT Image 2.5 accepted
the military prompt and completed successfully, followed by politics and
intelligence with the same parameters: **`gpt_image_2_5`, `variant: flare`,
`quality: high`, `resolution: 2k`, `aspect_ratio: 3:2`**. Each estimate was 3 credits;
post-completion account status confirmed **244 credits**, a total decrease of 9.
All three job IDs reported completed. No upgrade, credit purchase, duplicate job,
other provider or runtime generation was used. This demonstrates access to this
specific model/parameter combination, not a benchmark of every available model.

The three native **2048x1360 PNGs** are preserved in
`design/source-assets/command-desk/`. Full-resolution, lossless WebPs are the runtime
assets in `src/assets/command-desk/`; decoded pixel comparison verifies the
conversion, with no resizing or upscaling. Provenance is in
`command-desk-generation.json`; prompts remain below. Achievement assets are untouched.

Visual review accepted the three scenes as supporting fictional atmosphere:
military dispatches/telephone, civilian deliberation, and radio/message review.
No conspicuous hand or wire defects, national identifiers, map geometry, readable
labels or modern screens were observed. The intelligence slips contain faint
non-readable marks despite the blank-paper prompt; they convey no actual message.
The illustrations are not verified reconstructions of uniforms, equipment or offices
for every country, nor portraits or evidence of actual events.

Earlier validation history: 24 era-boundary tests were added (33 art tests total).
A combined run previously stopped with ENOSPC; after disk space became available,
the three-file baseline passed **88/88**. Asset integration/build/browser results
are recorded separately in `../docs/higgsfield-assets-2026-09-17.md`.

Official setup sources:

- https://higgsfield.ai/mcp — recommends CLI for Codex.
- https://higgsfield.ai/cli — install and browser-login workflow.
- https://github.com/higgsfield-ai/cli — official cross-platform package and commands.
- https://higgsfield.ai/creator-hub/help-center/integrations/what-is-higgsfield-mcp
  — OAuth and credits; web Unlimited benefits do not cover MCP generations.
- https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent
  — active paid subscription requirement for agent integration.

This document continues `command-desk-art-direction.md`. It does not replace the
existing UI, hosting, engine, saves, map geometry or approval flow. Do not silently
substitute another image provider.

## Pilot and delivery

1. Resolve the actual available Higgsfield model and supported parameters. Do not
   invent model IDs or treat a preset listing as permission to execute it.
2. Produce one pilot per scene below with the same model, composition and style.
   Combine the common style, the scene and the common restrictions into each prompt.
3. Review the three pilots together before any larger production run. Reject
   artifacts or style drift; do not automatically submit repeated paid attempts.
4. Preserve original generated files at their native resolution. Prefer a
   landscape 3:2 output with at least 1920x1280 pixels when the model supports it;
   do not upscale and describe that as native detail. The existing 640x426 display
   slot is not a source-resolution or file-size cap.
5. Record provider, actual model, job ID, prompt, generation time, dimensions,
   output path and review status after a successful generation. Unknown licensing
   information remains unknown; generation alone is not a rights-clearance claim.

## Common style — reuse verbatim

```text
Historically grounded editorial game illustration in restrained oil and gouache,
with deliberate brushwork and clear architectural silhouettes. Environments use
charcoal blue and muted olive; people and focal documents carry warm ivory and
subdued brass, while warning red is reserved for interface signals, not decorative
lighting. Directional practical light creates a sober, human atmosphere without
cinematic haze or glossy surfaces. Maintain readable subject separation and a
consistent eye-level three-quarter perspective, leaving quiet negative space for
adjacent interface text.
```

## Military — field staff workroom

```text
A modest military staff workroom appropriate to 1936–1959, viewed at desk height.
Two anonymous staff members in plain, unmarked period service clothing quietly
compare blank dispatch folders beside a wooden document tray and a simple wired
field telephone. Their posture suggests routine preparation, not a battle victory,
emergency, or high-command ceremony. One restrained desk lamp illuminates the
papers and hands. Keep the room practical and unprestigious so it can support
different military career ranks. No maps or operational diagrams. Build a clear
composition around the desk, two human silhouettes, and a small area of warm paper.
```

## Politics — civil policy workroom

```text
A modest civilian policy workroom appropriate to 1936–1959, viewed at desk height.
Three anonymous civil staff members in understated period clothing quietly discuss
a set of blank policy folders around a plain wooden table. One person listens
while another indicates an unmarked sheet. Depict ordinary deliberation, not a
treaty signing, diplomatic recognition, independence declaration, election result,
or transfer of territory. No ceremonial furniture or head-of-state setting. A
shaded practical lamp creates a small warm focal area on the documents, surrounded
by a calm, subdued room.
```

## Intelligence — communications workroom

```text
A modest intelligence communications workroom appropriate to 1936–1959, viewed at
desk height. Two anonymous clerical staff members review unmarked message slips
beside a compact period radio receiver, wired headphones, a shaded task lamp, and
closed document folders. The equipment is simple and mechanically plausible, with
no readable frequencies or identifying markings. Show quiet assessment and patient
listening, not a successful interception, covert raid, named espionage operation,
or dramatic discovery. Keep faces secondary to the papers, hands, and restrained
silhouettes. No maps, pinboards, photographs, or location clues.
```

## Common restrictions

```text
Create one landscape supporting illustration for a roughly 3:2 display slot.
Keep the essential subject readable when reduced to 160–230 pixels wide. Use a
consistent medium-wide framing across the set, with a quiet, low-detail left edge.
Show fictional, unnamed people only. No recognizable historical faces, flags,
national emblems, military insignia, medals, identifiable landmarks, readable text,
numbers, signatures, seals, dates, borders, coordinates, troop markers, or
geographical outlines. No computers, digital screens, modern communications
equipment, fantasy devices, cinematic smoke, glossy rendering, dramatic red
lighting, interface elements, buttons, captions, logos, or watermarks. This is
atmospheric game illustration, not an archival photograph or evidence that an
event occurred.
```

## Integration and acceptance gates

- Save accepted images separately under `src/assets/command-desk/`; do not
  overwrite achievement images shared with other screens.
- Update the three imports in `src/commandDeskArt.ts` and provenance in
  `design/command-desk-assets.csv` only after the outputs exist and pass review.
- Preserve the 1936–1959 date gate, unknown-date omission, role selection and
  atmosphere caption. These generic scenes are not specific national offices.
- Keep all labels, numbers, buttons and decisions in HTML; preserve no-reward
  behavior when merely rendering or loading an image.
- Review hands, wires, equipment, perspective and visible era cues. The three
  scenes must remain distinguishable at their small in-game size.
- Check PC 1080p, 1440p and 4K, including the existing narrow-workbench rule that
  hides supporting art. Confirm no text obstruction, stretched art or overflow.
- Run the existing command-desk art tests and the production build after actual
  integration. This preparation-only step is not an integration test result.
