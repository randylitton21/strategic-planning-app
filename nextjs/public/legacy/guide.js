// Shared guide + handoff utilities for the Strategic Planning Suite (static, no backend)
// Exposed as window.Guide
;(function () {
  const HANDOFF_KEY = 'prototype_handoff'

  function safeJsonParse(value) {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  function getSessionUser() {
    const raw = sessionStorage.getItem('prototype_userSession')
    if (!raw) return null
    const session = safeJsonParse(raw)
    return session && session.user ? session.user : null
  }

  function getCurrentUsername() {
    const user = getSessionUser()
    return user && user.username ? user.username : null
  }

  function startHandoff(payload) {
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
        ...payload,
        ts: new Date().toISOString()
      }))
      return true
    } catch {
      return false
    }
  }

  function consumeHandoff() {
    const raw = sessionStorage.getItem(HANDOFF_KEY)
    if (!raw) return null
    sessionStorage.removeItem(HANDOFF_KEY)
    return safeJsonParse(raw)
  }

  function readJson(key) {
    const raw = localStorage.getItem(key)
    return raw ? safeJsonParse(raw) : null
  }

  function writeJson(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj))
  }

  function buildModal({ title, bodyNode, primaryText, secondaryText }) {
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:20000;display:flex;align-items:center;justify-content:center;padding:16px;'

    const card = document.createElement('div')
    card.style.cssText = 'background:#fff;border-radius:12px;max-width:520px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,0.3);padding:18px;'

    const h = document.createElement('h3')
    h.textContent = title
    h.style.cssText = 'margin:0 0 12px 0;font-size:18px;color:#0f172a;'

    const actions = document.createElement('div')
    actions.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;'

    const secondary = document.createElement('button')
    secondary.textContent = secondaryText || 'Cancel'
    secondary.style.cssText = 'padding:10px 14px;border-radius:999px;border:2px solid #e2e8f0;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;'

    const primary = document.createElement('button')
    primary.textContent = primaryText || 'Continue'
    primary.style.cssText = 'padding:10px 14px;border-radius:999px;border:none;background:#10b981;color:#fff;font-weight:800;cursor:pointer;'

    actions.appendChild(secondary)
    actions.appendChild(primary)

    card.appendChild(h)
    card.appendChild(bodyNode)
    card.appendChild(actions)
    overlay.appendChild(card)

    function close() {
      overlay.remove()
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close()
    })

    return { overlay, primary, secondary, close }
  }

  async function promptSelectGoal(goals, { title } = {}) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div')

      const p = document.createElement('p')
      p.textContent = 'Select which goal you want to bring into this tool.'
      p.style.cssText = 'margin:0 0 10px 0;color:#334155;line-height:1.5;'

      const select = document.createElement('select')
      select.style.cssText = 'width:100%;padding:10px;border-radius:10px;border:2px solid #e2e8f0;font-size:14px;'

      goals.forEach((g, idx) => {
        const opt = document.createElement('option')
        opt.value = String(idx)
        opt.textContent = (g && (g.title || g.goal || g.name)) ? String(g.title || g.goal || g.name) : `Goal ${idx + 1}`
        select.appendChild(opt)
      })

      wrap.appendChild(p)
      wrap.appendChild(select)

      const modal = buildModal({
        title: title || 'Import a goal',
        bodyNode: wrap,
        primaryText: 'Import',
        secondaryText: 'Cancel'
      })

      modal.secondary.onclick = () => {
        modal.close()
        resolve(null)
      }

      modal.primary.onclick = () => {
        const idx = parseInt(select.value, 10)
        modal.close()
        resolve(goals[idx] || null)
      }

      document.body.appendChild(modal.overlay)
    })
  }

  function addGuidePanel({ title, steps }) {
    // small floating guide button + panel
    const btn = document.createElement('button')
    btn.textContent = 'Guide'
    btn.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:15000;border:none;border-radius:999px;background:#0f4c75;color:#fff;font-weight:800;padding:12px 16px;box-shadow:0 8px 20px rgba(0,0,0,0.2);cursor:pointer;'

    const panel = document.createElement('div')
    panel.style.cssText = 'position:fixed;right:14px;bottom:70px;z-index:15000;background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,0.25);width:min(420px,calc(100vw - 28px));padding:14px;display:none;'

    const h = document.createElement('div')
    h.textContent = title || 'Guided Workflow'
    h.style.cssText = 'font-weight:900;color:#0f172a;margin-bottom:10px;'

    const list = document.createElement('div')
    steps.forEach((s) => {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:10px;'

      const label = document.createElement('div')
      label.textContent = s.label
      label.style.cssText = 'font-weight:800;color:#0f172a;'

      const go = document.createElement('button')
      go.textContent = s.cta || 'Open'
      go.style.cssText = 'border:none;border-radius:999px;background:#10b981;color:#fff;font-weight:800;padding:8px 12px;cursor:pointer;'
      go.onclick = s.onClick

      row.appendChild(label)
      row.appendChild(go)
      list.appendChild(row)
    })

    const close = document.createElement('button')
    close.textContent = 'Close'
    close.style.cssText = 'border:none;border-radius:999px;background:#e2e8f0;color:#0f172a;font-weight:800;padding:10px 12px;cursor:pointer;width:100%;'
    close.onclick = () => { panel.style.display = 'none' }

    panel.appendChild(h)
    panel.appendChild(list)
    panel.appendChild(close)

    btn.onclick = () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
    }

    document.body.appendChild(btn)
    document.body.appendChild(panel)
  }

  window.Guide = {
    HANDOFF_KEY,
    getSessionUser,
    getCurrentUsername,
    readJson,
    writeJson,
    startHandoff,
    consumeHandoff,
    promptSelectGoal,
    addGuidePanel
  }
})()

