# CTAO SST: summary of the telescope

The Small-Sized Telescope (SST) covers CTAO's highest energies, up to several hundred TeV, where showers are bright but rare, so many small telescopes spread over a large area are needed. All SSTs go to the southern site at Paranal, Chile: 37 in the Alpha Configuration [S]. The design comes from the ASTRI-Horn structure (INAF, Mount Etna) and the CHEC-S camera prototype, selected in 2019 [S].

**Confidence tags.** [S] means a quote or figure from a source read in this session. [R] means I'm recalling it and did not check it here. [P] means estimated from the two reference images (the CTAO SST render and the ASTRI photo).

## How it differs from the LST and MST

- **Two mirrors.** Light reflects off the large primary (M1) up to a secondary (M2), then back down to a camera sitting between them. This Schwarzschild-Couder-type design gives a short effective focal length (2.15 m) with a sharp image across a wide field. The small plate scale means small, cheap silicon photomultipliers (SiPMs) can replace photomultiplier tubes [S].
- **The camera faces the sky side.** It sits at the top of a central tube, 0.52 m below M2, looking up at it [S].
- **Fork mount on a conical tower.** The dish hangs in a fork on top of the tower, with counterweights on two long arms [S].

## Key numbers

| Quantity | Value | Tag |
|---|---|---|
| M1 diameter | 4.3 m | S |
| M1 segments | 18 hexagonal panels in three concentric rings with different aspheric profiles | S |
| M1 panel size | about 0.85 m flat-to-flat | R |
| M2 | monolithic glass shell, 1.8 m diameter, 19 mm thick | S |
| M1 to M2 distance | 3 m | S |
| M2 to camera distance | 0.52 m | S |
| Equivalent focal length | 2150 mm | S |
| Plate scale | 37.5 mm/° | S |
| Field of view | up to 10.5° diameter (CTAO requires 8°) | S |
| Focal surface | curved, spherical radius 1060 mm | S |
| Effective area | about 6 m² | S |
| Mount | altitude-azimuth, azimuth ±270°, elevation −1° to +90° | S |
| Structure mass | 16 t (ASTRI-Horn), about 25% reduction planned | S |
| Camera | SST-CAM, based on CHEC-S: 2048 SiPM pixels, 32 modules of 8 × 8 pixels, 6 × 6 mm each | S |
| Pixel angular size | 0.19° (another figure in the same paper quotes 0.16°) | S |
| Readout | 1 GSa/s waveform sampling, TARGET ASICs, 96–128 ns window | S |
| Primary dish mass | about 4.7 t | S |

## Mechanical parts

1. **Base and tower (column).** A conical steel tower on a concrete pad. It holds the azimuth bearing and drive [S].
2. **Fork.** Sits on the azimuth bearing, carries the elevation bearings and drives, and joins the telescope to the tower [S].
3. **Primary dish (M1 support).** Large and flat, built in two halves, about 4.7 t [S]. A grated walkway runs round its edge [P].
4. **Mast.** A slim quadrupod (four legs) with eccentric symmetry, fixed to the dish. It carries the M2 housing [S].
5. **Central tube.** Runs from the dish centre up to the camera [P].
6. **Secondary (M2) with housing.** A monolithic curved mirror in a faceted housing at the top of the mast [S, P].
7. **Counterweights.** Ballast on two long arms, balancing the mast and M2 [S].

## What the 3D model simplifies

- M1 and M2 are drawn as spheres (M1 radius 8 m, M2 concave, radius 2.17 m), which puts the camera about 0.52 m from M2 and gives an equivalent focal length of about 2.1 m near the axis. The real surfaces are high-order aspheric polynomials [S]. Spheres alone focus badly: rays from the outer M1 ring would land up to 25 cm off-centre. So the ray display is schematic. It treats M1 as a paraboloid, intersects M2, then draws the last leg to the ideal focus, the correction the aspheric surfaces provide.
- The camera modules form a 6 × 6 grid minus the four corners (32 modules) on the curved focal surface. I took the layout from CHEC-S [R] and the pixel pitch as 6.5 mm.
- The tower height, fork shape, elevation axis height (about 3.6 m), counterweight positions and the M2 housing shape are estimated from the images.

## Sources

- [The Small-Sized Telescopes for the Southern Site of the Cherenkov Telescope Array (ICRC 2021)](https://arxiv.org/pdf/2110.14527)
- [The ASTRI SST-2M Prototype: Structure and Mirror](https://arxiv.org/pdf/1307.4851)
- [The small-sized telescope of CTAO (INAF)](https://openaccess.inaf.it/entities/publication/b2b50a56-e1dd-49c3-8ed4-66cf6042dc3e)
- [Tagliaferri, SST status talk (2024)](https://indico.ict.inaf.it/event/2661/contributions/19288/attachments/8721/17970/Tagliaferri_SST_20240904.pdf)
