# Sandalwood Garden Estate

## Ultra-Detailed Product Requirements Document (PRD)

`<small>`{=html}Version 2.0 · Measurement-led 3D environment
specification · Software-only browser experience`</small>`{=html}

> **Purpose of this document**\
> This PRD is the design and implementation source of truth for a highly
> detailed, explorable 3D garden estate and luxury sandalwood-inspired
> wooden home. It specifies dimensions, proportions, colours, materials,
> object counts, character appearance, room layouts, lighting,
> interactions, animation, water behaviour, day/night states,
> performance, and acceptance tests. The development agent should not
> invent a different layout or visual direction unless a conflict is
> explicitly documented.

> **Measurement convention**\
> All world dimensions are in metres (m), unless stated otherwise. Use a
> consistent scale: **1 world unit = 1 metre**. Dimensions are target
> dimensions; a tolerance of ±5% is acceptable for decorative assets.
> Structural dimensions, room connections, counts, and façade
> composition must match exactly.

------------------------------------------------------------------------

# 1. Product definition

## 1.1 Product name

**Sandalwood Garden Estate**

## 1.2 Product vision

Build a peaceful, premium, first-person 3D exploration website. The user
begins in a large flower garden with two characters, follows a single
main path to a handcrafted wooden home, enters through the front door,
and explores a fully furnished luxury interior, two bedrooms with
ensuite bathrooms, a kitchen, a dining/family hall, outdoor balconies, a
swimming pool, and a laundry/utility area.

The experience should feel like walking through a real, carefully
designed estate. It must not look like a low-detail game prototype, a
collection of disconnected rooms, or a static 3D model.

## 1.3 Product principles

1.  **Architectural consistency:** Exterior walls, windows, doors,
    balconies, and interior rooms must align.
2.  **Measured design:** Use the dimensions and counts in this document
    as the baseline.
3.  **Material realism:** Wood must look like wood, glass like glass,
    water like water, fabric like fabric, and metal like metal.
4.  **Purposeful detail:** Every visible object must have a plausible
    location and scale.
5.  **Playable first:** A user must be able to complete the entire route
    without getting stuck.
6.  **Quiet luxury:** Rich detail, restrained decoration, warm light,
    and uncluttered surfaces.
7.  **Performance-aware:** Use instancing, level of detail, texture
    atlases, and quality settings instead of creating thousands of
    expensive independent objects.

## 1.4 Experience type

-   Browser-based 3D website.
-   Desktop-first, keyboard and mouse.
-   Single-player, first-person exploration by default.
-   No sensors, hardware, login, backend, or multiplayer required for
    version 1.
-   The two characters are visible at the starting area; the user
    controls one selected character.

------------------------------------------------------------------------

# 2. Global coordinate system and scale

Use the following coordinate convention throughout the scene: - X:
left/right when facing the front of the house. - Y: vertical height. -
Z: depth, with positive Z pointing from the house toward the
garden/path. - The front façade faces the garden and the positive-Z
direction. - The house footprint is centred near the world origin. - The
main entrance is on the right half of the front façade when viewed from
the garden.

## 2.1 Global dimensions

  Element                                    Target dimension
  -------------------------------- --------------------------
  Garden playable area                  80 m wide × 70 m deep
  House footprint                       24 m wide × 18 m deep
  Main floor-to-ceiling height                          3.4 m
  Upper floor-to-ceiling height                         3.1 m
  Ground-floor slab thickness                          0.25 m
  Exterior timber wall thickness                       0.25 m
  Interior partition thickness                         0.15 m
  Main entrance door                 1.25 m wide × 2.4 m high
  Standard interior door              0.9 m wide × 2.1 m high
  Main pathway                                     2.4 m wide
  Player eye height                                    1.65 m
  Player collider height                                1.8 m
  Player collider radius                               0.32 m

These dimensions define the initial build. If the agent changes any
structural dimension, it must update the floor plan, furniture
positions, collision geometry, and documentation together.

------------------------------------------------------------------------

# 3. Master site plan

## 3.1 Garden zoning

Divide the 80 m × 70 m garden into these zones:

  ------------------------------------------------------------------------
  Zone                              Approximate size Contents
  --------------------- ---------------------------- ---------------------
  Arrival / character                      12 × 10 m Two characters, start
  start                                              marker, low planting

  Main flower garden                       50 × 45 m Flower beds, grass,
                                                     shrubs, trees

  Main pathway                            2.4 m wide Continuous route to
                                                     porch

  Front porch                                6 × 3 m Steps, columns,
                                                     bench, wall lamps

  House footprint                          24 × 18 m Main house

  Pool terrace                              12 × 8 m Pool, loungers,
                                                     towels, side tables

  Utility / service                          5 × 4 m Laundry door, dryer
  court                                              vent, service access

  Perimeter planting                        Variable Trees, hedges, stone
                                                     edging
  ------------------------------------------------------------------------

The user should be able to walk around the house and reach the pool
terrace and service court. Do not place the pool across the main
entrance path.

## 3.2 Main pathway

-   Width: 2.4 m.
-   Main route length: approximately 28 m from character start to porch.
-   Surface: warm beige natural stone pavers.
-   Individual paver size: 0.6 m × 0.3 m, with 8--12 mm visual joints.
-   Edge border: 0.12 m wide darker stone strip on both sides.
-   Path height: 0.03 m above garden soil.
-   Add low path lights every 3 m on alternate sides.
-   Path lights: 0.45 m tall, dark bronze base, warm 2700 K light.
-   Path must remain free of flower clusters, stones, and collision
    obstacles.

## 3.3 Garden ground and grass

-   Terrain base: gentle, nearly level landscape with height variation
    no greater than 0.5 m across the playable area.
-   Grass height: 0.08--0.16 m.
-   Grass blade colour range: deep garden green `#315B3A`, medium green
    `#4F7948`, and a small amount of lighter green `#7C9B5A`.
-   Avoid a single flat green material.
-   Add subtle patches of soil under planting beds.
-   Use instanced grass clusters; do not model every blade as an
    independent high-cost mesh.

------------------------------------------------------------------------

# 4. Flower specification

## 4.1 Flower-bed layout

Create **12 principal flower beds**: - 4 beds on the left side of the
main path. - 4 beds on the right side of the main path. - 2 beds near
the arrival/start area. - 2 beds around the outer garden perimeter.

Each principal bed should be approximately 3.0 m × 1.5 m, with rounded
or gently curved ends. Keep a 0.5 m maintenance gap between beds where
practical.

Create at least **7 flower varieties**, using procedural geometry or
licensed assets.

## 4.2 Flower varieties and dimensions

  ---------------------------------------------------------------------------------------
  Variety     Total height  Flower head Petal        Main petal   Centre      Stem
                               diameter dimensions   colour                   
  ----------- ------------ ------------ ------------ ------------ ----------- -----------
  Daisy       0.28--0.42 m 0.06--0.09 m 10--14       Ivory        Golden      `#3D7545`
                                        petals, each `#FFF4D6`    `#E7B63D`   
                                        0.035 ×                               
                                        0.012 m                               

  Rose        0.35--0.65 m 0.07--0.11 m 18--28       Dusty pink   Deep rose   `#315F3D`
                                        layered      `#D9899C` or `#8B3448`   
                                        petals       crimson                  
                                                     `#A83D52`                

  Tulip       0.30--0.50 m 0.05--0.08 m 6 petals,    Coral        Slightly    `#47764A`
                                        each         `#F07863`,   darker      
                                        0.06--0.09 m yellow       petal tone  
                                        long         `#F3C84B`,               
                                                     purple                   
                                                     `#9477C6`                

  Sunflower   0.70--1.20 m 0.18--0.26 m 20--32       Golden       Brown       `#376C3D`
                                        petals, each yellow       `#68452C`   
                                        0.08--0.12 m `#F4C542`                
                                        long                                  

  Lavender    0.35--0.55 m 0.02--0.04 m Many tiny    Purple       Not         `#4B7047`
                                cluster florets      `#8D75B8`    distinct    
                                  width                                       

  Hydrangea   0.35--0.60 m 0.10--0.16 m 20--35 small Blue         Slightly    `#3F7048`
                                cluster florets      `#7EA8D8` or darker      
                                                     pale pink                
                                                     `#DFA5B6`                

  Marigold    0.25--0.45 m 0.05--0.08 m 25--40       Orange       Dark orange `#3B6B3D`
                                        ruffled      `#E98732`    `#A94D21`   
                                        petals                                
  ---------------------------------------------------------------------------------------

## 4.3 Petal construction and texture

-   Petals should be thin, gently curved meshes, not flat circles.
-   Petal thickness: 0.0015--0.003 m.
-   Petal roughness: 0.55--0.75.
-   Use subtle translucency or subsurface-like shading where supported.
-   Vary petal rotation by 5--15 degrees to avoid perfect radial
    repetition.
-   Add subtle veins or colour gradients on larger petals.
-   Do not use one identical flower head for every plant.
-   Flower centres should have a different roughness and colour from
    petals.

## 4.4 Stems, leaves, and growth

-   Stem radius: 0.002--0.006 m for small flowers; 0.008--0.014 m for
    sunflowers.
-   Stem colour: dark natural green `#315F3B`, with mild variation.
-   Leaves: 2--8 per plant depending on species.
-   Leaf length: 0.04--0.16 m.
-   Leaf width: 0.015--0.06 m.
-   Leaves should have a central vein and a slight bend.
-   Add small thorns only to rose stems, used sparingly.
-   Plant bases should disappear naturally into soil, not float above
    it.

## 4.5 Flower distribution

-   Target total: 450--650 visible flower plants across the garden.
-   Use a mix of heights and colours, with colour groupings rather than
    random noise.
-   Do not place tall sunflowers directly in front of the house entrance
    or block the view of the front door.
-   Use dense flower clusters at the outer beds and lower flowers near
    the pathway.
-   Keep the first-person view readable: flowers should not obstruct the
    camera at eye height along the path.

## 4.6 Flower animation

-   Gentle sway: 2--4 degrees from vertical.
-   Sway cycle: 3.5--6.5 seconds, with different phase offsets.
-   Wind direction should be consistent across nearby plants.
-   Do not animate every petal independently.
-   Disable or reduce flower sway on Low graphics settings.

------------------------------------------------------------------------

# 5. Trees, shrubs, and garden details

## 5.1 Trees

Place 8--12 trees around the perimeter and pool zone. Do not block the
house façade.

  Tree property                       Specification
  ----------------------------------- ---------------------------------
  Height                              4.5--7.0 m
  Trunk height before main branches   1.8--2.5 m
  Trunk diameter                      0.25--0.45 m
  Crown diameter                      3.0--5.0 m
  Bark colour                         `#6D503A`
  Leaf colour                         `#3D7047`, `#56824C`, `#78965B`
  Bark roughness                      0.8
  Leaf roughness                      0.7

Include at least three visual tree silhouettes, such as a broad-canopy
shade tree, a slender ornamental tree, and a flowering tree. Tree
species can be stylised rather than botanically exact.

## 5.2 Shrubs and hedges

-   Shrub height: 0.45--0.9 m.
-   Hedge height: 0.75 m.
-   Hedge width: 0.6 m.
-   Use rounded, irregular silhouettes.
-   Colours: dark green `#315B3A` and medium green `#52784A`.
-   Add a few flowering shrubs near the porch and pool terrace.

## 5.3 Garden props

Include: - 6--8 decorative natural stones, each 0.2--0.6 m across. - 4
garden benches, each 1.5 m wide × 0.55 m deep × 0.85 m high. - 8--10 low
path lights. - 3 large outdoor planters, 0.45 m high × 0.5 m diameter. -
2 bird baths or small garden sculptures. - 1 garden hose reel near the
service court. - 1 watering can and a few gardening tools placed neatly
near a discreet potting corner. - Optional butterflies at a very low
density; no swarms that distract from navigation.

------------------------------------------------------------------------

# 6. Player characters

## 6.1 Character system

Two characters must be visible at the start: 1. One female character. 2.
One male character.

Both should have a polished, stylised-realistic 3D art style: appealing
proportions, natural materials, detailed clothing, expressive faces, and
believable idle animation. Avoid extreme cartoon proportions or uncanny
photorealism.

The user chooses one character to control. The other remains a
companion/NPC. Provide a character selection card before starting, or a
simple selector on the start screen.

## 6.2 Shared character proportions

  Property                              Target
  ----------------------------- --------------
  Male character height                 1.78 m
  Female character height               1.66 m
  Head height                     0.22--0.24 m
  Shoulder width, male                  0.46 m
  Shoulder width, female                0.40 m
  Approximate body width          0.42--0.48 m
  Eye height standing, male             1.67 m
  Eye height standing, female           1.56 m
  Foot length, male                     0.27 m
  Foot length, female                   0.24 m

These are stylised adult character proportions, not measurements of a
real person.

## 6.3 Male character appearance

**Overall look:** A friendly young adult with a calm, welcoming
appearance.

  Feature          Specification
  ---------------- ---------------------------------------------------
  Height           1.78 m
  Build            Average/athletic, natural proportions
  Skin tone        Medium warm brown, base `#A96F4F`
  Skin roughness   0.58
  Hair             Dark brown-black `#211B19`
  Hair style       Short, softly textured, slightly wavy, neat sides
  Hair roughness   0.72
  Eyes             Dark brown `#34231D`
  Eyebrows         Dark brown-black, natural density
  Facial hair      Clean-shaven by default
  Top              Cream linen/cotton shirt `#E9DFC9`
  Bottom           Deep olive trousers `#46533E`
  Shoes            Dark brown casual leather shoes `#4B3428`
  Accessories      Simple wristwatch with dark strap

**Clothing detail** - Shirt collar thickness: approximately 0.015 m. -
Sleeves: rolled to mid-forearm. - Shirt fabric: subtle linen weave,
roughness 0.8. - Trouser fabric: matte cotton, roughness 0.85. - Shoe
sole: 0.018 m thick, dark rubber. - Avoid large logos and visible brand
marks.

## 6.4 Female character appearance

**Overall look:** A friendly young adult with an elegant, natural
appearance.

  Feature              Specification
  -------------------- ------------------------------------
  Height               1.66 m
  Build                Average, natural proportions
  Skin tone            Warm medium brown, base `#B77D5C`
  Skin roughness       0.58
  Hair                 Very dark brown `#211916`
  Hair style           Long, softly wavy hair to mid-back
  Hair roughness       0.76
  Eyes                 Deep brown `#35231E`
  Eyebrows             Dark brown, softly shaped
  Top/dress            Muted dusty-rose or cream outfit
  Main outfit colour   Dusty rose `#C9828B`
  Accent colour        Warm cream `#F0E5D2`
  Shoes                Tan flats `#9B704F`
  Accessories          Small understated earrings

**Clothing detail** - Fabric should show a subtle woven texture. - Use
natural folds around elbows, waist, and knees. - Avoid shiny
plastic-looking fabric. - Hair should be built from groomed strands or
layered hair cards with soft highlights, not one solid helmet-shaped
mesh. - Hair movement should be subtle and should not clip through the
shoulders.

## 6.5 Face and skin material

-   Use physically based skin shading where available.
-   Skin base colour must not look grey, orange, or waxy.
-   Add slight roughness variation around cheeks, forehead, and nose.
-   Lips should have a natural muted tone.
-   Eyes need sclera, iris, pupil, eyelids, and catchlights.
-   Avoid oversized glossy eyes.
-   Add subtle facial expression and blinking.
-   Do not overdo pores or skin imperfections; keep the style clean and
    welcoming.

## 6.6 Character animation

Required animations: - Idle breathing. - Blinking. - Gentle head/eye
movement. - Walk cycle. - Faster walk/run cycle. - Turn-in-place. - Sit
and stand. - Door interaction reach animation if feasible.

Movement animation should match actual player speed. Feet must not slide
visibly. If a full animation rig is not available, use a tasteful
procedural placeholder and document the limitation.

## 6.7 Starting positions

-   Both characters start near the beginning of the pathway.
-   Keep them approximately 0.8 m apart.
-   Face them generally toward the house.
-   The active character is highlighted subtly in the selection screen.
-   The companion should not block the path.
-   Do not place the characters inside flower beds.

------------------------------------------------------------------------

# 7. House architecture and exterior

## 7.1 Architectural form

Use a **rectangular main house footprint** with a slightly projecting
central porch, a modest upper floor, and two balconies. The main volume
should be rectangular and elegant, not an irregular fantasy shape.

The style is a blend of: - Contemporary tropical timber residence. -
Natural luxury lodge. - Warm handcrafted sandalwood-inspired detailing.

The house must not resemble a brick building. Structural realism may use
hidden support geometry, but all visible exterior wall surfaces should
read as timber, timber panels, or complementary natural stone.

## 7.2 Overall dimensions and levels

  Element                                            Dimension
  ------------------------------------- ----------------------
  Main footprint                                   24 m × 18 m
  Ground floor area, approximate                  432 m² gross
  Upper floor area, approximate                    250--290 m²
  Ground-floor wall height                               3.4 m
  Upper-floor wall height                                3.1 m
  Ground-to-upper floor slab                            0.25 m
  Roof ridge height above upper floor                    2.4 m
  Total roof peak height                  Approximately 10.0 m
  Porch projection                                       3.0 m
  Porch width                                            6.0 m

The house can use a partial upper floor to create a premium
double-height feeling in the living hall. Ensure all required rooms
remain on the navigable floor plan.

## 7.3 Exterior timber

**Primary timber appearance** - Warm sandalwood-inspired honey brown:
`#B88755`. - Secondary timber: `#95683F`. - Highlight grain:
`#D3AD7B`. - Deep joints/shadow gaps: `#69472F`.

**Material settings** - Wood roughness: 0.55--0.75. - Wood normal/bump
strength: subtle, not exaggerated. - Grain direction should follow the
plank direction. - Plank width: 0.12--0.22 m. - Visible plank gaps:
0.004--0.008 m. - Structural posts: 0.20--0.28 m square. - Beam depth:
0.18--0.25 m.

Use different timber grain maps for large surfaces where possible to
prevent obvious tiling.

## 7.4 Front façade --- mandatory arrangement

When looking from the garden toward the front of the house: - One large
window is on the **left**. - The main entrance door is on the
**right**. - The porch and door align with the main garden pathway. -
The left window must be visible from the pathway. - Do not reverse this
layout.

**Front window** - Outer frame: 2.4 m wide × 1.7 m high. - Sill height:
0.75 m. - Timber frame thickness: 0.08 m. - Two or three glass panels. -
Optional timber shutters, each 0.55 m wide. - Warm cream curtains
visible inside. - Glass should reflect the garden softly without
becoming a mirror.

**Main door** - Size: 1.25 m wide × 2.4 m high. - Timber slab thickness:
0.06 m. - Vertical grain direction. - Four recessed decorative panels. -
Handle: brushed antique brass, 0.25 m long. - Hinges: dark bronze. -
Threshold: 0.025 m high maximum for accessibility. - Door opens inward,
with a hinge pivot at the correct edge.

## 7.5 Windows and doors --- exact count

The initial house should contain: - **12 windows total** across both
floors. - **1 main exterior entrance door**. - **1 rear/service exterior
door**. - **1 pool terrace sliding glass door**. - **8 interior hinged
doors** (room doors and bathrooms, with the exact room plan below). -
**2 balcony access doors**.

Windows should be distributed to provide natural light without
compromising privacy. The agent must keep the front façade window on the
left and main door on the right.

## 7.6 Roof

-   Main roof: low-pitched hip or gable roof with clean modern
    proportions.
-   Roof overhang: 0.75 m.
-   Visible roofing: dark warm-brown timber shingles or high-quality
    dark bronze standing-seam roof.
-   Fascia: dark walnut `#553B2A`.
-   Soffit: lighter timber `#C49A68`.
-   Add gutters and downpipes in dark bronze.
-   Avoid a cartoon cottage roof or excessively steep fantasy roof.

## 7.7 Porch and exterior lighting

-   Porch floor: 6 m × 3 m.
-   Two timber columns: 0.22 m square.
-   Two wall sconces, one on each side of the entrance zone.
-   One wooden bench: 1.6 m wide.
-   One large planter on each side, not blocking the door.
-   Porch ceiling: timber slats with recessed warm lights.
-   Exterior lighting colour temperature: 2700 K.
-   Use a soft, warm pool of light; avoid harsh spotlights.

## 7.8 Balconies

Provide **two balconies** on the upper floor: - Main balcony: 5.0 m wide
× 1.6 m deep. - Secondary balcony: 3.0 m wide × 1.4 m deep. - Timber or
dark bronze balustrade height: 1.05 m. - Balustrade gaps must look safe
and consistent. - Floor finish: exterior timber decking. - Add two
chairs and a small side table on the main balcony. - Add two planters
with low foliage. - Ensure balcony doors connect to the upper-floor
interior and are not decorative dead ends.

## 7.9 Exterior material transitions

Use timber as the dominant material. Complement it with: - Natural beige
stone for porch steps and selected foundation sections. - Dark bronze
metal for railings and fixtures. - Clear or lightly tinted glass for
windows and balcony doors. - Warm off-white soffit or ceiling details.

Do not expose large areas of red brick, concrete block, or unfinished
grey concrete.

------------------------------------------------------------------------

# 8. House floor plan

## 8.1 Required room programme

The house must include: 1. Main living hall. 2. Kitchen to the left when
entering the house. 3. Secondary dining/family hall beyond the kitchen.
4. Bedroom 1. 5. Attached bathroom 1. 6. Bedroom 2. 7. Attached bathroom
2. 8. Laundry/utility room with washer and dryer. 9. Small entrance
foyer. 10. Upper-floor landing / gallery. 11. Two balconies. 12. Storage
/ linen closet.

## 8.2 Ground-floor zoning

Use the 24 m × 18 m footprint as a planning envelope.

Recommended room sizes:

  Space                   Approximate internal dimensions
  --------------------- ---------------------------------
  Entrance foyer                              2.5 × 2.8 m
  Main living hall                            7.0 × 6.0 m
  Kitchen                                     4.5 × 4.2 m
  Dining/family hall                          5.0 × 4.2 m
  Bedroom 1                                   4.2 × 4.0 m
  Ensuite bathroom 1                          2.4 × 2.6 m
  Laundry / utility                           2.2 × 2.4 m
  Stair / circulation                         2.6 × 4.0 m
  Storage                                     1.2 × 1.5 m

The agent may adjust room placement to fit the footprint, but must
preserve the specified connections and room dimensions within ±5%.

## 8.3 Upper-floor zoning

  Space                           Approximate internal dimensions
  ----------------------------- ---------------------------------
  Bedroom 2                                           4.5 × 4.2 m
  Ensuite bathroom 2                                  2.5 × 2.7 m
  Upper landing/gallery                               3.0 × 4.0 m
  Walk-in / built-in wardrobe                         2.0 × 2.2 m
  Balcony 1                                           5.0 × 1.6 m
  Balcony 2                                           3.0 × 1.4 m
  Linen / storage                                     1.2 × 1.5 m

Bedroom 1 and Bedroom 2 must be on separate halves/sections of the
house, not combined into one open sleeping area. Each bedroom must have
its own bathroom directly connected to it.

## 8.4 Circulation and doorway clearances

-   Main circulation width: minimum 1.2 m.
-   Main room door clear width: 0.9 m.
-   Bathroom door clear width: 0.8 m.
-   Main entrance clear width: 1.15 m minimum.
-   Keep at least 0.8 m walking clearance around beds where possible.
-   Keep 0.9 m clear in front of kitchen counters.
-   Keep a 1.0 m clear route from the entrance to the main hall and room
    connections.
-   Do not put furniture in the centre of door swings.

## 8.5 Interior wall finishes

-   Main wall colour: warm ivory `#F1E8D8`.
-   Secondary wall colour: soft sand `#D9C6A8`.
-   Feature walls: vertical timber slats in `#A8794D`.
-   Timber trim: `#8A603E`.
-   Ceiling: warm off-white `#F4F0E8`.
-   Wall roughness: 0.85.
-   Avoid pure white `#FFFFFF` across large surfaces.
-   Use a small number of feature walls; do not make every wall a
    different colour.

## 8.6 Floor finishes by room

  Room          Floor material              Colour / finish
  ------------- --------------------------- ---------------------------------
  Foyer         Natural stone               Warm beige `#C9B99F`, matte
  Living hall   Engineered timber           Honey oak `#B88A5A`, satin
  Kitchen       Large-format porcelain      Warm limestone `#C8BDAA`, matte
  Dining hall   Engineered timber           Honey oak `#B88A5A`
  Bedrooms      Timber flooring             Natural walnut/honey mix
  Bathrooms     Anti-slip porcelain/stone   Light warm grey `#B9B3A8`
  Laundry       Matte porcelain             Mid warm grey `#AAA398`
  Balcony       Exterior timber decking     Medium teak `#986B45`

------------------------------------------------------------------------

# 9. Main living hall --- object-level specification

## 9.1 Room dimensions and mood

-   Target size: 7.0 m × 6.0 m.
-   Ceiling height: 3.4 m, with an optional double-height section up to
    5.8 m.
-   Mood: warm contemporary luxury.
-   Palette: ivory, sandalwood, taupe, muted olive, antique brass.
-   Main focal point: large television and timber/stone feature wall.

## 9.2 Sofa

Provide one main 3-seat sofa and one 2-seat loveseat or two accent
chairs.

**Main sofa** - Width: 2.7 m. - Depth: 0.95 m. - Seat height: 0.44 m. -
Back height: 0.85 m. - Upholstery: warm taupe `#B7A797`. - Fabric: woven
linen-like texture, roughness 0.9. - Cushions: 5--6, in cream, olive,
and muted rust. - Legs: dark walnut, 0.12 m high. - Seat cushions must
have subtle seams and slight compression.

**Secondary seating** - Loveseat: 1.8 m wide × 0.9 m deep, or two accent
chairs. - Accent chair dimensions: 0.82 m × 0.82 m × 0.85 m. - Accent
colour: muted olive `#68735A` or dusty terracotta `#B8755F`.

## 9.3 Coffee table / teapoy

Use one central rectangular or softly rounded coffee table. - Size: 1.2
m × 0.65 m × 0.42 m high. - Top: light beige stone or warm walnut. -
Base: solid timber or dark bronze. - Edge radius: 0.025 m. - Place a
tray, two coasters, one small book stack, and one decorative object. -
Keep the remote visible and reachable from the sofa.

## 9.4 Television and console

**Television** - Screen size: approximately 75 inches. - Aspect ratio:
16:9. - Screen body width: approximately 1.66 m. - Screen body height:
approximately 0.94 m. - Bezel: 0.01--0.02 m, dark graphite. - Screen
finish: low-gloss, subtle reflections. - Mounting centre height:
approximately 1.25 m from floor. - TV should face the primary sofa
directly.

**TV console** - Width: 2.4 m. - Height: 0.48 m. - Depth: 0.42 m. -
Finish: walnut/sandalwood timber with subtle brass handles. - Include
two or three cabinet fronts and one open shelf. - Add a small speaker or
soundbar beneath the TV.

## 9.5 TV remote

-   Dimensions: 0.18 m long × 0.045 m wide × 0.018 m thick.
-   Body: matte charcoal `#292A2B`.
-   Buttons: black and dark grey, with one small red power button.
-   Include directional ring, OK button, volume, channel, home, and back
    buttons.
-   Add tiny white button labels only if readable at close range.
-   Place it on the coffee table, angled slightly toward the sofa.
-   Interaction: E shows a close-up inspection panel or a small tooltip;
    optional E action toggles TV power when the remote is the active
    target.

## 9.6 Flower vase

-   Vase height: 0.28 m.
-   Maximum body diameter: 0.16 m.
-   Shape: softly rounded ceramic, narrow neck.
-   Main colour: warm ivory `#E9E0D2`.
-   Glaze: satin, roughness 0.28--0.38.
-   Add 5--7 stems of seasonal flowers.
-   Place on the TV console or side table, not both with identical
    duplicates.
-   Stems must enter the vase opening; flowers must not float.

## 9.7 Display showcase

Provide one built-in display cabinet or freestanding showcase. - Width:
1.8 m. - Height: 2.1 m. - Depth: 0.42 m. - Timber frame: dark walnut
`#68472F`. - Doors: clear glass with subtle reflections. - Shelves: 4. -
Contents: ceramic pieces, two books, a small framed photo/artwork, and
one decorative sculpture. - Use warm internal LED strips at 2700 K. - Do
not fill every shelf; leave negative space.

## 9.8 Curtains and window dressing

-   Full-height curtains with a double layer: sheer ivory and heavier
    taupe.
-   Curtain rod: dark bronze.
-   Curtain fabric should have visible vertical folds.
-   Window sill may hold one small plant or a ceramic object.
-   Do not block the view or make curtains intersect the sofa.

## 9.9 Ceiling and lighting

-   Main ceiling: warm off-white.
-   Add timber ceiling detail or a shallow recessed tray.
-   Main chandelier/pendant: restrained contemporary design, 0.8--1.0 m
    diameter.
-   Recessed downlights: 8--10, each 0.07 m diameter.
-   Cove LED: 3000 K.
-   Task/floor lamp: 2700 K.
-   Daylight should enter through the front window.
-   At night, use layered lighting; do not rely on one bright ceiling
    light.

------------------------------------------------------------------------

# 10. Kitchen --- full inventory and design

## 10.1 Room dimensions and palette

-   Target size: 4.5 m × 4.2 m.
-   Counter height: 0.90 m.
-   Counter depth: 0.65 m.
-   Upper cabinet depth: 0.35 m.
-   Upper cabinet underside height: 1.45 m.
-   Palette: warm walnut, cream, light limestone, brushed brass,
    charcoal accents.

## 10.2 Cabinetry and worktops

-   Lower cabinets: warm walnut `#80583B`.
-   Upper cabinets: warm cream `#E8DFD0`.
-   Worktop: light beige quartz/stone `#D8CDBB`.
-   Backsplash: handmade-look ivory ceramic or subtle stone.
-   Cabinet handles: brushed brass or dark bronze.
-   Drawer gaps: 0.003 m.
-   Add soft-close hinges visually where feasible.
-   Include one tall pantry cabinet.

## 10.3 Appliances

Include exactly one each: - 4-burner gas or induction cooktop. -
Built-in oven. - Extractor hood. - Refrigerator/freezer, approximately
0.9 m wide × 0.75 m deep × 1.9 m high. - Microwave. - Dishwasher. -
Electric kettle. - Toaster. - Optional coffee machine.

Appliance colours: stainless steel, matte black, or coordinated cream.
Avoid mixing too many unrelated finishes.

## 10.4 Stove / cooktop

-   Countertop cooktop size: 0.75 m × 0.52 m.
-   Four burners or four induction zones.
-   Burner rings dark graphite.
-   Control knobs or touch controls on the front edge.
-   Add subtle metal grates if gas.
-   Do not create real fire or dangerous simulation; visual flame is
    optional and cosmetic only.

## 10.5 Sink and tap

-   Sink bowl: 0.55 m × 0.45 m × 0.20 m.
-   Finish: brushed stainless steel.
-   Tap height: 0.35 m above countertop.
-   Tap style: curved gooseneck, brushed brass or stainless.
-   Add one smaller filtered-water tap if desired.
-   Include a dish rack and one sponge, placed neatly.

## 10.6 Utensil inventory

Provide a visible, organised set of utensils: - 6 teaspoons. - 6
tablespoons. - 6 dinner forks. - 6 dinner knives. - 4 cooking spoons. -
2 wooden spatulas. - 1 ladle. - 1 slotted spoon. - 1 whisk. - 1 pair of
tongs. - 1 vegetable peeler. - 1 kitchen knife block with 5 knives. - 2
chopping boards. - 1 colander. - 1 measuring cup. - 1 measuring spoon
set. - 1 canister set with 3 jars. - 1 pair of oven mitts.

Utensil dimensions: - Teaspoon: 0.14 m long. - Tablespoon: 0.19 m
long. - Dinner fork: 0.20 m long. - Dinner knife: 0.22 m long. - Cooking
spoon: 0.30 m long. - Ladle: 0.32 m long. - Spatula: 0.30 m long.

Materials: - Stainless steel utensils: metallic finish, roughness
0.25--0.4. - Wooden utensils: warm beech/walnut, roughness 0.7. -
Silicone utensils: muted sage or charcoal, roughness 0.65.

Place utensils in a cutlery tray, utensil crock, drawer, or hanging
rail. Do not scatter them randomly across the counters.

## 10.7 Vessels and cookware

Include: - 2 saucepans. - 1 large stockpot. - 1 frying pan. - 1 deep
pan. - 2 baking trays. - 1 pressure cooker. - 1 kettle. - 6 dinner
plates. - 6 side plates. - 6 bowls. - 6 drinking glasses. - 4 mugs. - 2
serving bowls. - 1 teapot. - 1 water jug.

Cookware should have believable handles, lids, and material thickness.
Use stainless steel, dark non-stick, or enamel finishes. Place pots in
cabinets or on a rack; do not make every vessel sit on the stove.

## 10.8 Kitchen small details

-   Fruit bowl with 4--6 pieces of fruit.
-   Salt and pepper containers.
-   Oil bottle.
-   Spice jars, 8--12 maximum.
-   Tea and coffee containers.
-   Dish towel on a handle.
-   One small plant near a window.
-   Under-cabinet LED strip, 3000 K.
-   Subtle reflections on polished metal.
-   Keep at least 40% of the counter surface visually clear.

## 10.9 Kitchen interaction

-   E can inspect the refrigerator, oven, cooktop, sink, or selected
    utensil group.
-   Optional cabinet/drawer interaction may open one or two
    representative drawers.
-   Do not implement every utensil as a physics object in version 1.
-   Avoid making the player collide with every small object on the
    counter.

------------------------------------------------------------------------

# 11. Dining / secondary family hall

-   Target dimensions: 5.0 m × 4.2 m.
-   Dining table: 2.0 m × 0.95 m × 0.76 m high.
-   Seating: 6 chairs, each approximately 0.48 m wide.
-   Table finish: walnut or warm oak.
-   Chair upholstery: cream or taupe.
-   Pendant light: 0.55 m diameter, 3000 K.
-   Sideboard: 1.6 m wide × 0.45 m deep × 0.85 m high.
-   Centrepiece: low ceramic bowl or vase.
-   Add one framed artwork and one indoor plant.
-   Provide a clear route to the bedroom circulation area.
-   Optional table setting: 6 placemats, plates, glasses, and cutlery,
    neatly aligned.

------------------------------------------------------------------------

# 12. Bedrooms

## 12.1 Shared bedroom design rules

Both bedrooms must feel like premium hotel suites but have distinct
identities. Do not duplicate every object and colour.

Each bedroom includes: - Bed and headboard. - Mattress and layered
bedding. - Two bedside tables. - Two bedside lights or one lamp and one
wall light. - Wardrobe. - Rug. - Curtains. - Wall art. - At least one
small decorative object. - Attached bathroom door. - A clear path around
the bed.

## 12.2 Bedroom 1 --- ground floor

  Element          Specification
  ---------------- ---------------------------------------
  Room size        4.2 × 4.0 m
  Bed              King, 1.8 × 2.0 m
  Bed height       0.55 m including mattress
  Headboard        2.2 m wide × 1.25 m high
  Bedside tables   0.5 × 0.42 × 0.52 m, two
  Wardrobe         2.4 m wide × 0.65 m deep × 2.4 m high
  Rug              2.8 × 2.2 m
  Desk/vanity      1.1 × 0.5 × 0.75 m
  Accent chair     0.75 × 0.75 × 0.82 m

**Palette** - Walls: warm ivory `#F1E8D8`. - Feature wall: muted sand
`#D6C2A4`. - Bedding: ivory `#F5F0E7`, taupe `#B7A795`, olive accent
`#727B61`. - Timber: walnut/honey `#946B47`. - Metal: brushed bronze.

**Bedding details** - Fitted sheet. - Duvet with visible folds. - 4
sleeping pillows. - 2 decorative cushions. - One textured throw folded
across the lower third of the bed. - Fabric roughness: 0.85--0.95. -
Avoid rigid, perfectly flat bedding.

## 12.3 Bedroom 2 --- upper floor

  Element          Specification
  ---------------- ---------------------------
  Room size        4.5 × 4.2 m
  Bed              Queen/king, 1.8 × 2.0 m
  Bed height       0.55 m
  Headboard        2.2 m × 1.2 m
  Bedside tables   0.48 × 0.42 × 0.52 m, two
  Wardrobe         2.2 m × 0.65 m × 2.4 m
  Rug              2.6 × 2.2 m
  Reading desk     1.2 × 0.55 × 0.75 m
  Chair            0.55 × 0.55 × 0.85 m

**Distinct palette** - Main walls: warm ivory. - Accent: muted sage
`#9AA58A` or dusty blue `#8297A8`. - Bedding: cream, pale sage, and soft
grey. - Timber: slightly darker walnut than Bedroom 1. - Artwork:
botanical or abstract landscape.

## 12.4 Bedside lighting

-   Bedside lamp height: 0.45--0.55 m.
-   Shade diameter: 0.22--0.28 m.
-   Light temperature: 2700 K.
-   Light intensity: soft, localised pool of light.
-   Optional concealed LED behind headboard: 2700--3000 K.
-   Add independent bedside light controls.
-   Light should not illuminate the whole room as strongly as the
    ceiling fixture.

## 12.5 Wardrobe interior

-   Hanging rail at 1.65 m.
-   Upper shelf at 2.1 m.
-   Drawer stack at 0.75 m.
-   Include a few neatly arranged garments, hangers, folded towels, or
    storage boxes.
-   Use sliding or hinged doors with correct clearances.
-   Optional mirror panel on one wardrobe door.

## 12.6 Bedroom ceiling

-   Main ceiling colour: warm off-white `#F4F0E8`.
-   Add a recessed tray or timber border.
-   Cove lighting: 3000 K.
-   Recessed lights: 4--6 per bedroom.
-   Fan optional: 1 ceiling fan, approximately 1.2 m diameter, matte
    wood/dark bronze.
-   Fan blades must rotate slowly and safely as a visual animation.
-   Do not place ceiling lights directly over the pillow area if the
    design can avoid it.

------------------------------------------------------------------------

# 13. Bathrooms --- full fixture specification

There are exactly **two ensuite bathrooms**, one attached to each
bedroom.

## 13.1 Shared bathroom palette

-   Main wall: warm light stone `#D5D0C5`.
-   Accent: beige marble-look porcelain `#BEB4A4`.
-   Vanity timber: walnut `#765238`.
-   Metal finish: brushed nickel or brushed brass.
-   Glass: clear with subtle green edge tint.
-   Lighting: 3000 K, with 2700 K optional vanity accent.

## 13.2 Bathroom dimensions and zoning

  Element                  Bathroom 1    Bathroom 2
  --------------------- ------------- -------------
  Internal size           2.4 × 2.6 m   2.5 × 2.7 m
  Vanity width                  0.9 m         1.0 m
  Shower zone             0.9 × 1.1 m   1.0 × 1.1 m
  Shower glass height           2.0 m         2.0 m
  Mirror width                  0.8 m         0.9 m
  Door width                    0.8 m         0.8 m

## 13.3 Wall and floor tiles

-   Wall tile target size: 0.6 × 1.2 m.
-   Floor tile target size: 0.6 × 0.6 m.
-   Grout width: 0.003--0.005 m.
-   Floor roughness: 0.65--0.8, anti-slip appearance.
-   Wall tile roughness: 0.35--0.5.
-   Use a restrained stone pattern; avoid high-contrast busy marble.
-   Shower floor should slope subtly toward the drain.

## 13.4 Toilet / commode

-   Modern close-coupled or wall-hung toilet.
-   Approximate width: 0.38 m.
-   Depth: 0.68 m.
-   Seat height: 0.42 m.
-   Ceramic colour: warm white `#F1EFE9`.
-   Seat and lid must be separate visible forms.
-   Add flush plate or tank controls.
-   Add a discreet toilet brush holder and toilet paper holder.
-   Do not place the toilet directly against the shower glass.

## 13.5 Washbasin and vanity

-   Floating vanity: 0.9--1.0 m wide.
-   Counter depth: 0.48 m.
-   Counter height: 0.85 m.
-   Basin: 0.48 × 0.34 m.
-   Basin finish: white ceramic or pale stone.
-   Tap: single-lever mixer, brushed nickel/brass.
-   Tap height: approximately 0.18 m above basin.
-   Mirror: 0.8--0.9 m wide, 0.9 m high.
-   Add soft LED backlight around mirror.
-   Add soap dispenser, toothbrush cup, hand towel, and small tray.
-   Keep the counter mostly clear.

## 13.6 Shower and shower hardware

-   Shower area: 0.9--1.0 m wide × 1.1 m deep.
-   Glass partition thickness: approximately 0.01 m.
-   Shower head: 0.22--0.28 m diameter rainfall head.
-   Shower head height: 2.05 m.
-   Hand shower on vertical rail.
-   Mixer control at approximately 1.05 m.
-   Drain: linear drain, 0.5--0.7 m long.
-   Add one small recessed niche for shampoo and soap.
-   Glass should have subtle reflections and not be fully invisible.

## 13.7 Shower water behaviour

When the user activates the shower: 1. A short handle interaction
occurs. 2. Water begins after a 0.2--0.4 second delay. 3. Water
particles emerge from the shower head in a downward cone. 4. Particle
density should look like a continuous shower at normal viewing distance.
5. Add subtle translucent streaks, not large opaque white rods. 6. Water
should hit the floor and create a small, subtle splash effect. 7. Water
should not pass through the glass partition or walls. 8. Stop the flow
when the user interacts with the control again.

**Visual settings** - Particle lifetime: 0.35--0.8 seconds. - Particle
size: 0.002--0.006 m. - Downward velocity: visually equivalent to 3--5
m/s. - Shower cone angle: 20--30 degrees. - Water tint: near-transparent
cool blue-white. - Avoid bright saturated blue water particles. - Sound:
soft water spray, with a mute setting. - This is a visual simulation
only; no real fluid solver is required.

## 13.8 Bathroom accessories

Each bathroom includes: - 2 folded bath towels. - 2 hand towels. - 1
bath mat. - 2 soap/shampoo bottles. - 1 conditioner bottle. - 1 soap
dispenser. - 1 toothbrush cup. - 1 toilet roll. - 1 toilet brush. - 1
small waste bin. - 1 towel rail. - 1 small plant or subtle decorative
object.

------------------------------------------------------------------------

# 14. Laundry and utility room

Provide a dedicated laundry/utility room. The user explicitly expects a
dryer; it must be present as a separate appliance, not merely implied.

## 14.1 Dimensions and layout

-   Room size: approximately 2.2 × 2.4 m.
-   Door width: 0.8 m.
-   Floor: matte warm-grey porcelain.
-   Wall: washable warm off-white.
-   Worktop: 0.6 m deep.
-   Provide ventilation grille or a believable dryer vent solution.

## 14.2 Appliances

-   1 front-loading washing machine: 0.6 × 0.65 × 0.85 m.
-   1 front-loading tumble dryer: 0.6 × 0.65 × 0.85 m.
-   They may be side by side or stacked in a safe-looking built-in
    arrangement.
-   Both appliances should have a circular front door, control panel,
    detergent drawer, and small status display.
-   Appliance finish: white or graphite.
-   Add laundry basket, detergent bottles, folded towels, and a small
    shelf.
-   Optional wall-mounted drying rack.

## 14.3 Interaction

-   E can inspect the washer or dryer.
-   Optional interaction toggles a simple idle/status display.
-   No full washing simulation is required in version 1.

------------------------------------------------------------------------

# 15. Swimming pool and terrace

## 15.1 Pool dimensions

-   Rectangular pool: 8.0 m long × 4.0 m wide.
-   Water depth: 1.35 m.
-   Pool coping: 0.25 m wide.
-   Pool deck: at least 1.5 m clear width around accessible sides.
-   Pool should be positioned to the side/rear of the house, not across
    the main entrance path.

## 15.2 Pool material and water colour

-   Water base tint: clear blue `#4F9FC4`.
-   Deeper region: `#287FA8`.
-   Shallow edge: `#78C2D8`.
-   Water opacity: high transparency with visible depth.
-   Water roughness: low, but not mirror-like.
-   Add subtle refraction/reflection where performance permits.
-   Pool floor should be visible in shallow areas.
-   Pool tiles: small pale aqua mosaic or light blue stone.
-   Pool edge: warm beige natural stone.

## 15.3 Water animation

-   Gentle surface ripples, 0.01--0.03 m visual amplitude.
-   Ripple cycle: 2--5 seconds.
-   Add subtle moving caustic patterns on the pool floor.
-   No large waves in a calm residential pool.
-   Add small edge reflections and soft moving highlights.
-   Water should remain within the pool boundary.
-   Optional user interaction: press E at the poolside to inspect the
    pool; do not allow accidental walking into the pool unless swimming
    is deliberately implemented.

## 15.4 Pool terrace furnishings

-   2 sun loungers, each approximately 1.9 × 0.65 m.
-   1 small side table, 0.45 m diameter.
-   2 folded towels.
-   2 planters.
-   1 outdoor umbrella, approximately 2.5 m diameter.
-   Outdoor furniture materials: teak, cream fabric, dark bronze.
-   Add low-level terrace lights for night.

------------------------------------------------------------------------

# 16. Day, sunset, night, and weather states

The environment should support at least three lighting states. Use a
time-of-day control in settings or a gentle automatic cycle.

## 16.1 Day

-   Sun elevation: 35--60 degrees.
-   Sky: soft blue with light cloud variation.
-   Outdoor colour temperature: neutral daylight.
-   Strong but soft shadows.
-   Interior daylight enters through windows.
-   Interior lights may be off by default.
-   Pool water should show blue highlights.

## 16.2 Sunset

-   Warm low-angle sunlight.
-   Sky gradient: peach, dusty rose, muted orange, and blue.
-   Longer shadows.
-   House timber should become warmer and more golden.
-   Interior lamps begin to appear warm.
-   Garden path lights may gradually turn on.

## 16.3 Night

-   Dark blue/navy sky, not a completely black background.
-   Moonlight provides soft cool ambient fill.
-   Exterior sconces: 2700 K.
-   Path lights: 2700 K.
-   Interior lights: 2700--3000 K.
-   Pool lights: subtle cool blue-white, not neon.
-   Window interiors should glow warmly.
-   Preserve enough visibility for safe navigation.
-   Avoid overexposed lamps and pitch-black corners.

## 16.4 Weather

Version 1 may include: - Clear day. - Light cloud. - Optional gentle
rain as a later enhancement.

If rain is added: - Rain particles should be thin, sparse, and
directional. - Add a subtle wet sheen to the path and terrace. - Do not
flood the garden or change the house structure. - Do not let rain appear
indoors.

------------------------------------------------------------------------

# 17. Furniture and prop material rules

Use physically based rendering (PBR) where possible.

  ------------------------------------------------------------------------
  Material                         Typical roughness Visual notes
  --------------------- ---------------------------- ---------------------
  Sandalwood-inspired                     0.55--0.75 Visible grain, warm
  timber                                             satin finish

  Walnut                                    0.5--0.7 Darker brown, subtle
                                                     grain

  Linen                                   0.85--0.95 Soft, woven, matte

  Velvet-like fabric                      0.65--0.85 Subtle directional
                                                     sheen

  Ceramic                                 0.25--0.45 Smooth glaze,
                                                     controlled highlights

  Brushed metal                            0.25--0.4 Fine directional
                                                     reflections

  Clear glass                             0.02--0.12 Subtle reflections
                                                     and transparency

  Natural stone                            0.55--0.8 Low-contrast texture

  Bathroom tile                            0.35--0.8 Matte or satin, not
                                                     slippery-looking

  Pool water                               0.05--0.2 Animated reflections
                                                     and ripples
  ------------------------------------------------------------------------

Do not use a single generic brown material for every wooden object.
Distinguish timber species and finishes through colour, grain scale,
roughness, and edge treatment.

------------------------------------------------------------------------

# 18. Camera, movement, and controls

## 18.1 Default camera

-   First-person view.
-   Eye height: 1.65 m for the male character and 1.56 m for the female
    character, or use a consistent camera height of 1.62 m for simpler
    gameplay.
-   Horizontal field of view: 75 degrees.
-   Near clipping plane: 0.05 m.
-   Far clipping plane: 150 m.
-   Mouse sensitivity: configurable.
-   Vertical look angle: clamp between -80 and +80 degrees.
-   Smooth camera interpolation without delayed response.

## 18.2 Controls

  Input             Action
  ----------------- --------------------------------------
  W / Up Arrow      Forward
  S / Down Arrow    Backward
  A / Left Arrow    Strafe left
  D / Right Arrow   Strafe right
  Mouse             Look around
  E                 Interact / open door / sit / inspect
  Space             Stand up when seated
  Shift             Faster movement
  Esc               Release pointer lock / pause
  C                 Optional first-/third-person toggle
  M                 Mute/unmute ambience

## 18.3 Movement values

-   Walk speed: 2.2 m/s.
-   Fast walk/run speed: 3.8 m/s.
-   Indoor speed may be limited to 2.0 m/s.
-   Acceleration time: 0.15--0.25 seconds.
-   Deceleration time: 0.12--0.2 seconds.
-   Player collider radius: 0.32 m.
-   Player height: 1.8 m.
-   No jumping required for the base experience.

## 18.4 Collision

-   Solid collision on exterior walls, floors, large furniture, pool
    edges, and trees.
-   Doors must have a usable open state.
-   Decorative small props do not need individual collision.
-   Prevent the user from passing through the house shell.
-   Do not let the camera clip through walls.
-   Add invisible collision boundaries where visual geometry is too
    detailed for direct collision.

------------------------------------------------------------------------

# 19. Interaction system

## 19.1 Interaction rules

-   Interaction range: 1.8 m for furniture/props.
-   Door interaction range: 2.0 m.
-   Shower control range: 1.5 m.
-   The target object should be selected using camera raycasting and
    distance.
-   Only one target is active at a time.
-   Show a contextual prompt near the lower centre of the screen.
-   Do not show prompts through walls.

## 19.2 Door interaction

-   Press E to open/close.
-   Door rotates around the correct hinge pivot.
-   Opening duration: 0.6--1.0 seconds.
-   Door angle: 85--100 degrees.
-   Use a soft wooden hinge sound.
-   Door must not collide with the player in a way that traps them.

## 19.3 Sit / stand

-   Interaction prompt: "E --- Sit".
-   Align player to the seat anchor.
-   Seated camera height: approximately 1.15 m.
-   Disable movement while seated.
-   Allow mouse look if desired.
-   Press E or Space to stand.
-   Restore the correct player position and camera height.
-   Support the main sofa, at least two accent chairs, and one balcony
    chair.

## 19.4 Inspection

Inspectable objects include: - TV remote. - Flower vase. - Teapot. -
Showcase. - Kitchen utensil group. - Refrigerator. - Washing machine. -
Dryer. - Bedside lamp. - Bathroom tap and shower control. - Pool.

Inspection may use a close-up panel, a small object highlight, or a
short text label. Avoid a full-screen interruption for every object.

## 19.5 Gamified discovery

Required discoveries: 1. Flower garden. 2. Front porch. 3. Living hall.
4. Kitchen. 5. Dining/family hall. 6. Bedroom 1. 7. Bathroom 1. 8.
Bedroom 2. 9. Bathroom 2. 10. Laundry room. 11. Pool terrace. 12.
Balcony.

Display a subtle exploration tracker. Completing all 12 discoveries
should show a calm "Estate explored" completion state.

------------------------------------------------------------------------

# 20. User interface

## 20.1 Start screen

-   Full-screen rendered garden background.
-   Title: "Sandalwood Garden Estate".
-   Subtitle: "A quiet place to explore."
-   Buttons: Start Exploring, Choose Character, Controls, Settings.
-   Keep typography elegant and readable.
-   UI colours: ivory, warm walnut, muted gold.
-   Avoid bright arcade-style UI.

## 20.2 HUD

-   Small interaction prompt.
-   Minimal room/location label when entering a new room.
-   Exploration progress indicator.
-   Pause/settings button.
-   Mute button.
-   Hide HUD option.

## 20.3 Settings

Include: - Graphics: Low / Medium / High. - Mouse sensitivity. - Invert
vertical look toggle. - Ambient audio volume. - Mute audio. - Day /
Sunset / Night selection. - Reset experience. - Controls reference.

------------------------------------------------------------------------

# 21. Sound design

  Sound                 Behaviour
  --------------------- ---------------------------------
  Garden ambience       Soft birds and breeze
  Footsteps on grass    Soft muted steps
  Footsteps on stone    Slightly harder, dry steps
  Footsteps on timber   Warm hollow wood steps
  Footsteps on tile     Light indoor hard-surface steps
  Door                  Soft wooden opening/closing
  Interaction           Quiet confirmation sound
  Shower                Soft continuous water spray
  Pool ambience         Optional subtle water movement

-   Audio starts only after user interaction.
-   Provide a mute control.
-   Avoid loud music and repetitive sound loops.
-   Use properly licensed or original audio.

------------------------------------------------------------------------

# 22. Technical architecture

## 22.1 Recommended stack

-   React + TypeScript + Vite.
-   Three.js.
-   React Three Fiber.
-   Drei for common 3D helpers.
-   Zustand or equivalent lightweight state management.
-   Tailwind CSS for interface styling.
-   GLTF/GLB for imported 3D assets.
-   KTX2/Basis textures where supported.
-   Static deployment to Vercel or Netlify.

If an existing repository already uses a suitable stack, preserve it
rather than rebuilding without reason.

## 22.2 Scene modules

``` text
src/
  app/
    App.tsx
    Experience.tsx
  ui/
    StartScreen.tsx
    CharacterSelector.tsx
    ControlsPanel.tsx
    SettingsPanel.tsx
    InteractionPrompt.tsx
    ExplorationHUD.tsx
    PauseMenu.tsx
  world/
    Garden.tsx
    FlowerBeds.tsx
    Trees.tsx
    Pathway.tsx
    HouseExterior.tsx
    PoolTerrace.tsx
    LightingRig.tsx
    DayNightController.tsx
  house/
    GroundFloor.tsx
    UpperFloor.tsx
    LivingHall.tsx
    Kitchen.tsx
    DiningHall.tsx
    BedroomOne.tsx
    BathroomOne.tsx
    BedroomTwo.tsx
    BathroomTwo.tsx
    LaundryRoom.tsx
    Balcony.tsx
  characters/
    CharacterSelector.tsx
    MaleCharacter.tsx
    FemaleCharacter.tsx
    CharacterAnimations.ts
  gameplay/
    PlayerController.ts
    CameraController.ts
    CollisionSystem.ts
    InteractionManager.ts
    DoorController.ts
    SeatingController.ts
    InspectionController.ts
    ExplorationProgress.ts
  assets/
    models/
    textures/
    audio/
  state/
    gameStore.ts
  styles/
```

## 22.3 Asset policy

-   Use original procedural models or properly licensed assets.
-   Do not use copyrighted game assets without permission.
-   Keep a small asset manifest recording each imported model, texture,
    and audio file with its source/licence.
-   Optimise imported models before use.
-   Use consistent scale and pivot points.
-   Apply real-world dimensions to imported models.
-   Replace missing assets with coherent procedural placeholders.

## 22.4 Procedural versus imported assets

Good candidates for procedural generation: - Flower varieties and flower
beds. - Path stones. - Simple furniture. - Cabinetry. - Doors and
windows. - Pool water surface. - Basic utensils and vessels. - Lighting
fixtures.

Good candidates for licensed detailed models: - Human character models
and rigs. - High-quality upholstered sofa. - Detailed kitchen
appliances. - Detailed bathroom fixtures. - High-quality foliage, if
procedural quality is insufficient.

Do not import a large asset pack without checking scale, style, file
size, and licence.

------------------------------------------------------------------------

# 23. Performance and quality settings

## 23.1 Target

-   Target 60 FPS on a capable desktop.
-   Maintain at least 30 FPS on a mid-range desktop at Low settings.
-   Initial load should display a progress state.
-   Avoid blocking the browser main thread with large synchronous asset
    operations.

## 23.2 Quality profiles

  Setting             Low           Medium              High
  ------------------- ------------- ------------------- --------------------------
  Shadow map          1024          2048                4096
  Flower density      50%           75%                 100%
  Grass density       25%           55%                 100%
  Reflections         Minimal       Selected surfaces   Selected surfaces + pool
  Ambient occlusion   Off/low       Medium              High
  Post-processing     Off           Light               Light
  Render scale        0.8--0.9      1.0                 1.0
  Foliage sway        Off/reduced   Reduced             Full

## 23.3 Optimisation requirements

-   Instance repeated flowers, grass, and small props.
-   Use LOD for distant trees and furniture.
-   Use texture atlases for repeated small assets.
-   Compress textures and models.
-   Avoid unnecessary real-time lights.
-   Bake static lighting where suitable.
-   Use simple collision geometry.
-   Avoid real-time physics for every decorative object.
-   Avoid a full fluid simulation for pool or shower water.
-   Provide a loading screen with asset progress.

------------------------------------------------------------------------

# 24. Development workflow

## Phase 1 --- Repository audit and measured blockout

1.  Inspect the existing repository and framework.
2.  Record current files and scripts.
3.  Create a room/asset checklist from this PRD.
4.  Establish the 1 unit = 1 metre scale.
5.  Build the garden, pathway, house footprint, floors, walls, doors,
    windows, and room blockout.
6.  Confirm the front façade orientation.
7.  Confirm every required room connection.

**Exit gate:** The user can walk from the start point through the main
entrance and visit every room without collision or layout errors.

## Phase 2 --- Player and interactions

1.  Implement keyboard movement.
2.  Implement mouse look and pointer lock.
3.  Implement collision.
4.  Implement door opening.
5.  Implement sit/stand.
6.  Implement object inspection.
7.  Implement room discovery.

**Exit gate:** All required controls and interactions work with
placeholder assets.

## Phase 3 --- Exterior art

1.  Add garden terrain and grass.
2.  Add flower varieties and measured flower beds.
3.  Add trees, shrubs, benches, and path lights.
4.  Build the timber façade, porch, roof, windows, and balconies.
5.  Add the pool and terrace.

**Exit gate:** The garden and house exterior match the visual
specification and are navigable.

## Phase 4 --- Interior art

1.  Finish living hall furniture and props.
2.  Finish kitchen, appliances, utensils, and vessels.
3.  Finish dining hall.
4.  Finish both bedrooms.
5.  Finish both bathrooms and shower effects.
6.  Finish laundry room and dryer.
7.  Add lighting and materials.

**Exit gate:** Every room is furnished, coherent, and visually polished.

## Phase 5 --- Characters, ambience, and time of day

1.  Add male and female character models.
2.  Add selection and idle animations.
3.  Add day, sunset, and night lighting.
4.  Add ambience and footsteps.
5.  Add pool and foliage animation.

**Exit gate:** The complete estate feels alive and atmospheric.

## Phase 6 --- Optimisation and QA

1.  Test all room connections and collisions.
2.  Test all interaction prompts.
3.  Test all quality settings.
4.  Check model scale, clipping, floating objects, and material
    consistency.
5.  Check browser console and build output.
6.  Deploy and provide run instructions.

------------------------------------------------------------------------

# 25. Acceptance checklist

The development agent must report each item as **Pass**, **Fail**, or
**Not implemented**. Do not mark an item complete based on appearance
alone; test it.

## 25.1 Garden and flowers

-   [ ] Garden is 80 × 70 m or a documented equivalent.
-   [ ] Main path is 2.4 m wide.
-   [ ] 12 principal flower beds are present.
-   [ ] At least 7 flower varieties are visible.
-   [ ] Flower sizes, petal dimensions, colours, stems, and leaves
    follow the flower table.
-   [ ] Flower plants are not floating or clipping into the ground.
-   [ ] Garden includes trees, shrubs, benches, and path lights.
-   [ ] Flower sway is subtle and performance-adjustable.

## 25.2 Characters

-   [ ] Male and female characters are both visible at the start.
-   [ ] Male character is approximately 1.78 m tall.
-   [ ] Female character is approximately 1.66 m tall.
-   [ ] Skin, hair, clothing, and proportions match this PRD.
-   [ ] User can select one character.
-   [ ] Companion does not block the path.
-   [ ] Idle and walking animations are functional.

## 25.3 House exterior

-   [ ] Main footprint is approximately 24 × 18 m.
-   [ ] Main exterior reads as timber, not brick.
-   [ ] Front window is on the left.
-   [ ] Main door is on the right.
-   [ ] Main entrance aligns with the garden path.
-   [ ] House has 12 windows total.
-   [ ] House has the specified exterior and interior doors.
-   [ ] House includes two balconies.
-   [ ] Porch, roof, timber grain, and exterior lighting are present.

## 25.4 Interior layout

-   [ ] Entrance opens into the foyer/living hall sequence.
-   [ ] Living hall contains a large TV facing the sofa.
-   [ ] Kitchen is to the left when entering the main hall.
-   [ ] Secondary dining/family hall is beyond the kitchen.
-   [ ] Two separate bedrooms exist.
-   [ ] Each bedroom has its own attached bathroom.
-   [ ] Laundry room contains both washer and dryer.
-   [ ] All rooms are reachable and furnished.

## 25.5 Objects and details

-   [ ] Sofa dimensions, upholstery, cushions, and legs are modelled.
-   [ ] Coffee table/teapoy is present with intentional props.
-   [ ] TV, console, soundbar, and remote are present.
-   [ ] Flower vase has stems and flowers correctly placed.
-   [ ] Showcase has glass, shelves, internal lighting, and curated
    contents.
-   [ ] Kitchen has the specified appliances, utensils, vessels, and
    cutlery.
-   [ ] Bedrooms have beds, layered bedding, bedside tables, wardrobes,
    and lights.
-   [ ] Bathrooms have toilet, basin, mirror, tap, shower, glass
    partition, and accessories.
-   [ ] Shower water starts and stops through interaction.
-   [ ] Pool has blue water, visible depth, and subtle ripples.

## 25.6 Gameplay and presentation

-   [ ] WASD and arrow keys work.
-   [ ] Mouse camera works.
-   [ ] Escape releases pointer lock.
-   [ ] E interacts with doors and selected objects.
-   [ ] E allows sitting; E or Space allows standing.
-   [ ] Interaction prompts appear only within range and line of sight.
-   [ ] Day, sunset, and night states work.
-   [ ] Audio can be muted.
-   [ ] Low, Medium, and High quality settings work.
-   [ ] No major collision, clipping, floating, or navigation defects
    remain.

------------------------------------------------------------------------

# 26. Required agent handover

At the end of implementation, the agent must provide:

1.  A concise summary of the completed experience.
2.  A list of files created and modified.
3.  A list of assets used and their licences/sources.
4.  Exact local run commands.
5.  Deployment instructions and deployed URL, if deployment was
    requested and completed.
6.  A control guide.
7.  A test report mapped to Section 25.
8.  A list of incomplete requirements and why they remain incomplete.
9.  Performance results on the tested device/browser, if available.
10. Screenshots or short recordings of the garden, façade, living hall,
    kitchen, bedrooms, bathrooms, laundry, and pool.

------------------------------------------------------------------------

# 27. Non-negotiable implementation rules

-   Do not silently remove rooms, furniture, characters, appliances, or
    interactions listed in this PRD.
-   Do not reverse the front window and main door.
-   Do not make the house look like a brick building.
-   Do not create a beautiful exterior with an empty or incomplete
    interior.
-   Do not use random object placement for premium rooms.
-   Do not create decorative objects at incorrect scale.
-   Do not make the shower or pool water look like solid blue plastic.
-   Do not use bright neon lighting for a quiet luxury environment.
-   Do not claim that an interaction works unless it has been tested.
-   Do not spend the entire development cycle polishing one room before
    the whole route is playable.
-   If a requirement is technically expensive, implement a visually
    convincing lightweight version and document the compromise.
-   If a measurement must change because of a genuine architectural
    conflict, explain the reason and update every dependent measurement
    consistently.

**Final quality standard:** The finished website should feel like a
small, premium architectural exploration game: a colourful garden, two
welcoming characters, a carefully proportioned timber estate, a warm and
fully furnished home, believable bathroom and kitchen details, a laundry
room, balconies, and a calm blue swimming pool --- all explorable with
intuitive keyboard and mouse controls.
