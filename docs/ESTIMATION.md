# How the estimation works

The whole pipeline is in [`src/lib/estimate.js`](../src/lib/estimate.js) as pure functions and is covered by [`tests/estimate.test.js`](../tests/estimate.test.js).

```mermaid
flowchart LR
  R[Region boxes px] --> S[Scale · ppf]
  S --> A[Net area sqft / length rft]
  A --> Q[Quantity + wastage]
  Q --> C[Material + labour cost]
  C --> T[Category totals · grand total]
```

## 1. Scale

A reference object of known real size converts pixels to feet:

```
ppf = reference size in px ÷ reference size in ft
```

| Reference | Pixel measure | Default real size |
|---|---|---|
| Window width | average width of all window boxes | 4 ft |
| Door / gate height | height of the first gate box | 7 ft |
| Façade width | widest wall box | 30 ft (enter the measured value) |

If the chosen reference isn't present, the photo is assumed to be 40 ft wide.

## 2. Surface area

For each region:

```
width_ft  = measured width  if entered, else box width  ÷ ppf
height_ft = measured height if entered, else box height ÷ ppf
area      = (width_ft × height_ft − openings) × faces
length    = width_ft
```

- **Openings:** a wall subtracts every window and door box that overlaps it (the overlapping part only).
- **Faces:**
  - Pillars: exposed faces, 1–4 (default 3: front and two sides).
  - Parapets: 2 (inner and outer).
  - Everything else: 1.
- **Running length (rft):** used for railings, and reported for slabs, parapets and roof edges.

## 3. Quantities

`waste` is the editable wastage percentage.

| Material | Quantity | Default constants |
|---|---|---|
| Exterior paint | `L = area × coats ÷ coverage × (1 + waste)` | 2 coats, 120 sqft/L, 10% |
| Texture finish | `kg = area × 0.11 × (1 + waste)` | 0.11 kg/sqft, 10% |
| Stone cladding | `sqft = area × (1 + waste)` | 12% |
| Elevation tiles 2×1 ft | `tiles = ⌈area × (1 + waste) ÷ 2⌉` | 8% |
| ACP panels 8×4 ft | `sheets = ⌈area × (1 + waste) ÷ 32⌉` | 10% |
| Glass / metal railing | `rft = length × (1 + waste)` | 0% / 5% |

## 4. Cost

```
material cost = quantity × material rate
labour cost   = area (or length for railings) × labour rate
line total    = material + labour
category      = sum of lines using the same material
grand total   = Σ categories × (1.18 if GST is on)
```

Every rate and wastage percentage can be edited in step 5; totals update immediately. Default rates are indicative Indian market figures (₹):

| Material | Material rate | Labour rate |
|---|---|---|
| Exterior paint | 380 / L | 18 / sqft |
| Texture finish | 140 / kg | 30 / sqft |
| Stone cladding | 220 / sqft | 65 / sqft |
| Elevation tiles | 180 / tile | 45 / sqft |
| ACP panels | 4,200 / sheet | 90 / sqft |
| Glass railing | 2,800 / rft | 350 / rft |
| Metal railing | 1,200 / rft | 250 / rft |

## Worked example (also a unit test)

A 30 × 20 ft wall with four 4 × 4.5 ft windows and one 3.5 × 7 ft door, painted:

| Quantity | Calculation | Result |
|---|---|---|
| Gross area | 30 × 20 | 600 sqft |
| Net area | 600 − 4 × 18 − 24.5 | 503.5 sqft |
| Paint | 503.5 × 2 ÷ 120 × 1.10 | 9.23 L |
| Material cost | 9.23 × ₹380 | **₹3,508** |
| Labour cost | 503.5 × ₹18 | **₹9,063** |

## Accuracy

- With a straight-on photo and standard-size windows, areas are typically within **±10–20%**.
- Error comes mainly from perspective, non-standard reference sizes, and how tightly the boxes fit.
- Typing one or two tape-measured dimensions (façade width, wall height) removes most of the scale error.
- The report states the reference used and its px/ft value, so a contractor can check it.
