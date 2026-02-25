// 本地存储工具：数据集与指标标准
export const DS_KEY = "dataSetsData";
export const STD_KEY = "standardsData";
export const METRIC_KEY = "metric_sets_v1";
const KEY = "dataSetsData";

export function getDataSets() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDataSets(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr || []));
  } catch {}
}

export function addDataSet(item) {
  const list = getDataSets();
  const id = item.id || Date.now();
  const now = new Date().toISOString();
  const dataset = {
    id,
    name: item.name || "未命名评测集",
    description: item.description || "",
    visibility: item.visibility || "public",
    direction: item.direction || "",
    createTime: item.createTime || now,
    updateTime: item.updateTime || now,
    publishTime: item.publishTime || now,
    scenes: Array.isArray(item.scenes) ? item.scenes : [],
    tags: item.tags || [],
    status: item.status || "pending",
    ownerName: item.ownerName || "user", // 可替换真实登录用户名
    dataCount: item.dataCount || 0,
    evaluationCount: item.evaluationCount || 0,
    files: item.files || [], // { id,name,size,url,type,updateTime }
  };
  list.push(dataset);
  saveDataSets(list);
  return id;
}

export function getMetricSets () {
  try { return JSON.parse(localStorage.getItem(METRIC_KEY) || '[]') } catch { return [] }
}
export function saveMetricSets (list) {
  localStorage.setItem(METRIC_KEY, JSON.stringify(list))
}


export function approveItems (ids = []) {
  const ds = getDataSets()
  let changed = false
  ds.forEach(d => { if (ids.includes(d.id) || ids.includes(String(d.id))) { d.status = 'approved'; changed = true } })
  if (changed) saveDataSets(ds)

  const ms = getMetricSets()
  changed = false
  ms.forEach(m => { if (ids.includes(m.id) || ids.includes(String(m.id))) { m.status = 'approved'; changed = true } })
  if (changed) saveMetricSets(ms)
}

export function rejectItems (ids = [], reason = '') {
  const ds = getDataSets()
  let changed = false
  ds.forEach(d => { if (ids.includes(d.id) || ids.includes(String(d.id))) { d.status = 'rejected'; d.rejectReason = reason; changed = true } })
  if (changed) saveDataSets(ds)

  const ms = getMetricSets()
  changed = false
  ms.forEach(m => { if (ids.includes(m.id) || ids.includes(String(m.id))) { m.status = 'rejected'; m.rejectReason = reason; changed = true } })
  if (changed) saveMetricSets(ms)
}


export function getDataSetById(id) {
  const list = getDataSets();
  return list.find((d) => String(d.id) === String(id));
}

export function updateDataSet(id, patch = {}) {
  const list = getDataSets();
  const idx = list.findIndex((d) => String(d.id) === String(id));
  if (idx > -1) {
    list[idx] = {
      ...list[idx],
      ...patch,
      updateTime: patch.updateTime || new Date().toISOString(),
    };
    saveDataSets(list);
    return true;
  }
  return false;
}

// 数据集
export function loadDataSets() {
  try {
    const raw = localStorage.getItem(DS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function toDatasetOptions(list) {
  return (list || []).map((d) => ({
    label: d.name || d.datasetName || `数据集${d.id}`,
    value: d.id,
  }));
}

// 指标标准
export function saveStandards(list) {
  try {
    localStorage.setItem(STD_KEY, JSON.stringify(list || []));
  } catch {}
}
export function loadStandards() {
  try {
    const raw = localStorage.getItem(STD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function toStandardOptions(list) {
  return (list || []).map((s) => ({
    label: s.title || s.name || `指标${s.id}`,
    value: s.id,
  }));
}
