# CTAO LST-1: summary of the telescope

LST-1 is the first Large-Sized Telescope of the Cherenkov Telescope Array Observatory (CTAO). It sits at the Roque de los Muchachos Observatory, La Palma. The camera went in on 25 September 2018 and the telescope was inaugurated on 10 October 2018.

**Confidence tags.** [S] means a search result in this session supports it. [R] means I'm recalling it from general knowledge and did not check it here. The 3D model uses both, and the [R] values should be checked against the LST design papers before anyone cites them.

## What it does

An imaging atmospheric Cherenkov telescope. A gamma ray hitting the upper atmosphere starts a particle shower that emits a brief (nanosecond) flash of blue Cherenkov light. The flash lights up a pool on the ground. The telescope's big mirror collects that light and focuses it on a fast camera, which records the shower image. The image shape and orientation give the direction and energy of the primary gamma ray. LSTs are optimised for the lowest energies (tens of GeV up to a few hundred GeV) [R], where showers are faint and a large mirror matters most.

## Key numbers

| Quantity | Value | Tag |
|---|---|---|
| Primary mirror | Parabolic, 23 m diameter | S |
| Focal length | 28 m | S |
| Mirror segments | 198 hexagonal facets, about 1.5 m flat-to-flat | S |
| Mirror area | roughly 370–390 m² | R |
| Camera pixels | 1855 PMT pixels | S |
| Camera modules | 265 modules of 7 pixels | S |
| Field of view | 4.5° | S |
| Camera size | light-sensitive area about 2.2 m across | S |
| Camera mass limit | 2000 kg | S |
| Pixel size | about 0.1° (about 50 mm pitch) | R |
| Readout | GHz-sampling fast electronics | S |
| Structure mass | design target 60–65 t with CFRP tubes | S (2013 design paper) |
| Park position | 95° zenith angle | S |
| Moments of inertia | about 12,000 t·m² (azimuth), about 6,000 t·m² (elevation) | S |
| Slew speed | about 180° in 20 s, for fast follow-up of gamma-ray bursts | R |
| Site altitude | about 2200 m | R |

## Mechanical parts

1. **Reflector dish.** Paraboloid with a 23 m aperture, built from 198 hexagonal facets. A parabola gives isochronous optics, which keeps the light flash short in time. Facets are mounted on a tubular dish frame.
2. **Mirror facets.** Each is about 1.5 m flat-to-flat. Each facet has motorised actuators (two per facet [R]) that tilt it.
3. **Active Mirror Control (AMC).** A system that re-aligns the facets online, about once every 10 s [S], to correct for deformation of the dish as it tilts and with temperature.
4. **Dish structure.** A tetrahedral space frame of tubes joined with the MERO node system. Carbon-fibre (CFRP) tubes of 80 or 100 mm diameter were chosen in the design instead of steel to save weight [S, 2013 design paper]. The design is basically a copy of the MAGIC azimuth substructure. I found no source confirming that the as-built LST-1 frame uses the CFRP tubes as designed.
5. **Camera support: arch, masts and ropes.** An arch rises over the dish and carries a square camera frame at the focal point, 28 m from the dish [S]. The design minimises mast weight and shadowing of the mirror. The structure includes 28 tension ropes [S].
6. **Camera.** 1855 high-quantum-efficiency PMT pixels in 265 seven-pixel modules, each with a light guide. It hangs on the camera frame on a rail system that lets it be moved relative to the mirror and unloaded for maintenance [S].
7. **CaliBox.** A calibration light source at the centre of the dish that flashes the camera, 28 m away [S].
8. **Access tower.** A structure placed in front of the telescope for camera maintenance [S].
9. **Elevation axis and drive.** The dish tilts about a horizontal axle carried by two towers on the azimuth platform.
10. **Azimuth structure and rail.** The telescope turns about a vertical axis on bogies running on a circular rail at ground level. The exact rail diameter was not confirmed; the model uses a schematic value.

## What the 3D model simplifies

- Facet positions use a hexagonal grid trimmed to 198 facets nearest the centre. The real layout may differ in detail.
- The dish frame, towers, arch and ropes are schematic. They show the right kind of structure and scale, not the real tube-by-tube geometry.
- The azimuth rail radius, tower geometry and axle position are estimates.
- The camera pixel grid is a hexagonal grid trimmed to 1855 pixels; module boundaries are not drawn.

## Sources

- [The Cherenkov Telescope Array Large Size Telescope (2013 design paper)](https://arxiv.org/pdf/1307.4565)
- [Camera calibration system for the first LST (SPIE)](https://journals.spiedigitallibrary.org/conference-proceedings-of-spie/12188/1218841/The-camera-calibration-system-for-the-first-Large-Sized-Telescope/10.1117/12.2629387.full)
- [Status of the CTA Large Size Telescopes](https://ar5iv.arxiv.org/html/1508.06438)
- [IFAE LST-1 page](https://www.ifae.es/instrumentation/lst1/)
- [IAC: LST-2 support structure completed](https://iac.es/en/outreach/news/support-structure-lst-2-roque-de-los-muchachos-observatory-completed)
- [MPP: telescope ready for mounting the mirrors](https://mpp.mpg.de/en/press/cta-telescope-ready-for-mounting-the-mirrors)
