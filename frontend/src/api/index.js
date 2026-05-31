import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000' })

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (d)    => API.post('/auth/register', d)
export const login    = (d)    => API.post('/auth/login', d)

// Items
export const logItem    = (d)       => API.post('/log_item', d)
export const searchItem = (name)    => API.get(`/search_item/${name}`)
export const updateItem = (name, d) => API.put(`/update_item/${name}`, d)
export const deleteItem = (name)    => API.delete(`/delete_item/${name}`)
export const allItems   = ()        => API.get('/all_items')

// History
export const itemHistory = (name) => API.get(`/item_history/${name}`)
export const allHistory  = ()     => API.get('/all_history')

// AI Detection
export const detectionHistory = () => API.get('/detection_history')