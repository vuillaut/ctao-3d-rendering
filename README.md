# CTAO 3D rendering

Browser 3D models of CTAO telescopes and of the CTAO-North (La Palma) and CTAO-South (Paranal, Chile) arrays, built with three.js. No build step: open the HTML files directly, or use the GitHub Pages site.

## Pages

- `ctao-north.html`: the CTAO-North Alpha configuration (4 LSTs + 9 MSTs) at their prod6 positions, plus MAGIC-I/II, on illustrative terrain.
- `ctao-south.html`: the CTAO-South Alpha configuration (14 MSTs + 37 SSTs), with the 4 LSTs planned for a later phase as an optional layer and the VLT and ELT as approximate landmarks.
- `lst1.html`, `mst.html`, `sst.html`: standalone telescope models.

On both array pages all telescopes point together. Showers are simulated, projected into every camera, and shown in an event display.

## Code layout

- `js/common.js`: geometry helpers, materials, sky, the 1855-pixel camera face and pixel colours.
- `js/lstcam.js`: LSTCam pixel positions from the prod6 camera description, used for the LST and MST cameras.
- `js/lst.js`, `js/mst.js`, `js/sst.js`, `js/magic.js`: one builder per telescope type.
- `js/array.js`: the array scene (terrain, roads, pointing, showers, event display, picking), configured per site by `ctao-north.html` and `ctao-south.html`.
- `css/array.css`: shared styles for the array pages.

`sst.html` uses the shared builders. `lst1.html` and `mst.html` still carry their own copy of that code.

## Sources and accuracy

Each model mixes published values with estimates from photos. The summaries list which is which, with links:

- `LST-1_summary.md`, `MST_summary.md`, `SST_summary.md`
- `CTAO_North_summary.md`: telescope positions, the mapping from prod6 IDs to LSTN/MSTN names, and how ground heights were derived.
- `CTAO_South_summary.md`: MST positions from the prod5 Paranal simulation, SST positions read off the prod6 layout figure (about ±5 m), and the terrain derivation.

- `SHOWER_MODEL.md`: the air-shower physics used on the array pages (shower maximum, light pool, photoelectrons, trigger, timing), with sources.

The terrain, roads, vegetation and landmarks are illustrative. The shower model follows published scaling laws but is a simplified, closed-form model, not a full simulation.
