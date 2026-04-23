import type { KitGuide } from '@/types/kit'

export const SYSTEM_KIT_GUIDES: KitGuide[] = [
  {
    id: 'guide-classic-kodak-d76',
    name: 'Classic Kodak D-76 Kit',
    description: 'The industry standard general-purpose kit. Fine grain, full emulsion speed, and normal contrast.',
    slots: [
      { slot_type: 'developer', recipe_id: 'd76-stock' },
      { slot_type: 'stop', recipe_id: 'citric-acid-stop-1pct' },
      { slot_type: 'fixer', recipe_id: 'kodak-f5-hardening-fixer' },
      { slot_type: 'wash_aid', recipe_id: 'hypo-clear-simple' },
      { slot_type: 'wetting_agent', recipe_id: 'kodak-photo-flo-200' },
    ],
  },
  {
    id: 'guide-sharp-rodinal',
    name: 'High Acutance Rodinal Kit',
    description: 'Classic high-acutance setup. Very sharp grain and high micro-contrast. Uses water stop to prevent pinholes.',
    slots: [
      { slot_type: 'developer', recipe_id: 'rodinal-1-50' },
      { slot_type: 'stop', recipe_id: 'water-stop' },
      { slot_type: 'fixer', recipe_id: 'ilford-rapid-fixer-1-4' },
      { slot_type: 'wetting_agent', recipe_id: 'kodak-photo-flo-200' },
    ],
  },
  {
    id: 'guide-compensating-divided-d76',
    name: 'Divided D-76 2-Bath Kit',
    description: 'Advanced compensating development for high contrast scenes. Preserves highlights while pushing shadows.',
    slots: [
      { slot_type: 'developer', developer_slot_role: 'bath_a', recipe_id: 'divided-d76' },
      { slot_type: 'developer', developer_slot_role: 'bath_b', recipe_id: 'divided-d76' },
      { slot_type: 'stop', recipe_id: 'water-stop' },
      { slot_type: 'fixer', recipe_id: 'tf3-rapid-alkaline-fixer' },
      { slot_type: 'wash_aid', recipe_id: 'hypo-clear-buffered' },
      { slot_type: 'wetting_agent', recipe_id: 'kodak-photo-flo-200' },
    ],
  },
]
