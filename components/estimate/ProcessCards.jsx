// components/estimate/ProcessCards.jsx

function PaintingProcessCard() {
  return (
    <div className="card processCard paintingProcessCard">
      <header className="processHeader">
        <div className="processTitleBlock">
          <h3>Interior Painting – 15-Step Process</h3>
          <p className="processTagline">
            Clean, dust-controlled repainting with smooth walls, sharp lines and
            careful protection of your home.
          </p>
        </div>
        <div className="processBadge">
          <span className="processBadgeIcon">🎨</span>
          <span className="processBadgeText">Interior Painting</span>
        </div>
      </header>

      <ol className="processList">
        <li className="processStep" data-step-icon="📝">
          <strong>Step 1. Site visit / estimate</strong>
          <ul>
            <li>Measure rooms, note ceiling height and access.</li>
            <li>
              Check wall and ceiling condition (cracks, nail pops, repairs,
              stains).
            </li>
            <li>
              Note doors, trim, windows, closets, cabinets, and any special
              items.
            </li>
            <li>Discuss colours, finishes, and client expectations.</li>
            <li>Explain what’s included (prep, number of coats, cleanup).</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🎨">
          <strong>Step 2. Colour &amp; product selection</strong>
          <ul>
            <li>
              Confirm brand and line of paint (e.g., washable for kids’ rooms,
              moisture-resistant for bathrooms).
            </li>
            <li>
              Confirm gloss level: flat/matte for ceilings, eggshell for walls,
              semi-gloss for trim/doors.
            </li>
            <li>
              Confirm colours and where each colour will go (walls, ceilings,
              trim, accent walls).
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="📅">
          <strong>Step 3. Scheduling &amp; pre-job client prep</strong>
          <ul>
            <li>Set start date, rough duration, and working hours.</li>
            <li>
              Ask client to remove small items, pictures, valuables, and clear
              access where possible.
            </li>
            <li>
              Confirm parking, building rules (for condos), and where tools can
              be staged.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🛡️">
          <strong>Step 4. Protection &amp; masking</strong>
          <ul>
            <li>Cover floors with drop sheets / floor paper.</li>
            <li>Cover furniture and cabinets with plastic or clean sheets.</li>
            <li>
              Remove or tape around cover plates, vents, and fixtures as needed.
            </li>
            <li>
              Mask baseboards, window/door frames, and any surfaces not being
              painted.
            </li>
            <li>Set up ladders, planks, or scaffold safely.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧼">
          <strong>Step 5. Surface cleaning &amp; basic prep</strong>
          <ul>
            <li>Wipe greasy areas (kitchen, hand-prints around switches).</li>
            <li>Scrape loose or peeling paint.</li>
            <li>
              Sand rough patches, ridges, and roller lines from old paint.
            </li>
            <li>Vacuum or wipe dust before filling.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧱">
          <strong>Step 6. Repairs: holes, cracks, joints</strong>
          <ul>
            <li>
              Fill nail holes, screw pops, and small dents with joint compound
              or filler.
            </li>
            <li>Repair cracks, corner beads, and damaged drywall.</li>
            <li>
              Skim coat rough or patched areas so they blend into the wall.
            </li>
            <li>
              For bigger damage: tape joints, apply multiple coats of compound
              with sanding between coats.
            </li>
            <li>Let everything dry fully.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🌬️">
          <strong>Step 7. Sanding &amp; dust control</strong>
          <ul>
            <li>Sand patched areas smooth and feather edges.</li>
            <li>Lightly sand glossy surfaces to improve adhesion.</li>
            <li>Vacuum or wipe walls and ceilings to remove dust.</li>
            <li>
              Keep dust controlled (HEPA sanding, plastic, daily cleanup).
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧴">
          <strong>Step 8. Priming (where needed)</strong>
          <ul>
            <li>Prime new drywall, fresh patches, stains, and bare areas.</li>
            <li>
              Use stain-blocking primer for water marks, smoke, or heavy
              colours.
            </li>
            <li>
              For big colour changes, prime entire walls/ceilings for even
              coverage.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="☁️">
          <strong>Step 9. Ceilings painting</strong>
          <ul>
            <li>Cut in ceiling edges where they meet walls.</li>
            <li>
              Roll ceilings in straight, overlapping passes to avoid lap marks.
            </li>
            <li>
              Apply one or two coats depending on coverage and colour change.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧰">
          <strong>Step 10. Walls painting</strong>
          <ul>
            <li>
              Cut in walls at ceiling lines, corners, and around trim (clean,
              straight lines).
            </li>
            <li>
              Roll walls in sections, keeping a wet edge to avoid flashing.
            </li>
            <li>
              Apply at least two finish coats for even colour and durability.
            </li>
            <li>
              Check walls from different angles for misses, drips, and roller
              marks.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🚪">
          <strong>Step 11. Trim, doors &amp; details</strong>
          <ul>
            <li>Caulk gaps between trim and walls where needed.</li>
            <li>Prime any bare wood or factory-finished doors if required.</li>
            <li>
              Paint baseboards, casings, windows, and doors with suitable trim
              enamel.
            </li>
            <li>
              Do second coats after proper drying for a smooth finish without
              runs.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🔍">
          <strong>Step 12. Final touch-ups &amp; inspection</strong>
          <ul>
            <li>Check all surfaces in natural and artificial light.</li>
            <li>
              Fix any misses, pinholes, visible roller lines, or rough spots.
            </li>
            <li>
              Clean up lines between wall and ceiling, and between wall and
              trim.
            </li>
            <li>Remove tape carefully to keep edges sharp.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧹">
          <strong>Step 13. Cleanup &amp; re-set</strong>
          <ul>
            <li>Remove plastic, floor protection, and tape.</li>
            <li>Reinstall cover plates, vents, and hardware.</li>
            <li>Sweep, vacuum, and wipe floors where needed.</li>
            <li>Put furniture back where it was (if agreed).</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🤝">
          <strong>Step 14. Walk-through with client</strong>
          <ul>
            <li>Walk room by room with the client.</li>
            <li>Mark any areas they want touched up and fix them.</li>
            <li>
              Explain what was done, number of coats, and any special products
              used.
            </li>
            <li>Review payment, warranty, and care instructions.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="💡">
          <strong>Step 15. After-care instructions</strong>
          <ul>
            <li>
              Explain drying vs curing time (paint can be dry to touch but not
              fully hardened).
            </li>
            <li>
              Advise when they can wash walls (usually after a few weeks).
            </li>
            <li>Recommend gentle cleaners and soft cloths.</li>
            <li>
              Remind them to avoid tape on fresh paint to prevent peeling.
            </li>
          </ul>
        </li>
      </ol>
    </div>
  );
}

function PopcornProcessCard() {
  return (
    <div className="card processCard popcornProcessCard">
      <header className="processHeader">
        <div className="processTitleBlock">
          <h3>Popcorn Ceiling Removal – Step-by-Step Process</h3>
          <p className="processTagline">
            Dust-controlled popcorn removal with Level 5 smooth ceilings, ready
            for fresh paint and modern lighting.
          </p>
        </div>
        <div className="processBadge processBadgePopcorn">
          <span className="processBadgeIcon">☁️</span>
          <span className="processBadgeText">Popcorn Removal</span>
        </div>
      </header>

      <ol className="processList">
        <li className="processStep" data-step-icon="📝">
          <strong>Step 1. Site visit &amp; assessment</strong>
          <ul>
            <li>Measure ceiling square footage, ceiling height, and access.</li>
            <li>
              Check existing texture (painted / unpainted), cracks, repairs, and
              previous leaks.
            </li>
            <li>
              Discuss rooms involved, furniture, and any scheduling constraints.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="⚠️">
          <strong>Step 2. Safety check</strong>
          <ul>
            <li>
              Confirm that ceilings are suitable for removal (no suspected
              asbestos).
            </li>
            <li>
              If there is any doubt, recommend third-party lab testing before
              work starts.
            </li>
            <li>
              Review electrical fixtures, pot lights, and smoke detectors for
              safe access.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🛡️">
          <strong>Step 3. Protection &amp; masking</strong>
          <ul>
            <li>Cover floors with RamBoard / drop sheets and tape seams.</li>
            <li>Wrap furniture, cabinets, and rails with plastic.</li>
            <li>
              Mask walls (as needed), vents, and openings to control dust.
            </li>
            <li>
              Set up plastic “doors” to separate work areas from the rest of the
              home.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🪜">
          <strong>Step 4. Setup &amp; access</strong>
          <ul>
            <li>
              Set up ladders, planks, or scaffold for high ceilings and
              stairwells.
            </li>
            <li>
              Lay out tools, lighting, and HEPA vacuums in a safe, organized
              way.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="💧">
          <strong>Step 5. Wetting &amp; softening the texture</strong>
          <ul>
            <li>
              Lightly wet the popcorn with a controlled sprayer to soften it
              without soaking drywall.
            </li>
            <li>Work in small sections so the ceiling never stays over-wet.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🔧">
          <strong>Step 6. Popcorn removal</strong>
          <ul>
            <li>
              Scrape texture down to the drywall surface, protecting joints and
              tape.
            </li>
            <li>Bag and contain debris as we go to keep the site tidy.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧱">
          <strong>Step 7. First skim coat</strong>
          <ul>
            <li>
              Apply a tight skim coat over the entire ceiling to fill scraper
              marks and small defects.
            </li>
            <li>Rebuild joints, corners, and any previous repair areas.</li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧱">
          <strong>Step 8. Additional skim coats / Level 5 finish</strong>
          <ul>
            <li>
              Apply one or more additional skim coats for a true Level 5 smooth
              finish.
            </li>
            <li>
              Feather out low spots and flatten waves so the ceiling looks even
              from all angles.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🌬️">
          <strong>Step 9. Sanding &amp; quality check</strong>
          <ul>
            <li>
              Sand ceilings with HEPA dust-extraction tools to keep dust under
              control.
            </li>
            <li>
              Use raking light to highlight imperfections and touch up as
              needed.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧴">
          <strong>Step 10. Priming</strong>
          <ul>
            <li>
              Prime ceilings with a suitable high-build or drywall primer.
            </li>
            <li>
              Spot-check after primer for any last minor defects and correct
              them.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="☁️">
          <strong>Step 11. Finish ceiling painting</strong>
          <ul>
            <li>Cut in at walls and around fixtures for clean lines.</li>
            <li>
              Roll ceilings in even passes, maintaining a wet edge to avoid lap
              marks.
            </li>
            <li>
              Apply one or two finish coats depending on colour and coverage.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🧹">
          <strong>Step 12. Cleanup &amp; debris removal</strong>
          <ul>
            <li>Remove plastic, floor protection, and tape.</li>
            <li>Bag and remove popcorn debris from site.</li>
            <li>
              HEPA vacuum floors and surfaces, and wipe down where needed.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="🔍">
          <strong>Step 13. Final inspection &amp; client walk-through</strong>
          <ul>
            <li>Inspect ceilings under natural and artificial light.</li>
            <li>
              Walk with the client, mark any touch-ups they see, and complete
              them.
            </li>
          </ul>
        </li>

        <li className="processStep" data-step-icon="💬">
          <strong>Step 14. After-care &amp; warranty</strong>
          <ul>
            <li>
              Explain drying/curing time and when ceilings can be repainted in
              the future.
            </li>
            <li>Remind client to avoid tape or stickers on fresh paint.</li>
            <li>
              Review warranty coverage and how to reach us if anything needs
              attention.
            </li>
          </ul>
        </li>
      </ol>
    </div>
  );
}

export default function EstimateProcessBlock() {
  return (
    <div className="block processLayout">
      <PaintingProcessCard />
      <PopcornProcessCard />
    </div>
  );
}
