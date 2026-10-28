# Air-shower model used in the array pages

The array pages (`js/array.js`) simulate gamma-ray air showers with simple closed-form physics. The aim is the right trends with energy, not detector-grade accuracy. It is not a CORSIKA/sim_telarray simulation.

**Tags.** [cited] means read in a source during this work. [derived] means worked out from first principles (for example the atmosphere fits). [model] means a heuristic tuned to match the cited anchors, not a published fit. [recall] means from memory, not verified.

## Energy

- **Default ("spread evenly"):** E is drawn uniformly in log E between the site's limits: 15 GeV to 100 TeV at La Palma, 50 GeV to 300 TeV at Paranal. This shows all energies.
- **"Realistic":** a Crab-like power law, dN/dE ∝ E^−2.5. The Crab spectral index is about 2.5 [cited: Hinton 2008; HEGRA 2.62, MAGIC log-parabola 2.47 [recall]]. With it, only about 1 event in 1000 is above 1 TeV.
- **Buttons:** fire a 50 GeV or a 30 TeV shower on demand.

## Longitudinal development

- **Depth of shower maximum:** X_max = X0 · ln(E/Ec), with X0 = 36.7 g/cm² and Ec = 83 MeV [cited: de Naurois & Mazin 2015]. That gives about 85 g/cm² deeper per decade of energy. Each shower also gets a Gaussian shift of about 35 g/cm² [recall].
- **Profile:** Greisen formula, N(t) = 0.31/√y · exp[t(1 − 1.5 ln s)], with t = X/X0, y = ln(E/Ec) and age s = 3t/(t + 2y) [cited: de Naurois & Mazin, Eq. 6]. Cherenkov emission per g/cm² does not depend on altitude, so N(t) weights the emission points directly [cited].
- **Atmosphere:** exponential, X(h) = 1030 g/cm² · exp(−h/7.6 km). The 7.6 km scale height fits the US Standard Atmosphere to within 0.3 km between 5 and 13 km [derived].
- **Inclined showers:** slant depth is used along the axis, which is parallel to the pointing.

| E | X_max | height of max (vertical) |
|---|---|---|
| 20 GeV | 220 g/cm² | 12.4 km a.s.l. |
| 100 GeV | 260 g/cm² | 10.5 km |
| 1 TeV | 345 g/cm² | 8.3 km |
| 10 TeV | 429 g/cm² | 6.7 km |
| 100 TeV | 514 g/cm² | 5.3 km |

The 1 TeV row matches de Naurois & Mazin (345 g/cm², about 8 km) [cited].

## Light on the ground

- **Photon density inside the pool:** about 90 photons/m² per TeV (300–550 nm) at about 2000 m. This is about 100 ph/m²/TeV over 300–600 nm [cited: Hinton 2008; Völk & Bernlöhr 2009: about 1000 photons on 100 m² at 100 GeV], scaled by 1/λ² to the narrower band [derived].
- **Pool radius:** about 120 m at 2200 m [cited: Hinton; Völk & Bernlöhr give about 125 m]. Geometry, (h − h_obs)·√(2(n−1)), gives 123 m [derived].
- **Lateral shape ρ(R, E)** [model, tuned to the cited anchors]:
  - flat inside the ring, with a hump at 120 m that fades above 1 TeV
  - fall-off length outside the ring of 45 m · (E/100 GeV)^0.15
  - an extra core peak above 1 TeV, because deeper showers fill in the centre [cited qualitatively: Völk & Bernlöhr; Chitnis & Bhat]
- **The drawn light pool** uses this same ρ(R, E), out to where it drops to 3% of the ring value. Its size and brightness therefore grow with energy.

## In the telescopes

- **Photoelectrons:** ρ(R, E) × effective mirror area × 10%. The 10% covers atmosphere, mirrors and photodetectors [cited: Völk & Bernlöhr; Hinton]. Mirror areas are LST 369 m², MST 88 m² [cited: CTA papers] and SST about 6 m² [cited: SST paper, effective area].
- **Image shape:** emission points along the axis are weighted by the Greisen profile and projected into each camera. Each point is spread by about 10 m across the axis [model], which gives a width of about 0.1° at 1 TeV, 100 m [cited anchor: Hinton]. Width grows with energy as showers come closer. Length and the distance of the image from the source position grow with impact distance, both from the geometry.
- **Pixel brightness:** shown on a log scale, from faint blue at about 5 photoelectrons to saturated yellow at about 300.
- **Trigger:** at least 50 photoelectrons in the camera, with at least 3 pixels of 5 or more [model, recall]. This reproduces thresholds of about 20 GeV (LST), about 100 GeV (MST) and about 1 TeV (SST) [cited energy ranges: CTA papers; de Naurois & Mazin].
- **Arrival times:** path length from each emission point plus the refractive delay of the air, (n_obs − 1) · 8.4 km · (1 − e^(−D/8.4 km)) [derived]. The time gradient along the image then changes sign at about 100 m from the axis: near the axis the end nearest the source position arrives last, far out the other end does. MAGIC observes this qualitatively [cited: Aliu et al. 2009].
- **Display timescale:** about 0.12 s per ns inside an image. Arrival differences between telescopes are compressed to at most about 1 s.

## Collection radius this model gives (≥ 50 p.e., photon-limited)

| E | LST | MST | SST |
|---|---|---|---|
| 20 GeV | 140 m | – | – |
| 100 GeV | 220 m | 160 m | – |
| 1 TeV | 410 m | 320 m | 150 m |
| 10 TeV | 720 m | 590 m | 350 m |
| 100 TeV | 1250 m | 1070 m | 730 m |

At high energy the real limit is often the camera's field of view, not the photon count. The model handles this naturally: light that lands outside the camera is lost.

## Not modelled

Hadronic background showers, night-sky background, the electron angular distribution (beyond the 10 m lateral spread), the geomagnetic field, atmospheric absorption differences between sites, and the exact camera trigger logic.

## Sources

- M. de Naurois & D. Mazin 2015, *Ground-based detectors in very-high-energy gamma-ray astronomy*: https://arxiv.org/abs/1511.00463
- H. Völk & K. Bernlöhr 2009, *Imaging very high energy gamma-ray telescopes*: https://arxiv.org/abs/0812.4198
- J. Hinton 2008, *Ground-based gamma-ray astronomy with Cherenkov telescopes*: https://arxiv.org/abs/0803.1609
- J. Aliu et al. (MAGIC) 2009, timing analysis: https://arxiv.org/abs/0810.3568
- V. R. Chitnis & P. N. Bhat, Cherenkov lateral distributions: https://arxiv.org/abs/astro-ph/9802201
- The Cherenkov Telescope Array overview: https://arxiv.org/abs/2305.12888
- MST status: https://arxiv.org/abs/2310.02127
- SST, Tagliaferri 2024: https://indico.ict.inaf.it/event/2661/contributions/19288/attachments/8721/17970/Tagliaferri_SST_20240904.pdf
- H.E.S.S. II Crab spectrum: https://arxiv.org/abs/1509.02902
