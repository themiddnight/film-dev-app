# Film Dev Guidance — Architecture

> Last updated: 2026-04-14
> Stack: Bun · React 19 · Vite · Tailwind v4 · DaisyUI v5 · Zustand

---

## 2-Layer Design

App แบ่งข้อมูลออกเป็น 2 layer ที่ชัดเจน:

```
Layer 1 — Knowledge (static/curated)
 Recipes, timing tables, chemical data, agitation specs
 Current: TypeScript static files + local personal recipes
 Phase 2+: PostgreSQL DB, read via API

Layer 2 — User's World (dynamic/personal)
 Inventory, kits, session history, settings
 Current: localStorage (throwaway — no migration plan)
 Phase 3: PostgreSQL tied to user account
```

### ทำไม throwaway ได้?

App จะไม่ขึ้น production ให้ user ทั่วไปใช้จนกว่า backend และ auth จะครบถ้วน เพราะฉะนั้น local data ทั้งหมดเป็น dev/test data ที่ทิ้งได้ เมื่อไปถึง Phase 3:
- Static recipes → seed ใหม่จาก script
- Personal data (My Kit) → user เริ่มสร้างใหม่หลัง login

---

## Repository Pattern

### หลักการ

Service/component ไม่รู้ว่า data มาจากไหน — รู้แค่ว่าจะเรียก method อะไร ทำให้ตอน swap จาก localStorage → API ไม่ต้องแตะ component เลย

```
Component / Hook
 │
 ▼
 Repository Interface ← นี่คือ boundary
 │
 ├── LocalRepository (current)
 └── ApiRepository (Phase 3)
```

### Interface Definitions

```ts
// src/repositories/RecipeRepository.ts
export interface RecipeRepository {
 getAll(filter?: RecipeFilter): Promise<Recipe[]>
 getById(id: string): Promise<Recipe | null>
 getByStepType(type: RecipeStepType): Promise<Recipe[]>
 save(recipe: Recipe): Promise<void>
 delete(id: string): Promise<void>
}

// src/repositories/KitRepository.ts
export interface KitRepository {
 getAll(): Promise<Kit[]>
 getById(id: string): Promise<Kit | null>
 save(kit: Kit): Promise<void>
 delete(id: string): Promise<void>
}
```

### Current Implementations (local)

```ts
// src/repositories/local/LocalRecipeRepository.ts
export class LocalRecipeRepository implements RecipeRepository {
 async getAll(filter?: RecipeFilter) { /* system + personal */ }
 async getById(id: string) { /* ... */ }
}

// src/repositories/local/LocalKitRepository.ts
export class LocalKitRepository implements KitRepository {
 private readonly KEY = 'kits'
 // reads/writes localStorage
}
```

### Phase 3 Implementations (API) — เพิ่มทีหลัง

```ts
// src/repositories/api/ApiRecipeRepository.ts
export class ApiRecipeRepository implements RecipeRepository {
 constructor(private http: HttpClient) {}
 async getAll(filter?: RecipeFilter) { return this.http.get<Recipe[]>('/api/v1/recipes', { params: filter }) }
 async getById(id: string) { return this.http.get<Recipe>(`/api/v1/recipes/${id}`) }
}
```

### Dependency Injection (simple)

ไม่ต้องใช้ DI container — ใช้ React Context หรือ module-level singleton ก็พอ:

```ts
// src/repositories/index.ts
export const recipeRepo: RecipeRepository = new LocalRecipeRepository()
export const kitRepo: KitRepository = new LocalKitRepository()
export const inventoryRepo: InventoryRepository = new LocalInventoryRepository()
export const sessionRepo: SessionRepository = new LocalSessionRepository()

// ตอน Phase 3 เปลี่ยน implementation ฝั่งนี้:
// export const recipeRepo: RecipeRepository = new ApiRecipeRepository(httpClient)
// export const kitRepo: KitRepository = new ApiKitRepository(httpClient)
```

---

## Folder Structure (target)

```
frontend/src/
├── data/
│ └── systemRecipes.ts # Layer 1 curated recipes
│
├── repositories/
│ ├── RecipeRepository.ts
│ ├── InventoryRepository.ts
│ ├── KitRepository.ts
│ ├── SessionRepository.ts
│ ├── local/
│ │ ├── LocalRecipeRepository.ts
│ │ ├── LocalInventoryRepository.ts
│ │ ├── LocalKitRepository.ts
│ │ └── LocalSessionRepository.ts
│ ├── api/
│ └── index.ts
│
├── types/
│ ├── recipe.ts
│ ├── inventory.ts
│ ├── kit.ts
│ ├── session.ts
│ └── settings.ts
│
├── store/
│ ├── devSessionStore.ts
│ ├── mixingStore.ts
│ ├── equipmentStore.ts
│ └── settingsStore.ts
│
├── hooks/
│ ├── useRecipes.ts
│ ├── useInventory.ts
│ ├── useKits.ts
│ └── useSessions.ts
│
├── components/
├── pages/
│ ├── dev/
│ └── mix/
└── App.tsx
```

---

## Data Shape Rules

กฎที่ apply ทุก phase เพื่อให้ refactor ง่ายขึ้นเมื่อถึงเวลา:

1. **UUID ทุก entity** — ไม่ใช้ array index หรือ sequential integer เป็น ID
2. **`createdAt` + `updatedAt`** — ISO string ทุก user-owned entity
3. **Metric เสมอ** — เก็บ ml, g, °C ใน data — แปลงหน่วยเฉพาะตอน display
4. **Source separation** — Layer 1 (recipes) และ Layer 2 (inventory/kits/sessions) อยู่คนละ folder และ localStorage key แยกกัน

---

## What Will NOT Need Refactoring

สิ่งที่ออกแบบไว้ดีแล้วและจะ carry forward ได้ตรงๆ:
- Repository interfaces (swap implementation เท่านั้น)
- Type definitions ใน `types/`
- Zustand stores (UI state ไม่ใช่ data fetching)
- component/page structure

## What WILL Need Refactoring (Phase 3)

สิ่งที่ยอมรับว่าต้อง refactor ใหม่เมื่อมี auth:
- Auth flow ทั้งหมด (login/logout/token) — เพิ่มใหม่ไม่ใช่ refactor
- Optimistic updates + offline sync — ซับซ้อน ทำเมื่อมี backend จริง
- Community features (fork, rating, moderation) — feature ใหม่ ไม่ใช่ refactor
- Personal data migration — ไม่จำเป็น (throwaway policy)
