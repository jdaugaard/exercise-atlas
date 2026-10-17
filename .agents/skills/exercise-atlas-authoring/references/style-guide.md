# Line art v1

The five assets in `assets/references/` are the original visual references. Their checksums are recorded in `assets/style-manifest.json`. The canonical style anchor is the seated wrist-cuff cable row. Use a second reference when its camera angle or equipment is helpful. References are original AI-generated illustrations, not copies of Everkinetic assets.

## Visual specification

- White background with generous clear space, crisp black contours and white body fill.
- A consistent faceless athletic adult figure with a simple dark hair silhouette, bare torso, plain black shorts and simple white trainers.
- Minimal anatomical contour lines and sparse light-gray equipment fills.
- A 3:2 landscape canvas with two equally sized positions at matching scale.
- Consistent camera and equipment geometry within each exercise. Choose side, frontal or three-quarter views according to what explains the movement.
- No captions baked into artwork, logos, gradients, realistic textures, shadow effects, decorative frames or muscle-color overlays. Add labels in the consuming layout.

The fixed generation instructions live in `assets/prompt-base.txt`, relative to the skill root.

## Describe mechanics separately

Include the exercise name, camera, actual equipment and attachment points, the two poses, and important features that must remain fixed. Specify joint and support positions rather than vague requests such as "correct form". For example, a wrist-cuff row needs visible cuff D-rings and cable connections, relaxed hands, a stable torso and an explicit low-pulley setup.

## Visual and content review

Check limb count, hand contact, cable continuity, equipment support, plate and lever positions, and whether the poses depict the intended exercise. A decline bench must lower the head below the hips; an RDL reverses at a controlled hinge depth above the floor; a hip-thrust schematic is not evidence of an actual manufacturer's mechanism.

Check font-free artwork and full subject visibility at thumbnail size. Compare outline weight, figure proportions, shorts, detail density and gray fills directly to the original reference. If a generation drifts toward realism or a different character, edit it using the original anchor.

Content validation and style review are separate. Every seeded example remains a draft. Actual cuff placement, machine setup and exercise technique need the relevant equipment/trainer review before a maintainer marks an entry reviewed. Load values are examples of logging conventions, not prescribed loads or conversions of existing training history.
