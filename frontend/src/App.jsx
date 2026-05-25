import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login     from './pages/Login.jsx'
import Register  from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyItems   from './pages/MyItems.jsx'
import AddItem   from './pages/AddItem.jsx'
import Search    from './pages/Search.jsx'

function PrivateRoute({ children }) {
  return localStorage.getItem('token')
    ? children
    : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/items"  element={<PrivateRoute><MyItems /></PrivateRoute>} />
        <Route path="/add"    element={<PrivateRoute><AddItem /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
