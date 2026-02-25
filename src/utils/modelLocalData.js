const KEY = 'modelsData'

export function getModels() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveModels(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list || [])) } catch {}
}

export function addModel(item) {
  const list = getModels()
  const nowISO = new Date().toISOString()
  const model = {
    id: item.id || Date.now(),
    modelName: item.modelName || '未命名模型',
    modelType: item.modelType || 'api',        // 'api' | 'local'
    apiOrWeight: item.apiOrWeight || '',
    description: item.description || '',
    status: item.status || 'active',
    createTime: item.createTime || nowISO,
    updateTime: item.updateTime || nowISO
  }
  list.push(model)
  saveModels(list)
  return model.id
}

export function updateModel(id, patch = {}) {
  const list = getModels()
  const idx = list.findIndex(m => String(m.id) === String(id))
  if (idx > -1) {
    list[idx] = {
      ...list[idx],
      ...patch,
      updateTime: patch.updateTime || new Date().toISOString()
    }
    saveModels(list)
    return true
  }
  return false
}

export function removeModel(id) {
  const list = getModels().filter(m => String(m.id) !== String(id))
  saveModels(list)
}

export function getModelById(id) {
  return getModels().find(m => String(m.id) === String(id))
}