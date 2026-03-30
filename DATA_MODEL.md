# Film Dev Guidance — Data Model

## Overview

Recipes decouple two independent concerns:

1. **Mixing Guide** (`baths[]`) — How to prepare chemical solutions. Each bath describes which raw/concentrate chemicals to mix and the steps required.
2. **Develop Session** (`develop_steps[]`) — Timer and agitation steps during actual film development. Develop steps reference baths they use, but many steps (rinse, wash, dry) have no bath.

This separation is intentional: a recipe can have develop steps that don't require mixing (e.g., water rinse, final wash), and a bath can exist in the Mixing Guide without appearing in the timer steps (for convenience or future use).

---

## ChemicalFormat Type

Describes how a bath's chemicals are prepared. Each format has different field requirements:

### `raw_powder`
Raw chemicals mixed from scratch. User buys individual powders and combines them.

**Requires:** `chemicals[]` (list of powders) and `mixing_steps[]` (instructions)
**Note:** `chemicals` and `mixing_steps` are optional fields on Bath (TypeScript `?`) — but for `raw_powder` and `diy` they must be present. Omitting them on these formats is a data error.

**Examples:**
- Divided D-23 Bath A (Sodium Sulphite + Metol)
- Divided D-23 Stop Bath (Potassium Metabisulphite)
- D-76 (Metol + Sodium Sulphite + Hydroquinone + Borax)

---

### `powder_concentrate`
A single powder packet (sacheted) dissolved in water. Common in region-specific formulations.

**Requires:** `mixing_steps[]` (dilution instructions), `chemicals[]` is a single-item array

**Examples:**
- XTOL sachet (user buys sealed packet, dissolve in water)
- Rodinal powder packets

---

### `liquid_concentrate`
Pre-mixed liquid that's diluted with water before use. Sold as concentrate in bottles.

**Requires:** `dilution_ratio` (e.g., "1:31"), `mixing_steps[]` (dilution instructions), `chemicals[]` is a single item representing the concentrate
**Note:** `dilution_ratio` is stored on Bath directly (not inside chemicals). See `recipe.ts` Bath type.

**Examples:**
- HC-110 (Kodak liquid concentrate, diluted 1:31 or 1:15)
- Rodinal liquid (diluted with water)
- ILFOSOL 3
- Ilford Rapid Fixer
- Ilfostop stop bath

---

### `ready_to_use`
Pour and use as-is. No mixing or dilution required.

**Requires:** `mixing_required: false`, no `chemicals[]` or `mixing_steps[]` needed

**Examples:**
- CineStill DF96 monobath
- Plain distilled water (for stop bath or rinse)
- Pre-mixed stop bath or fixer solutions (rare)

---

### `diy`
Household chemicals or improvised formulas. Treated like `raw_powder` from a data perspective, but tagged `diy` for UI clarity.

**Requires:** `chemicals[]` and `mixing_steps[]` (same as raw_powder)

**Examples:**
- Caffenol (coffee + washing soda + vitamin C)
- Vinegar stop bath (diluted white vinegar)

---

## Bath.role

Describes the functional purpose of the bath during develop session:

- **`developer`** — Develops the latent image (Divided D-23 Bath A, D-76, HC-110 working solution)
- **`stop`** — Halts development (stop bath, acetic acid, or plain water)
- **`fixer`** — Dissolves unexposed silver halide (hypo-based or rapid fixer)
- **`wash_aid`** — Speeds up fixing removal (sodium thiosulfate or chelating agents) — optional step in develop_steps
- **`wetting_agent`** — Final rinse additive to prevent water spotting (Photo-Flo, Ilford Ilfospeed) — optional step in develop_steps

---

## mixing_required Field

A **derived boolean** on Bath. NOT user-editable when building forms.

- `true` if `chemical_format` is `raw_powder`, `powder_concentrate`, or `liquid_concentrate`
- `false` if `chemical_format` is `ready_to_use`
- `diy` → true (requires mixing)

**UI Usage:** The Selection Screen filters `recipe.baths` to only show baths where `mixing_required === true`. Ready-to-use chemicals are skipped in the Mixing Guide entirely.

---

## DevelopStep Changes

### `bath_ref?: string`
Links a DevelopStep to a Bath by `id`. Used by the "add recipe" form to indicate which chemical is used at each step.

**Set for:** developer, activator, stop, fixer steps (steps that use a chemical)

**Omit for:** rinse, wash, dry steps (no chemical needed)

**Example:**
```json
{
  "id": "bath-a-dev",
  "type": "developer",
  "bath_ref": "bath-a"
}
```

### `optional?: boolean`
Marks a step as skippable. Typically used for `wash_aid` and `wetting_agent` steps.

**Example:** A recipe might include a wash_aid step, but some users may substitute it with a longer water wash instead.

### `optional_note?: string`
Text explaining how to handle skipping this step. Shown to user before session starts if the step is optional.

**Example:** `"Replace with 10-minute running water wash if wash_aid is unavailable"`

---

## Form UI Guide (for Future Developer)

When building the "Add Recipe" form, follow these patterns:

### Bath Creation Flow

1. **User picks `chemical_format`** for the bath
2. **Form conditionally renders fields:**

   - **`raw_powder`** or **`diy`**
     - `name` (e.g., "Bath A — Developer")
     - `role` (dropdown: developer, stop, fixer, wash_aid, wetting_agent)
     - `chemicals` list:
       - For each chemical: `name`, `amount_per_liter`, `unit` (g|ml), `order` (sequence), `note` (optional)
     - `mixing_steps` list:
       - For each step: `instruction`, `warning` (optional)
     - `storage` (optional): shelf_life, container, notes

   - **`powder_concentrate`**
     - `name`
     - `role`
     - `chemicals` (single-item input: name, amount_per_liter, unit)
     - `mixing_steps` (dilution instructions)
     - `storage`

   - **`liquid_concentrate`**
     - `name`
     - `role`
     - `dilution_ratio` (text field, e.g., "1:31")
     - `chemicals` (single-item: concentrate name, amount_per_liter, unit)
     - `mixing_steps` (dilution instructions, simplified)
     - `storage`

   - **`ready_to_use`**
     - `name`
     - `role`
     - `storage` (optional)
     - **Hide:** chemicals, mixing_steps, dilution_ratio

3. **`mixing_required`** is auto-derived from `chemical_format` (not shown to user)

### DevelopStep Creation Flow

- User selects step type (developer, activator, rinse, stop, fixer, wash, dry)
- **If step type has a chemical equivalent** (developer, stop, fixer, wash_aid, wetting_agent):
  - Show dropdown `bath_ref`: filtered list of baths with matching `role`
  - If step is `wash_aid` or `wetting_agent`: show `optional` checkbox + `optional_note` text field
- **If step type is rinse/wash/dry:**
  - Omit `bath_ref`
  - Omit optional fields

---

## Template Variables (Known Limitation)

Mixing step instructions currently use **hardcoded template variables** like:
- `{volume_75pct}` → 75% of target volume
- `{sodium_sulphite}` → scaled amount of Sodium Sulphite
- `{hc110_concentrate}` → scaled HC-110 volume
- etc.

These are resolved at **render time** in `MixChecklistPage.tsx` via the `resolveInstruction()` function.

### For User-Generated Recipes

When building forms that allow users to create recipes, **do not use template variables** in `mixing_steps[].instruction`. Instead:

1. **Use plain text** with specific amounts (form pre-calculates based on base_volume_ml)
2. Or implement **auto-generation** from the `chemicals[]` list (not yet built)

This is a known limitation that should be addressed when the form is built.

---

## Examples

### Example 1: raw_powder — Divided D-23 Bath A

```json
{
  "id": "bath-a",
  "name": "Bath A — Developer",
  "role": "developer",
  "chemical_format": "raw_powder",
  "mixing_required": true,
  "chemicals": [
    {
      "name": "Sodium Sulphite",
      "amount_per_liter": 100,
      "unit": "g",
      "order": 1,
      "note": "Dissolve first before Metol to prevent oxidation"
    },
    {
      "name": "Metol",
      "amount_per_liter": 7.5,
      "unit": "g",
      "order": 2,
      "note": "Add after Sodium Sulphite — never reverse order"
    }
  ],
  "mixing_steps": [
    {
      "instruction": "Add {volume_75pct} ml distilled water at room temperature (~25°C)"
    },
    {
      "instruction": "Add {sodium_sulphite} g Sodium Sulphite, stir until fully dissolved",
      "warning": "Sodium Sulphite must dissolve completely before adding Metol"
    },
    {
      "instruction": "Add {metol} g Metol, stir until fully dissolved"
    },
    {
      "instruction": "Top up with distilled water to {target_volume} ml"
    }
  ],
  "storage": {
    "shelf_life": "6–12 months",
    "container": "amber bottle, sealed, keep cool",
    "notes": "Store in cool, dark place. Avoid light and heat."
  }
}
```

### Example 2: liquid_concentrate — HC-110

```json
{
  "id": "hc110-working",
  "name": "HC-110 Working Solution (Dil. B)",
  "role": "developer",
  "chemical_format": "liquid_concentrate",
  "mixing_required": true,
  "dilution_ratio": "1:31",
  "chemicals": [
    {
      "name": "HC-110 Concentrate",
      "amount_per_liter": 32,
      "unit": "ml",
      "order": 1,
      "note": "Measure precisely — HC-110 is very viscous; 1–2 ml difference affects development"
    }
  ],
  "mixing_steps": [
    {
      "instruction": "Measure {hc110_concentrate} ml HC-110 Concentrate using a syringe or graduated cylinder",
      "warning": "HC-110 is very thick like syrup — let it drip completely, don't pour quickly"
    },
    {
      "instruction": "Pour water at desired temperature into container first ({hc110_water} ml)"
    },
    {
      "instruction": "Add HC-110 Concentrate to water and stir gently until combined — ready to use immediately",
      "warning": "Use immediately — HC-110 working solution does not keep overnight"
    }
  ],
  "storage": {
    "shelf_life": "Concentrate: indefinite (unopened) · 6 months (opened, full bottle) · 2 months (opened, half-full)",
    "container": "Original Kodak plastic bottle, tightly sealed",
    "notes": "Store concentrate for years. Working solution must be discarded after use."
  }
}
```

### Example 3: ready_to_use — Water Stop

```json
{
  "id": "water-stop",
  "name": "Plain Water Stop",
  "role": "stop",
  "chemical_format": "ready_to_use",
  "mixing_required": false,
  "storage": {
    "shelf_life": "N/A",
    "container": "tap water",
    "notes": "Use fresh water at development temperature"
  }
}
```

---

## Recipe-level Fields

### `references?: string[]`
Array of source URLs for the recipe. Displayed as domain-only links in the UI.

**Example:**
```json
"references": [
  "https://www.digitaltruth.com/devchart.php",
  "https://filmdev.org/recipe/show/4850"
]
```

---

## Related Files

- **Type definitions:** `frontend/src/types/recipe.ts`
- **Recipe data:** `frontend/src/data/divided-d23.ts`, `frontend/src/data/hc110.ts`, `frontend/src/data/d76.ts`
- **Mixing UI:** `frontend/src/pages/mixing/SelectionScreenPage.tsx`, `ShoppingListPage.tsx`, `MixChecklistPage.tsx`
- **Mixing state:** `frontend/src/store/mixingStore.ts`
