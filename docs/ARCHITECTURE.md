# Film Dev Guidance — Architecture

> Last updated: 2026-04-04
> Stack: Bun · React 19 · Vite · Tailwind v4 · DaisyUI v5 · Zustand

---

## 2-Layer Design

App แบ่งข้อมูลออกเป็น 2 layer ที่ชัดเจน:

```
Layer 1 — Knowledge (static/curated)
  Recipes, timing tables, chemical data, agitation specs
  Phase 1: TypeScript static files
  Phase 2+: PostgreSQL DB, read via API

Layer 2 — User's World (dynamic/personal)
  My Kit (equipment profile + chemical bottles), session history, settings
  Phase 1-2: localStorage (throwaway — no migration plan)
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
  Repository Interface   ← นี่คือ boundary
      │
      ├── LocalRepository (Phase 1-2)
      └── ApiRepository   (Phase 3)
```

### Interface Definitions

```ts
// src/repositories/RecipeRepository.ts
export interface RecipeRepository {
  getAll(): Promise<Recipe[]>
  getById(id: string): Promise<Recipe | null>
}

// src/repositories/KitRepository.ts
export interface KitRepository {
  getKit(): Promise<UserKit>
  saveEquipment(profile: EquipmentProfile): Promise<void>
  addBottle(bottle: Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChemicalBottle>
  updateBottle(id: string, updates: Partial<ChemicalBottle>): Promise<void>
  deleteBottle(id: string): Promise<void>
  incrementRolls(bottleId: string, count?: number): Promise<void>
}
```

### Phase 2 Implementations (local)

```ts
// src/repositories/local/LocalRecipeRepository.ts
export class LocalRecipeRepository implements RecipeRepository {
  async getAll() { return [...allRecipes] }  // import จาก src/data/
  async getById(id: string) { return allRecipes.find(r => r.id === id) ?? null }
}

// src/repositories/local/LocalKitRepository.ts
export class LocalKitRepository implements KitRepository {
  private readonly KEY = 'my-kit'
  // reads/writes localStorage
}
```

### Phase 3 Implementations (API) — เพิ่มทีหลัง

```ts
// src/repositories/api/ApiRecipeRepository.ts
export class ApiRecipeRepository implements RecipeRepository {
  constructor(private http: HttpClient) {}
  async getAll() { return this.http.get<Recipe[]>('/api/v1/recipes') }
  async getById(id: string) { return this.http.get<Recipe>(`/api/v1/recipes/${id}`) }
}
```

### Dependency Injection (simple)

ไม่ต้องใช้ DI container — ใช้ React Context หรือ module-level singleton ก็พอ:

```ts
// src/repositories/index.ts
export const recipeRepo: RecipeRepository = new LocalRecipeRepository()
export const kitRepo: KitRepository = new LocalKitRepository()

// ตอน Phase 3 เปลี่ยนแค่ 2 บรรทัดนี้:
// export const recipeRepo: RecipeRepository = new ApiRecipeRepository(httpClient)
// export const kitRepo: KitRepository = new ApiKitRepository(httpClient)
```

---

## Folder Structure (target)

```
frontend/src/
├── data/                    # Layer 1 static data (recipe TypeScript files)
│   ├── divided-d23.ts
│   ├── hc110.ts
│   ├── d76.ts
│   └── index.ts
│
├── repositories/            # Data access layer
│   ├── RecipeRepository.ts  # interface
│   ├── KitRepository.ts     # interface
│   ├── local/
│   │   ├── LocalRecipeRepository.ts
│   │   └── LocalKitRepository.ts
│   ├── api/                 # (Phase 3 — empty folder for now)
│   └── index.ts             # exports active implementations
│
├── types/
│   ├── recipe.ts            # Recipe, Bath, DevelopStep, etc.
│   ├── kit.ts               # ChemicalBottle, EquipmentProfile, UserKit (Phase 1b)
│   └── settings.ts
│
├── store/                   # Zustand stores (UI state, not data fetching)
│   ├── developStore.ts
│   ├── mixingStore.ts
│   └── settingsStore.ts
│
├── hooks/                   # Data hooks (call repositories)
│   ├── useRecipes.ts        # wraps RecipeRepository
│   ├── useKit.ts            # wraps KitRepository (Phase 1b)
│   ├── useTimer.ts
│   └── useUnit.ts
│
├── components/
├── pages/
└── App.tsx
```

---

## Data Shape Rules

กฎที่ apply ทุก phase เพื่อให้ refactor ง่ายขึ้นเมื่อถึงเวลา:

1. **UUID ทุก entity** — ไม่ใช้ array index หรือ sequential integer เป็น ID
2. **`createdAt` + `updatedAt`** — ISO string ทุก user-owned entity
3. **Metric เสมอ** — เก็บ ml, g, °C ใน data — แปลงหน่วยเฉพาะตอน display
4. **Source separation** — Layer 1 (recipes) และ Layer 2 (kit) อยู่คนละ folder และ localStorage key แยกกัน

---

## What Will NOT Need Refactoring

สิ่งที่ออกแบบไว้ดีแล้วและจะ carry forward ได้ตรงๆ:
- Repository interfaces (swap implementation เท่านั้น)
- Type definitions ใน `types/`
- Zustand stores (UI state ไม่ใช่ data fetching)
- Component/page structure

## What WILL Need Refactoring (Phase 3)

สิ่งที่ยอมรับว่าต้อง refactor ใหม่เมื่อมี auth:
- Auth flow ทั้งหมด (login/logout/token) — เพิ่มใหม่ไม่ใช่ refactor
- Optimistic updates + offline sync — ซับซ้อน ทำเมื่อมี backend จริง
- Community features (fork, rating, moderation) — feature ใหม่ ไม่ใช่ refactor
- Personal data migration — ไม่จำเป็น (throwaway policy)
