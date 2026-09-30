# Requirement coverage

This file maps each section of the problem statement to the part of the prototype that implements it.

## Functional requirements

| Requirement | Implementation | Where |
|---|---|---|
| **5.1** Upload building images | Multi-file picker and drag-and-drop; sample house | `UploadStep.jsx` |
| 5.1 Extract clear usable views | Every photo is scored and the best one is selected automatically; others can be chosen manually | `image.js › analyze`, `App.jsx › addFiles` |
| 5.1 Reject extremely low-quality input | Rejects on resolution < 640×360, too dark, overexposed, or too blurry (variance of Laplacian) | `image.js › analyze` |
| 5.1 Guide the user | Reason and retake tip per photo, shooting tips, AI guidance when the photo isn't a usable house exterior | `UploadStep.jsx`, `StructureStep.jsx` |
| **5.2** Identify walls, windows, balconies, pillars, parapet, gate, roof edge | A Groq-hosted vision model returns boxes for 8 types (balcony split into railing and slab/fascia) | `api/detect.js` |
| 5.2 Mapped representation | Colour-coded, labelled overlay on the photo plus a list with sizes in ft | `Stage.jsx`, `StructureStep.jsx` |
| 5.2 Review and correct | Move, resize from any corner, keyboard nudge, retype, add, delete, re-run AI, standard layout | `Stage.jsx`, `StructureStep.jsx` |
| **5.3** Material catalog | Paint, texture, stone, tiles, ACP panels, glass and metal railings; each with finishes, durability, upkeep, suitability and rates | `catalog.js` |
| 5.3 Different materials per section | Per surface, or to every surface of a type | `MaterialsStep.jsx` |
| 5.3 Preview combinations and switch designs | Three preset variations, unlimited custom ones, thumbnails with totals | `Variations.jsx` |
| **5.4** The user's own house redesigned | Textures multiplied over the photo's shading, clipped to each region, with openings kept | `render.js` |
| 5.4 Compare original and redesign | Before/after slider; both images in the report | `Stage.jsx`, `report.js` |
| **5.5** Areas: wall, balcony, pillar, railing, cladding | Net area per surface, opening subtraction, multi-face pillars and parapets, running lengths | `estimate.js › measure` |
| 5.5 Reference assumptions / user input | Window width, door height or façade width as reference; measured width and height per surface | `AreasStep.jsx` |
| **5.6** Quantity, wastage, coverage | Paint L (coats, coverage), texture kg, stone sqft, tile count, sheet count, railing rft, with each formula shown | `estimate.js › quantity` |
| **5.7** Material, labour, per category, grand total | Per line and per category, plus grand total with optional GST | `estimate.js › totals`, `CostStep.jsx` |
| 5.7 Modify rates and recalculate | Editable material, labour and wastage rates; live totals; reset button | `CostStep.jsx` |
| **5.8** Downloadable report | HTML download and print-to-PDF with original and redesigned images, materials, quantities with formulas, costs, other variations, rates and estimate basis | `report.js`, `ReportStep.jsx` |

## Non-functional requirements

| Requirement | How it is met |
|---|---|
| Usable by non-technical users | Six guided steps; plain-language guidance; defaults for everything; sample house to try first |
| Standard internet connections | Images are compressed in the browser (1024 px for AI, ≤1100 px for storage); editing and estimating run locally with no round trips |
| Results in reasonable time | Quality check is instant; AI detection takes a few seconds, with a progress overlay; all later steps update instantly |
| Re-editing and saving | Save at any step; reopen later; the whole state (regions, variations, rates, settings) is restored |
| Many users at once | Static CDN frontend and one stateless serverless function; editing, estimating and saving happen in each user's browser, so users share no server state |

## Deliverables (section 9)

| Deliverable | Location |
|---|---|
| System architecture | [ARCHITECTURE.md](ARCHITECTURE.md), and the in-app Documentation tab |
| User workflow | [WORKFLOW.md](WORKFLOW.md), and the in-app Documentation tab |
| Working prototype: upload, material application, redesign, area and cost estimation | The deployed app |
| How the estimation works | [ESTIMATION.md](ESTIMATION.md), and the in-app Documentation tab |
| Limitations | [LIMITATIONS.md](LIMITATIONS.md), and the in-app Documentation tab |
