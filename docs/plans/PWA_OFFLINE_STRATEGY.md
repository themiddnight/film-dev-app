# PWA Offline Strategy — User-Driven Download

## Current Status (Implemented vs Next)

Implemented now:
- PWA app shell with `vite-plugin-pwa` + Workbox (installable app, update flow)
- Service worker registration and update prompt wiring in Settings UI
- IndexedDB (Dexie) tables:
	- `favoriteRecipes`
	- `offlineSavedRecipes`

Not implemented yet (next phase):
- Backend API read/write for recipes, inventory, kits, sessions
- Account-based sync for favorites/inventory/kits
- Staleness check against backend `updatedAt/version` and sync conflict policy

## แนวคิดหลัก

ใช้รูปแบบเดียวกับ Netflix, YouTube, และ Google Maps โดยให้ **user เป็นคนตัดสินใจ** ว่าจะ download recipe ใดไว้ใช้งาน offline เอง

- Recipe ที่ **download แล้ว** → ใช้งาน offline ได้สมบูรณ์
- Recipe ที่ **ยังไม่ได้ download** → ใช้งานได้เฉพาะตอน online เท่านั้น

แนวทางนี้เหมาะกับ Film Dev App เพราะ user มักรู้ล่วงหน้าว่าจะใช้ฟิล์มอะไร และสามารถ download ไว้ก่อนออกไปถ่ายรูปได้

---

## UX Flow

### การ Download

```
[Recipe Card / Detail Page]
 → ปุ่ม "Download for Offline"
 → Fetch recipe detail จาก API
 → บันทึกข้อมูล (JSON) ลง IndexedDB
 → Cache รูปภาพ (ถ้ามี) ลง Cache Storage
 → แสดง status = "Downloaded ✓"
```

### การอ่านข้อมูล

```
[Recipe Detail Page]
 → ถ้า Online → Fetch จาก API (ข้อมูลล่าสุดเสมอ)
 → ถ้า Offline + Downloaded → อ่านจาก IndexedDB
 → ถ้า Offline + ไม่มี → แสดง UI "ไม่พร้อมใช้งาน offline" + ลิงก์ให้ download เมื่อมีเน็ต
```

---

## เทคนิคที่ใช้

| Layer | เทคโนโลยี | หน้าที่ |
|---|---|---|
| Data Storage | **IndexedDB** (ผ่าน Dexie.js) | เก็บ JSON ของ recipe ที่ download |
| Asset Cache | **Cache Storage API** | เก็บรูปภาพ, static assets |
| Service Worker | **Workbox** (ผ่าน vite-plugin-pwa) | Cache static files (HTML/JS/CSS), intercept requests |
| State Management | Zustand (มีอยู่แล้ว) | track ว่า recipe ไหน downloaded |

หมายเหตุเชิง implementation ปัจจุบัน:
- App shell/static assets ใช้ service worker cache
- Shared recipe content ยังเป็น online-first
- Offline read สำหรับ recipe ใช้ snapshot ใน IndexedDB เฉพาะที่ user save ไว้

---

## Schema IndexedDB (เบื้องต้น)

```ts
// ตัวอย่างด้วย Dexie.js
class FilmDevDB extends Dexie {
 downloadedRecipes!: Table<DownloadedRecipe>

 constructor() {
 super('FilmDevDB')
 this.version(1).stores({
 downloadedRecipes: 'id, downloadedAt, version'
 })
 }
}

interface DownloadedRecipe {
 id: string
 downloadedAt: number // timestamp
 version: number // สำหรับ detect update
 data: RecipeDetail // full recipe object
}
```

Schema ที่ใช้อยู่ปัจจุบันใน codebase:

```ts
favoriteRecipes: '&recipe_id, created_at'
offlineSavedRecipes: '&recipe_id, saved_at, source_updated_at'
```

---

## สิ่งที่ต้องคำนึงถึง

### 1. Storage Quota
- Browser จำกัด storage ต่อ origin (อาจถูก evict ถ้า device เต็ม)
- แสดงให้ user รู้ว่า download ไว้กี่ recipe
- มีปุ่ม "ลบ offline data" สำหรับแต่ละ recipe

### 2. Content Staleness (ข้อมูลเก่า)
- Backend ควรมี `version` หรือ `updatedAt` field ใน recipe
- เมื่อ online ให้เช็คว่า version ใน IndexedDB ตรงกับ API ไหม
- ถ้าเก่ากว่า → แจ้ง user ว่ามี update ให้ดาวน์โหลดใหม่

### 3. UX สำหรับ recipe ที่ไม่ได้ download (offline)
- อย่าแสดง error หน้าเปล่า
- แสดง lock icon หรือ badge บน recipe card ที่ยังไม่ได้ download
- ข้อความ: "Download recipe นี้ไว้ก่อนเพื่อใช้งาน offline"

### 4. รูปภาพ
- ต้องตัดสินใจว่าจะ cache รูปด้วยหรือไม่
- ถ้า cache รูป: ใช้ Cache Storage เก็บ blob
- ถ้าไม่ cache รูป: ตอน offline รูปจะไม่แสดง แต่ข้อความ/สูตรยังใช้ได้

---

## ลำดับ Implementation (เมื่อพร้อม)

1. **Setup vite-plugin-pwa + Workbox** สำหรับ Service Worker และ static asset caching
2. **Install Dexie.js** และสร้าง DB schema
3. **สร้าง download service** — function สำหรับ fetch + save ลง IndexedDB
4. **เพิ่ม download button** ใน Recipe Card และ Recipe Detail page
5. **แก้ Recipe Detail page** ให้รองรับ offline read จาก IndexedDB
6. **สร้าง "Downloaded Recipes" page** สำหรับดู recipe ที่ download ไว้ทั้งหมด
7. **Handle staleness** — เช็ค version เมื่อ online

---

## สรุปข้อดีของ Approach นี้

- ✅ UX ชัดเจน user ควบคุมได้เต็มที่
- ✅ ไม่เปลือง bandwidth/storage โดยไม่จำเป็น
- ✅ Scale ได้ดีเมื่อ recipe เยอะขึ้น
- ✅ Mental model เหมือน native app ที่ user คุ้นชิน
- ✅ เหมาะกับ use case ของ Film Dev (plan ล่วงหน้าก่อนออกถ่าย)
