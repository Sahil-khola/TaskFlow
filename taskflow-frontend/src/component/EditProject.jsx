import { useState } from 'react'
import api from '../api/api.js'

/**
 * Project ka name aur description edit karne ka control.
 *
 * Backend endpoint pehle se maujood hai: `PATCH /api/projects/:id` -> `updateProject`,
 * jo sirf OWNER aur ADMIN ke liye kaam karta hai. Isliye ye button unhi roles ko dikhta hai.
 *
 * Props:
 *   project — current project object (name/description se form prefill hota hai)
 *   onSaved — save hone ke baad parent ko refresh karne ke liye
 */
export default function EditProject({ project, onSaved }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')

  const openForm = () => {
    // Har baar kholne par current values se prefill karo, stale draft nahi rehna chahiye
    setName(project?.name || '')
    setDescription(project?.description || '')
    setErr('')
    setNotice('')
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setErr('')
    setNotice('')
  }

  const save = async (e) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setErr('Project name cannot be empty.')
      return
    }

    setSaving(true)
    setErr('')
    try {
      await api.patch(`/projects/${project._id}`, {
        name: trimmed,
        // Khaali description bhejte hain taaki user use clear kar sake
        description: description.trim(),
      })
      setNotice('Project updated successfully.')
      onSaved?.()
      // Thodi der rehne dein taaki success message dikh jaye
      setTimeout(close, 900)
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not update the project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        className="btn-outline shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
      >
        Edit project
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-project-title"
          onClick={close}
        >
          <div
            className="glass-strong w-full max-w-lg animate-scale-in rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="edit-project-title" className="font-display text-xl font-extrabold text-ink-900">
                Edit project
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="btn-chip border border-ink-900/10 px-2 text-ink-500 hover:border-ink-900/25"
              >
                ✕
              </button>
            </div>

            <form onSubmit={save} className="mt-5 grid gap-3">
              <div>
                <label htmlFor="project-name" className="mb-1.5 block text-xs font-bold tracking-wide text-ink-500 uppercase">
                  Project name
                </label>
                <input
                  id="project-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={80}
                  required
                  autoFocus
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="project-description" className="mb-1.5 block text-xs font-bold tracking-wide text-ink-500 uppercase">
                  Description
                </label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="What is this project about?"
                  className="field resize-none"
                />
                <p className="mt-1 text-right text-[11px] text-ink-300 tnum">{description.length}/400</p>
              </div>

              {err && (
                <p className="alert-rose rounded-lg px-3 py-2 text-sm font-medium" role="alert" aria-live="polite">
                  {err}
                </p>
              )}
              {notice && (
                <p className="rounded-lg bg-done-soft px-3 py-2 text-sm font-medium text-[#047857]" aria-live="polite">
                  {notice}
                </p>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="btn-chip border border-ink-900/12 px-4 py-2 text-sm font-semibold text-ink-500 hover:border-ink-900/30"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-gradient rounded-xl px-5 py-2 text-sm font-semibold">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
