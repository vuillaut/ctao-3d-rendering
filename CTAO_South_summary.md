# CTAO-South (Paranal, Chile): summary of the array

**Confidence tags.** [S] means a search result in this session supports it. [D] means it comes from data on this machine (the prod5 Paranal simulation file in the ctapipe cache, and the prod6 v1.0 IRF release). [R] means I'm recalling it and did not check it here. [F] means the value was read off the prod6 layout figure by eye.

## Site

- Atacama Desert, Chile, about 10 km south-east of ESO's Paranal Observatory (VLT on Cerro Paranal) [S]. Coordinates roughly 24°41′ S, 70°18′ W [S].
- Simulation observation level: 2147 m [D].
- Terrain: open, dry desert. The ground in the layout rises gently eastwards, about 2.5 m per 100 m, with about 85 m of relief across the 2 km array (derived from the prod5 heights, see below).
- Status: the contract for foundations (more than 50) and about 17 km of roads was signed on 3 July 2025. Groundbreaking took place on 17 December 2025, and the first telescopes are expected by the end of 2026 [S].

## Array composition

- **Alpha Configuration: 14 MSTs + 37 SSTs** [S]. This is what the 3D model shows.
- **4 LSTs planned for a later phase.** The CTAO site plan shows four LST foundations around the central MST, provided by the user. They match the 4 prod5 Paranal LST positions within the precision of the plan, and the model includes them as an optional, hidden-by-default layer. The prod6 v1.0 "Beta" configuration includes only 2 of them (LSTS-02 and LSTS-03) [D].
- The full prod5 Paranal simulation layout holds 180 telescope positions: 4 LST, 28 MST (each simulated with both FlashCam and NectarCAM) and 120 SST [D].

## Telescope positions

Coordinates are Easting and Northing in metres relative to the array reference. The simtel ground frame (x north, y west) was converted with Easting = −y and Northing = x, as for La Palma.

**MSTs.** I matched the 14 MSTs in the prod6 layout figure to the prod5 positions. All match within 5.4 m, so I used the exact prod5 coordinates [D]:

| Name | prod5 ID | Easting (m) | Northing (m) | z (m) |
|---|---|---|---|---|
| MSTS-01 | 5 | 0.00 | −0.02 | 24.35 |
| MSTS-02 | 8 | −151.22 | 1.43 | 25.0 |
| MSTS-03 | 6 | 151.22 | −1.47 | 31.0 |
| MSTS-04 | 11 | −74.20 | 147.43 | 21.0 |
| MSTS-05 | 12 | 77.02 | 145.98 | 26.0 |
| MSTS-06 | 10 | −237.05 | 156.49 | 24.0 |
| MSTS-07 | 13 | 240.01 | 151.91 | 30.0 |
| MSTS-08 | 20 | 2.96 | 308.42 | 19.5 |
| MSTS-09 | 16 | 74.20 | −147.46 | 28.0 |
| MSTS-10 | 15 | −77.02 | −146.01 | 28.0 |
| MSTS-11 | 17 | 237.05 | −156.53 | 38.5 |
| MSTS-12 | 14 | −240.01 | −151.95 | 27.0 |
| MSTS-13 | 26 | 159.60 | −316.72 | 35.0 |
| MSTS-14 | 24 | −165.65 | −313.60 | 30.5 |

**SSTs.** The prod6 SST positions differ from prod5: the nearest prod5 SST is 17–158 m away. So the 37 SST positions (SSTS-01 to 32 and 36 to 40) are **read off the prod6 layout figure** [F], with an accuracy of about ±5 m. Their exact prod6 coordinates (for example from a prod6 Paranal `SubarrayDescription`) would replace these directly.

**LSTs (later phase).** From the prod5 file [D]: LSTS-01 (64.82, −20.64), LSTS-02 (0.77, 79.99), LSTS-03 (−65.20, −19.40), LSTS-04 (−1.15, −120.03). In the site plan they sit north, west, east and south of MSTS-01.

## Heights and terrain

As for La Palma, I treat each z as the telescope's elevation-axis height above 2147 m. The ground is z minus the axis height of the 3D model (LST 14.5 m, MST 10.4 m, SST 3.6 m). The terrain is interpolated through the ground heights at all 152 distinct prod5 positions, which cover the whole site. SSTs sit on that interpolated terrain, because their prod6 z values aren't available.

## Landmarks (illustrative)

Cerro Paranal with the VLT (summit 2635 m [R]) is placed about 10 km north-west, and Cerro Armazones with the ELT (3046 m [R]) is placed to the north-east. Their directions and distances are approximate.

## What the 3D model simplifies

- SST positions come from the figure, as described above.
- Roads are a minimal network joining the telescopes, not the real 17 km layout.
- The surrounding hills and the two landmarks are illustrative.
- Showers use the same toy model as the North page. Energies follow an E⁻² spectrum, so SSTs mostly light up for the rarer bright, high-energy showers.

## Sources

- [ESO: construction begins on CTAO-South (eso2521)](https://eso.org/public/news/eso2521/)
- [ESO announcement ann25005: CTAO-South foundations contract](https://eso.org/public/announcements/ann25005/)
- [EurekAlert: groundbreaking ceremony](https://www.eurekalert.org/news-releases/1110459)
- [CTAO status talk, SA3CC 2026 (G. Hughes)](https://www.amlight.net/wp-content/uploads/2026/01/CTAO_SA3CC_2026-Gareth-Hughes.pdf)
- [CTAO IRFs prod6 v1.0 (Zenodo)](https://zenodo.org/records/22871179), local copy: layout figure and README
- prod5 Paranal simulation file from the ctapipe test data cache (`gamma_prod5.simtel.zst`), read with pyeventio
