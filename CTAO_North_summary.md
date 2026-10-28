# CTAO-North (La Palma): summary of the array

**Confidence tags.** [S] means a search result in this session supports it. [D] means it comes from data the user provided (prod6 positions, ctapipe subarray info, prod6 IRF release figure). [R] means I'm recalling it and did not check it here.

## Site

- Roque de los Muchachos Observatory (ORM), La Palma, Canary Islands, Spain, at about 2200 m [S].
- prod6 reference point: lon −17.8920°, lat 28.7622°, height 2156 m [D].
- Terrain: the array sits on the north-western slope below the caldera rim. Ground in the layout rises by about 55 m from north-west to south-east (derived from the prod6 heights, see below). The caldera (Caldera de Taburiente) lies beyond the rim [R]. The site is often above a sea of clouds (visible in the LST-1 night photo).
- Neighbours: the two MAGIC telescopes (17 m dishes) are on the same site, about 100 m from LST-1 [S, D].

## Array composition

Alpha Configuration, approved for the first construction phase: **4 LSTs + 9 MSTs** in the north, covering about 0.5 km² [S]. The prod6 v1.0 IRF release calls its layout "Beta" with the same North composition, 4 LSTs + 9 MSTs [D]. Its layout figure gives the telescope names used below. I assume Alpha and Beta North share these positions.

The full prod6 La Palma layout has 32 positions: LST 1–4, 26 MST candidate positions (IDs 5–30) and MAGIC-I/II (IDs 31–32), with a 0.65 km² footprint [D].

## Telescope positions

The prod6 positions are in the ctapipe ground frame (x = north, y = west, z up) relative to the reference point, so Easting = −y and Northing = x. The match to the prod6 layout figure is within 1.5 m for all 13 telescopes [D].

| Name | prod6 ID | Easting (m) | Northing (m) | z (m) |
|---|---|---|---|---|
| LSTN-01 | 1 | 52.35 | −70.91 | 45.0 |
| LSTN-02 | 2 | −65.92 | −35.28 | 32.5 |
| LSTN-03 | 3 | −50.21 | 75.31 | 28.2 |
| LSTN-04 | 4 | 63.78 | 30.88 | 32.8 |
| MSTN-01 | 5 | −5.43 | −211.62 | 48.5 |
| MSTN-02 | 6 | −168.86 | −153.29 | 28.7 |
| MSTN-03 | 7 | −208.54 | 26.86 | 11.4 |
| MSTN-04 | 8 | −72.85 | 175.66 | 9.5 |
| MSTN-05 | 9 | 194.84 | 131.67 | 31.0 |
| MSTN-06 | 10 | 194.98 | −83.94 | 45.0 |
| MSTN-07 | 11 | 167.68 | −215.81 | 65.0 |
| MSTN-10 | 14 | 352.85 | 20.20 | 62.0 |
| MSTN-15 | 19 | 0.71 | 4.64 | 29.5 |
| MAGIC-I | 31 | 192.01 | −23.51 | 43.25 |
| MAGIC-II | 32 | 144.07 | −94.03 | 44.4 |

MSTN numbering is prod6 ID − 4.

**Heights.** I treat z as the height of each telescope's elevation axis above 2156 m. The ground height is then z minus the axis height of the 3D model (LST 14.5 m, MST 10.4 m, MAGIC 9.5 m). That interpretation is an assumption. The ground heights it gives agree between neighbours: MAGIC-I/II come out at about 34–35 m and LST-1 at 30.5 m.

## Status

- LST-1: operating since 2018 [S].
- LST-2 to LST-4: under construction. The LST-4 dish structure was lifted in May 2024, and completion was expected in 2026 (sources disagree on early vs. end of 2026) [S].
- MSTs: the first North MST was planned for 2026, the rest later [S].

## What the 3D model simplifies

- The terrain is interpolated from the 15 derived ground heights, plus noise. The rising ridge to the south-east, the slope towards the sea and the cloud layer are illustrative, not survey data.
- Roads are a minimal network joining the telescopes, not the real site roads.
- Other ORM observatories (GTC, WHT, etc.) are left out.
- Showers are a toy model: an axis parallel to the pointing, a longitudinal profile, a lateral light density falling off beyond about 130 m, projection into each camera, and light arrival times. Timescales are slowed down for display.

## Sources

- [CTAO's Alpha Configuration approved (APPEC)](https://appec.org/news/the-ctaos-telescope-alpha-configuration-approved-for-the-first-construction-phase/)
- [CTAO News: New array layouts (APPEC)](https://appec.org/news/ctao-news-new-array-layouts-for-the-upcoming-new-legal-entity/)
- [The Cherenkov Telescope Array (arXiv 2305.12888)](https://arxiv.org/pdf/2305.12888)
- [tilepy: CTANorthObservatory](https://tilepy.readthedocs.io/en/latest/api/tilepy.include.Observatories.CTANorthObservatory.html)
- [LST news: LST-4 dish structure installed](https://lst.iac.es/news/northern-hemisphere-array-begins-take-shape-installation-LST-4-dish-structure)
- [IFAE: MAGIC and CTAO](https://annualreport.ifae.es/2024/scientific-activities/gamma-ray-ground/)
- [CTAO IRFs prod5 v0.1 (Zenodo)](https://zenodo.org/records/5499840)
- [CTAO IRFs prod6 v1.0 (Zenodo)](https://zenodo.org/records/22871179)
- prod6 telescope positions and ctapipe `SubarrayDescription` info, provided by the user
