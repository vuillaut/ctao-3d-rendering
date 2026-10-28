# CTAO MST: summary of the telescope

The Medium-Sized Telescope (MST) is CTAO's workhorse for the core energy range, roughly 100 GeV to 10 TeV [R]. Both array sites get MSTs. A prototype ran in Berlin-Adlershof (the red telescope in the photo against trees) [R].

**Confidence tags.** [S] means a search result in this session supports it. [R] means I'm recalling it and did not check it here.

## How it differs from the LST

The LST is a 23 m parabolic dish on a lattice mount that rides on a rail. The MST is half the size and built differently:

- **Optics:** a modified Davies-Cotton design instead of a parabola. The facets are spherical and sit on a sphere of larger radius than the focal length. That gives a wider, sharper field of view at the cost of a slightly longer light-arrival time spread, which matters less at MST energies.
- **Mount:** a single steel cylinder tower with a turning head on top, instead of a lattice frame on a rail.
- **Camera support:** a four-legged quadrupod of steel tubes instead of one arch.
- **Balance:** a counterweight on an arm behind the dish offsets the camera's weight at the far end of the quadrupod.

## Key numbers

| Quantity | Value | Tag |
|---|---|---|
| Dish diameter | 12 m | S |
| Optical design | modified Davies-Cotton | S |
| Focal length | 16 m | S |
| Dish radius of curvature | 19.2 m (1.2 × f) | S |
| Mirror facets | 86 hexagonal, 1.2 m flat-to-flat (84 in the 2012 prototype design) | S |
| Facet radius of curvature | 32.14 m (spherical) | S |
| Effective mirror area | > 88 m² required | S |
| Tower | cylinder, about 9 m high, 2 m diameter, 3 floors | S |
| Camera mass | about 2.5 t, 16 m from the dish centre | S |
| Total mass | about 86 t including camera | S |
| Cameras | two designs, interchangeable: FlashCam and NectarCAM | S (two designs), R (names) |
| Camera field of view | about 7.5–8° | R |
| Pixels | 1855 (NectarCAM) or 1764 (FlashCam) | R |

## Mechanical parts

1. **Foundation and tower.** A steel cylinder about 9 m high and 2 m across [S]. Inside, three floors hold the electrical cabinets, the azimuth drive and the lubrication unit [S].
2. **Azimuth bearing and head.** The azimuth bearing sits on top of the tower and connects to the head, which turns with the telescope [S]. The head carries the elevation axle.
3. **Dish structure.** A steel space frame of red box girders in a triangular pattern, braced by grey tubes running from the rim back towards the elevation bearings (from photos).
4. **Mirror facets.** 86 hexagonal spherical facets, 1.2 m flat-to-flat, with the centre position left open [S]. Each facet has actuators for alignment (visible on the back in the prototype photo).
5. **Quadrupod.** Four steel legs from the dish rim to a square camera frame, braced by X-members and thin cables (from photos). It carries the 2.5 t camera about 16 m from the dish centre [S].
6. **Camera.** A white box on the camera frame. Either camera type fits without major changes to the structure [S].
7. **Counterweight.** A heavy box on a truss arm behind and below the dish, balancing the camera about the elevation axis (from photos). Its mass was not found.

## What the 3D model simplifies

- The facet layout is a hex grid trimmed to the 86 positions nearest the centre. The real layout leaves out positions shadowed by the quadrupod.
- The head, counterweight arm, bracing and camera size are estimated from the photos.
- The camera face shows a NectarCAM-like hex grid of 1855 pixels at 50 mm pitch.
- The elevation drive inside the head is not modelled.

## Sources

- [Status of the Medium-Sized Telescope for CTA](https://ar5iv.labs.arxiv.org/html/1509.01361)
- [The Medium Size Telescopes of the Cherenkov Telescope Array](https://arxiv.org/pdf/1610.02899)
- [Status of the CTA medium size telescope prototype (2012)](https://arxiv.org/pdf/1212.3110)
- [Status of the DC and SC MSTs (2019)](https://ar5iv.labs.arxiv.org/html/1907.08455)
- [DESY: Medium Size Telescope](https://astroparticle-physics.desy.de/research/gamma_astronomy/cta/medium_size_telescope/index_eng.html)
- [The next generation Cherenkov Telescope Array observatory](https://arxiv.org/pdf/1405.5696)
