import type { Recipe } from '@/types/recipe'
import { developerRecipes } from './recipes/developers'
import { stopRecipes } from './recipes/stops'
import { fixerRecipes } from './recipes/fixers'
import { washAidRecipes } from './recipes/washAids'
import { wettingAgentRecipes } from './recipes/wettingAgents'

export const systemRecipes: Recipe[] = [
  ...developerRecipes,
  ...stopRecipes,
  ...fixerRecipes,
  ...washAidRecipes,
  ...wettingAgentRecipes,
]
