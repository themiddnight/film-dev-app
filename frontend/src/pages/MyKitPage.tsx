// pages/MyKitPage.tsx — My Kit
// Entry: Home navbar icon 🧴
// แสดงรายการ bottles + Equipment Profile summary

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Trash2, Plus, ChevronDown, ChevronUp, Layers, Beaker } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useKitStore } from '../store/kitStore'
import { useRecipes } from '../hooks/useRecipes'
import type { ChemicalBottle, DevKit, EquipmentProfile } from '../types/kit'

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysAgo(isoDate: string): number {
  const diff = Date.now() - new Date(isoDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function expiryStatus(bottle: ChemicalBottle): 'ok' | 'warning' | 'expired' {
  if (!bottle.shelfLifeDays) return 'ok'
  const age = daysAgo(bottle.mixedAt)
  if (age >= bottle.shelfLifeDays) return 'expired'
  if (age >= bottle.shelfLifeDays * 0.8) return 'warning'
  return 'ok'
}

function rollStatus(bottle: ChemicalBottle): 'ok' | 'warning' | 'exceeded' {
  if (!bottle.maxRolls) return 'ok'
  if (bottle.rollsDeveloped >= bottle.maxRolls) return 'exceeded'
  if (bottle.rollsDeveloped >= bottle.maxRolls * 0.8) return 'warning'
  return 'ok'
}

// ── Add / Edit Bottle Form ─────────────────────────────────────────────────────

type BottleFormData = {
  developerName: string
  role: 'developer' | 'stop' | 'fixer' | 'wash_aid' | 'wetting_agent'
  defaultDilution: string
  type: 'one-shot' | 'reusable'
  mixedAt: string
  shelfLifeDays: string
  maxRolls: string
  notes: string
}

const ROLE_OPTIONS: { value: BottleFormData['role']; label: string }[] = [
  { value: 'developer', label: 'Developer' },
  { value: 'stop', label: 'Stop Bath' },
  { value: 'fixer', label: 'Fixer' },
  { value: 'wash_aid', label: 'Wash Aid' },
  { value: 'wetting_agent', label: 'Wetting Agent' },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function BottleFormSheet({
  initialValues,
  onSave,
  onClose,
  title,
}: {
  initialValues?: Partial<BottleFormData & { role: BottleFormData['role'] }>
  onSave: (data: BottleFormData) => void
  onClose: () => void
  title: string
}) {
  const [form, setForm] = useState<BottleFormData>({
    developerName: initialValues?.developerName ?? '',
    role: initialValues?.role ?? 'developer',
    defaultDilution: initialValues?.defaultDilution ?? '',
    type: initialValues?.type ?? 'reusable',
    mixedAt: initialValues?.mixedAt ?? todayISO(),
    shelfLifeDays: initialValues?.shelfLifeDays ?? '',
    maxRolls: initialValues?.maxRolls ?? '',
    notes: initialValues?.notes ?? '',
  })
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  function handleSave() {
    if (!form.developerName.trim()) return
    onSave(form)
    handleClose()
  }

  const field = (key: keyof BottleFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-280 ${closing ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div
        className="relative bg-base-100 rounded-t-[14px] px-5 pt-5 pb-8 z-10 max-h-[90dvh] overflow-y-auto"
        style={{
          animation: closing
            ? 'slideDown 280ms cubic-bezier(0.32,0.72,0,1) forwards'
            : 'slideUp 300ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={handleClose} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Developer name */}
          <div>
            <label className="text-xs text-sub mb-1 block">Chemical name *</label>
            <input
              className="input input-bordered w-full"
              placeholder="e.g. Divided D-23 Bath A"
              {...field('developerName')}
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs text-sub mb-1 block">Chemical type</label>
            <select
              className="select select-bordered w-full"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as BottleFormData['role'] }))}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Dilution */}
          <div>
            <label className="text-xs text-sub mb-1 block">Dilution (if any)</label>
            <input
              className="input input-bordered w-full"
              placeholder="e.g. 1:1, stock"
              {...field('defaultDilution')}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs text-sub mb-1 block">Type</label>
            <div className="join w-full">
              {(['reusable', 'one-shot'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`join-item btn btn-sm flex-1 ${form.type === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                >
                  {t === 'reusable' ? 'Reusable' : 'One-shot'}
                </button>
              ))}
            </div>
          </div>

          {/* Mixed at */}
          <div>
            <label className="text-xs text-sub mb-1 block">Date mixed / opened</label>
            <input
              type="date"
              className="input input-bordered w-full"
              {...field('mixedAt')}
            />
          </div>

          {/* Shelf life */}
          <div>
            <label className="text-xs text-sub mb-1 block">Shelf life (days)</label>
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="e.g. 30"
              min={1}
              {...field('shelfLifeDays')}
            />
          </div>

          {/* Max rolls (reusable only) */}
          {form.type === 'reusable' && (
            <div>
              <label className="text-xs text-sub mb-1 block">Max Rolls</label>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="e.g. 24"
                min={1}
                {...field('maxRolls')}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-sub mb-1 block">Notes</label>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              placeholder="Additional notes..."
              rows={2}
              {...field('notes')}
            />
          </div>
        </div>

        <div className="divider my-4" />
        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary flex-1"
            onClick={handleSave}
            disabled={!form.developerName.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bottle Card ────────────────────────────────────────────────────────────────

function BottleCard({
  bottle,
  onEdit,
  onDelete,
}: {
  bottle: ChemicalBottle
  onEdit: () => void
  onDelete: () => void
}) {
  const expiry = expiryStatus(bottle)
  const rolls = rollStatus(bottle)
  const age = daysAgo(bottle.mixedAt)
  const daysLeft = bottle.shelfLifeDays ? bottle.shelfLifeDays - age : null

  return (
    <div className="card bg-base-200">
      <div className="card-body py-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{bottle.developerName}</span>
              <span className={`badge badge-xs ${
                bottle.role === 'developer' ? 'badge-primary' :
                bottle.role === 'stop' ? 'badge-warning' :
                bottle.role === 'fixer' ? 'badge-accent' : 'badge-ghost'
              }`}>
                {ROLE_OPTIONS.find((o) => o.value === bottle.role)?.label ?? bottle.role}
              </span>
              <span className={`badge badge-xs ${bottle.type === 'reusable' ? 'badge-info' : 'badge-ghost'}`}>
                {bottle.type === 'reusable' ? 'Reusable' : 'One-shot'}
              </span>
              {bottle.defaultDilution && (
                <span className="badge badge-xs badge-ghost">{bottle.defaultDilution}</span>
              )}
            </div>

            {/* Rolls */}
            {bottle.type === 'reusable' && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                rolls === 'exceeded' ? 'text-error' : rolls === 'warning' ? 'text-warning' : 'text-sub'
              }`}>
                <FlaskConical size={11} />
                <span>{bottle.rollsDeveloped} rolls developed</span>
                {bottle.maxRolls && <span className="text-sub">/ {bottle.maxRolls}</span>}
                {rolls === 'warning' && <span>⚠️</span>}
                {rolls === 'exceeded' && <span>❌ Limit exceeded</span>}
              </div>
            )}

            {/* Expiry */}
            <div className={`flex items-center gap-1 mt-0.5 text-xs ${
              expiry === 'expired' ? 'text-error' : expiry === 'warning' ? 'text-warning' : 'text-sub'
            }`}>
              <span>
                {expiry === 'expired'
                  ? '❌ Expired'
                  : expiry === 'warning'
                  ? `⚠️ ${daysLeft} days left`
                  : daysLeft !== null
                  ? `${daysLeft} days left`
                  : `${age} days old`}
              </span>
            </div>

            {bottle.notes && (
              <p className="text-xs text-sub mt-1 line-clamp-1">{bottle.notes}</p>
            )}
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={onEdit}
              aria-label="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="btn btn-ghost btn-xs btn-circle text-error"
              onClick={onDelete}
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Equipment Profile Section ──────────────────────────────────────────────────

const TANK_OPTIONS = [
  { value: 'paterson', label: 'Paterson' },
  { value: 'stainless', label: 'Stainless Steel' },
  { value: 'jobo', label: 'Jobo' },
  { value: 'other', label: 'Other' },
] as const

const AGITATION_OPTIONS = [
  { value: 'inversion', label: 'Inversion' },
  { value: 'rotation', label: 'Rotation' },
  { value: 'rotary', label: 'Rotary (Jobo)' },
  { value: 'stand', label: 'Stand' },
] as const

const WATER_OPTIONS = [
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const

function EquipmentSection({ equipment }: { equipment: EquipmentProfile }) {
  const [expanded, setExpanded] = useState(false)
  const { saveEquipment } = useKitStore()
  const [form, setForm] = useState<EquipmentProfile>(equipment)

  // sync ถ้า prop เปลี่ยน (เช่น โหลดครั้งแรก)
  useEffect(() => {
    setForm(equipment)
  }, [equipment])

  async function handleSave() {
    await saveEquipment(form)
    setExpanded(false)
  }

  const tankLabel = TANK_OPTIONS.find((o) => o.value === form.tankType)?.label ?? form.tankType
  const agitationLabel = AGITATION_OPTIONS.find((o) => o.value === form.agitationMethod)?.label ?? form.agitationMethod

  return (
    <div className="card bg-base-200">
      <button
        className="card-body py-4 px-4 flex-row items-center justify-between w-full text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div>
          <p className="font-semibold text-sm">My Equipment</p>
          <p className="text-xs text-sub mt-0.5">
            {tankLabel} · {agitationLabel} · water: {form.waterHardness}
          </p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-sub shrink-0" /> : <ChevronDown size={16} className="text-sub shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-base-300 pt-3">
          {/* Tank type */}
          <div>
            <label className="text-xs text-sub mb-1 block">Tank Type</label>
            <select
              className="select select-bordered select-sm w-full"
              value={form.tankType}
              onChange={(e) => setForm((f) => ({ ...f, tankType: e.target.value as EquipmentProfile['tankType'] }))}
            >
              {TANK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Agitation method */}
          <div>
            <label className="text-xs text-sub mb-1 block">Agitation Method</label>
            <select
              className="select select-bordered select-sm w-full"
              value={form.agitationMethod}
              onChange={(e) => setForm((f) => ({ ...f, agitationMethod: e.target.value as EquipmentProfile['agitationMethod'] }))}
            >
              {AGITATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Water hardness */}
          <div>
            <label className="text-xs text-sub mb-1 block">Water Hardness</label>
            <div className="join w-full">
              {WATER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`join-item btn btn-sm flex-1 ${form.waterHardness === o.value ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setForm((f) => ({ ...f, waterHardness: o.value as EquipmentProfile['waterHardness'] }))}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-soak */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Pre-soak</div>
              <div className="text-xs text-sub">Soak in water before developing</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.usesPreSoak}
              onChange={(e) => setForm((f) => ({ ...f, usesPreSoak: e.target.checked }))}
            />
          </div>

          <button className="btn btn-primary btn-sm w-full mt-1" onClick={handleSave}>
            Save
          </button>
        </div>
      )}
    </div>
  )
}

// ── DevKit Card ────────────────────────────────────────────────────────────────

function DevKitCard({
  kit,
  recipeName,
  onEdit,
  onDelete,
}: {
  kit: DevKit
  recipeName: string
  onEdit: () => void
  onDelete: () => void
}) {
  const filledSlots = kit.slots.filter((s) => s.bottleId !== null).length
  return (
    <div className="card bg-base-200">
      <div className="card-body py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Layers size={13} className="text-primary shrink-0" />
              <span className="font-semibold text-sm">{kit.name}</span>
            </div>
            <p className="text-xs text-sub mt-0.5">{recipeName}</p>
            <p className="text-xs text-sub mt-0.5">
              {filledSlots}/{kit.slots.length} slots selected
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={onEdit}
              aria-label="Edit Kit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="btn btn-ghost btn-xs btn-circle text-error"
              onClick={onDelete}
              aria-label="Delete Kit"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MyKitPage() {
  const navigate = useNavigate()
  const { kit, loading, loadKit, addBottle, updateBottle, deleteBottle,
    devKits, loadDevKits, deleteDevKit } = useKitStore()
  const { recipes } = useRecipes()
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [editingBottle, setEditingBottle] = useState<ChemicalBottle | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteKitId, setDeleteKitId] = useState<string | null>(null)

  useEffect(() => {
    loadKit()
    loadDevKits()
  }, [loadKit, loadDevKits])

  async function handleAddBottle(data: BottleFormData) {
    await addBottle({
      developerName: data.developerName,
      role: data.role,
      defaultDilution: data.defaultDilution || undefined,
      type: data.type,
      mixedAt: data.mixedAt || new Date().toISOString(),
      shelfLifeDays: data.shelfLifeDays ? Number(data.shelfLifeDays) : undefined,
      rollsDeveloped: 0,
      maxRolls: data.maxRolls ? Number(data.maxRolls) : undefined,
      notes: data.notes || undefined,
    })
  }

  async function handleEditBottle(data: BottleFormData) {
    if (!editingBottle) return
    await updateBottle(editingBottle.id, {
      developerName: data.developerName,
      role: data.role,
      defaultDilution: data.defaultDilution || undefined,
      type: data.type,
      mixedAt: data.mixedAt || editingBottle.mixedAt,
      shelfLifeDays: data.shelfLifeDays ? Number(data.shelfLifeDays) : undefined,
      maxRolls: data.maxRolls ? Number(data.maxRolls) : undefined,
      notes: data.notes || undefined,
    })
    setEditingBottle(null)
  }

  async function handleDelete(id: string) {
    await deleteBottle(id)
    setDeleteConfirmId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="🧴 Inventory"
        onBack={() => navigate('/')}
        right={
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => setShowAddSheet(true)}
            aria-label="Add bottle"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner" />
          </div>
        ) : (
          <>
            {/* Equipment Profile */}
            <p className="text-xs text-sub uppercase tracking-widest pt-4 pb-2">Equipment</p>
            <EquipmentSection equipment={kit.equipment} />

            {/* Chemical Bottles */}
            <div className="flex items-center justify-between pt-5 pb-2">
              <p className="text-xs text-sub uppercase tracking-widest">Chemical Bottles ({kit.bottles.length})</p>
              {kit.bottles.length > 0 && (
                <button
                  className="btn btn-ghost btn-xs gap-1"
                  onClick={() => setShowAddSheet(true)}
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>

            {kit.bottles.length === 0 ? (
              <div className="card bg-base-200">
                <div className="card-body items-center text-center py-8">
                  <FlaskConical size={32} className="text-sub mb-2" />
                  <p className="text-sm text-sub">No bottles yet</p>
                  <p className="text-xs text-sub mt-1 mb-4">
                    Mix chemicals first and save the bottle when done — or add an existing bottle manually
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <button
                      className="btn btn-primary btn-sm gap-2"
                      onClick={() => navigate('/mixing/recipe')}
                    >
                      <Beaker size={14} />
                      Go mix chemicals
                    </button>
                    <button
                      className="btn btn-ghost btn-sm gap-2"
                      onClick={() => setShowAddSheet(true)}
                    >
                      <Plus size={14} />
                      Add bottle manually
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {kit.bottles.map((bottle) => (
                  <BottleCard
                    key={bottle.id}
                    bottle={bottle}
                    onEdit={() => setEditingBottle(bottle)}
                    onDelete={() => setDeleteConfirmId(bottle.id)}
                  />
                ))}
              </div>
            )}

            {/* ── Dev Kits (Phase 1c) ────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-5 pb-2">
              <p className="text-xs text-sub uppercase tracking-widest">
                Kits ({devKits.length})
              </p>
              <button
                className="btn btn-ghost btn-xs gap-1"
                onClick={() => navigate('/my-kit/create-kit')}
              >
                <Plus size={12} />
                Create Kit
              </button>
            </div>

            {devKits.length === 0 ? (
              <div className="card bg-base-200">
                <div className="card-body items-center text-center py-6">
                  <Layers size={28} className="text-sub mb-2" />
                  <p className="text-sm text-sub">No Kits yet</p>
                  <p className="text-xs text-sub mt-1">
                    Create a Kit to pre-assign which bottles to use with which recipe
                  </p>
                  <button
                    className="btn btn-outline btn-sm mt-3"
                    onClick={() => navigate('/my-kit/create-kit')}
                  >
                    <Plus size={14} />
                    Create your first Kit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {devKits.map((devKit) => {
                  const recipe = recipes.find((r) => r.id === devKit.recipeId)
                  return (
                    <DevKitCard
                      key={devKit.id}
                      kit={devKit}
                      recipeName={recipe?.name ?? devKit.recipeId}
                      onEdit={() => navigate(`/my-kit/create-kit?edit=${devKit.id}`)}
                      onDelete={() => setDeleteKitId(devKit.id)}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Bottle Sheet */}
      {showAddSheet && (
        <BottleFormSheet
          title="Add chemical bottle"
          onSave={handleAddBottle}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {/* Edit Bottle Sheet */}
      {editingBottle && (
        <BottleFormSheet
          title="Edit chemical bottle"
          initialValues={{
            developerName: editingBottle.developerName,
            role: editingBottle.role,
            defaultDilution: editingBottle.defaultDilution ?? '',
            type: editingBottle.type,
            mixedAt: editingBottle.mixedAt.split('T')[0],
            shelfLifeDays: editingBottle.shelfLifeDays?.toString() ?? '',
            maxRolls: editingBottle.maxRolls?.toString() ?? '',
            notes: editingBottle.notes ?? '',
          }}
          onSave={handleEditBottle}
          onClose={() => setEditingBottle(null)}
        />
      )}

      {/* Delete bottle confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-base-100 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">Delete this bottle?</h3>
            <p className="text-sm text-sub mb-5">Roll count and mixed date will be lost</p>
            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error flex-1"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete kit confirm modal */}
      {deleteKitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-base-100 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">Delete this Kit?</h3>
            <p className="text-sm text-sub mb-5">The Kit will be deleted, but bottles in your inventory will remain</p>
            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1" onClick={() => setDeleteKitId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error flex-1"
                onClick={async () => {
                  await deleteDevKit(deleteKitId)
                  setDeleteKitId(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
