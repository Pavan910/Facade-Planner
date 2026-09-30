# Limitations

## Measurement
- **One 2D photo.** Depth, recesses, side walls and the rear of the house are not measured unless photographed and estimated separately.
- **No perspective correction.** Scale assumes the reference object is a standard size and roughly parallel to the camera, so strongly angled photos skew areas. Expect about ±10–20% on a straight-on photo; measured overrides reduce this.
- **Rectangular regions.** Curved, sloped or angled surfaces (gables, arches, sloped roofs) are approximated by their bounding box.
- **Face counts are assumptions.** Pillars default to 3 faces and parapets to 2; the user can change the pillar count.

## Detection
- AI detection returns approximate boxes and can miss or merge small elements (thin pillars, grilles). The review step is required for accuracy.
- Photos with heavy occlusion (trees, cars, gates in front) produce weaker results. The AI flags this and suggests a retake.
- Without `GROQ_API_KEY`, or if the AI service is unavailable, the app places a standard layout that the user fits by hand.
- Detection uses a free-tier, general-purpose vision model (`qwen/qwen3.8-27b` by default). Its boxes are rougher than a dedicated segmentation model's, and Groq lists it as a preview model that can be retired at short notice. Set `GROQ_MODEL` to switch models.
- The Groq free tier has request-per-minute limits. When they're hit, the app shows a message and falls back to the standard layout.

## Visualisation
- Textures are procedural and multiplied over the photo's own lighting. Structure and shadows are preserved, but the result is not photoreal for reflections, deep shadows, or objects in front of the house.
- Materials are applied to whole rectangles. A tree in front of a wall is painted over.

## Cost
- Rates are indicative Indian market figures and vary by city, brand and contractor. They are meant to be edited.
- Surface preparation, crack repair, primer, scaffolding, transport, electrical and plumbing are excluded.
- No structural checks are made (for example, whether a wall can carry stone cladding).
- Estimates are advisory and not legally binding.

## Platform
- Projects are saved in the browser's localStorage. They stay on that device and browser, are lost if site data is cleared, and fit roughly 10–20 projects (about 5 MB) before storage is full.
- There are no user accounts. The report is the way to share a plan with a contractor.
- The report is an HTML file. PDF comes from the browser's print dialog, not a generated PDF.

## Possible next steps
1. Segmentation masks (e.g. SAM prompted with the AI boxes) for pixel-accurate surfaces and occlusion handling.
2. Four-point perspective rectification before measuring.
3. Multiple photos (front, sides) combined into one estimate.
4. A diffusion inpainting pass, conditioned on edges, for photoreal renders.
5. Accounts with server-side project storage, sharing permissions, and supplier-maintained regional rate cards.
