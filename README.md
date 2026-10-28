# CTAO 3D rendering

Browser 3D models of CTAO telescopes and the CTAO-North array at La Palma, built with three.js. No build step: open the HTML files directly, or use the GitHub Pages site.

## Pages

- `ctao-north.html`: the CTAO-North Alpha configuration (4 LSTs + 9 MSTs) at their prod6 positions, plus MAGIC-I/II, on illustrative terrain. All telescopes point together; showers are simulated and projected into every camera, with an event display.
- `lst1.html`: standalone LST-1 model.
- `mst.html`: standalone MST model.

The array page builds its telescopes from `js/lst.js`, `js/mst.js` and `js/magic.js`, which share helpers from `js/common.js`. The two standalone pages still carry their own copy of that code.

## Sources and accuracy

Each model mixes published values with estimates from photos. The summaries list which is which, with links:

- `LST-1_summary.md`
- `MST_summary.md`
- `CTAO_North_summary.md` (telescope positions, the mapping from prod6 IDs to LSTN/MSTN names, and how ground heights were derived)

The terrain, roads, vegetation and the air-shower model are illustrative.
