import { supabase } from './supabase.js'

/* ── QUERIES ── */

export async function getActiveTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, task_assignees(user_id, profiles(id, name, avatar_color))`)
    .neq('status', 'done')
    .order('last_edited_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function getTodayDoneTasks() {
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, task_assignees(user_id, profiles(id, name, avatar_color))`)
    .eq('status', 'done')
    .gte('completed_at', todayStart.toISOString())
    .order('completed_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getBacklogTasks() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, task_assignees(user_id, profiles(id, name, avatar_color))`)
    .eq('status', 'todo')
    .lt('task_date', today)
    .order('task_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getAllTasksForTimView({ assigneeIds = [], statuses = [], dateFrom = null, dateTo = null } = {}) {
  let query = supabase
    .from('tasks')
    .select(`*, task_assignees(user_id, profiles(id, name, avatar_color))`)
    .order('task_date', { ascending: false })

  if (statuses.length > 0) query = query.in('status', statuses)
  if (dateFrom) query = query.gte('task_date', dateFrom)
  if (dateTo)   query = query.lte('task_date', dateTo)

  const { data, error } = await query
  if (error) throw error
  let result = data || []

  if (assigneeIds.length > 0) {
    result = result.filter(t =>
      (t.task_assignees || []).some(a => assigneeIds.includes(a.user_id))
    )
  }
  return result
}

/* ── CRUD ── */

export async function createTask(taskData, assigneeIds, userId) {
  const now = new Date().toISOString()
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'med',
      created_by: userId,
      last_edited_by: userId,
      last_edited_at: now,
      task_date: taskData.task_date || new Date().toISOString().split('T')[0]
    })
    .select().single()
  if (error) throw error

  if (assigneeIds && assigneeIds.length > 0) {
    await supabase.from('task_assignees').insert(assigneeIds.map(uid => ({ task_id: task.id, user_id: uid })))
    // Notifications for assignees (skip creator)
    const notifs = assigneeIds
      .filter(uid => uid !== userId)
      .map(uid => ({
        user_id: uid,
        task_id: task.id,
        type: 'assigned',
        message: `Kamu di-assign ke task: "${task.title}"`,
        created_by: userId
      }))
    if (notifs.length) await supabase.from('notifications').insert(notifs)
  }
  return task
}

export async function updateTask(taskId, changes, userId) {
  const { data: oldTask } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  const now = new Date().toISOString()
  const updateData = { ...changes, last_edited_by: userId, last_edited_at: now }

  if (changes.status === 'done' && oldTask?.status !== 'done') updateData.completed_at = now
  if (changes.status && changes.status !== 'done' && oldTask?.status === 'done') updateData.completed_at = null

  const { data, error } = await supabase.from('tasks').update(updateData).eq('id', taskId).select().single()
  if (error) throw error

  if (oldTask) {
    const entries = []
    for (const [field, newVal] of Object.entries(changes)) {
      if (['last_edited_by','last_edited_at'].includes(field)) continue
      if (String(oldTask[field] ?? '') !== String(newVal)) {
        entries.push({ task_id: taskId, edited_by: userId, field_changed: field, old_value: String(oldTask[field] ?? ''), new_value: String(newVal) })
      }
    }
    if (entries.length) await supabase.from('task_history').insert(entries)
  }
  return data
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function updateAssignees(taskId, newAssigneeIds, userId, taskTitle = '') {
  const { data: existing } = await supabase.from('task_assignees').select('user_id').eq('task_id', taskId)
  const existingIds = (existing || []).map(r => r.user_id)
  const addedIds = newAssigneeIds.filter(id => !existingIds.includes(id))

  await supabase.from('task_assignees').delete().eq('task_id', taskId)
  if (newAssigneeIds.length) {
    await supabase.from('task_assignees').insert(newAssigneeIds.map(uid => ({ task_id: taskId, user_id: uid })))
  }
  // Notify newly added assignees
  if (addedIds.length) {
    const notifs = addedIds
      .filter(uid => uid !== userId)
      .map(uid => ({
        user_id: uid, task_id: taskId, type: 'assigned',
        message: `Kamu di-assign ke task: "${taskTitle}"`,
        created_by: userId
      }))
    if (notifs.length) await supabase.from('notifications').insert(notifs)
  }
}

export async function getTaskHistory(taskId) {
  const { data, error } = await supabase
    .from('task_history').select('*').eq('task_id', taskId).order('edited_at', { ascending: false })
  if (error) return []
  return data || []
}

/* ── NOTIFICATIONS ── */

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) return []
  return data || []
}

export async function markNotificationRead(notifId) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
}

export function subscribeToTasks(callback) {
  return supabase.channel('tasks_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, callback)
    .subscribe()
}

export function subscribeToNotifications(userId, callback) {
  return supabase.channel('notif_realtime')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

/* ── HELPERS ── */

export function calcOverdueDays(taskDate) {
  if (!taskDate) return 0
  const today = new Date(); today.setHours(0,0,0,0)
  const td = new Date(taskDate); td.setHours(0,0,0,0)
  return Math.floor((today - td) / (1000 * 60 * 60 * 24))
}
