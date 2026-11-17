
import { Routes, Route } from 'react-router-dom'
import Login from '../features/auth/login.jsx'
import Register from '../features/auth/Register.jsx'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<h1>Home</h1>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default AppRouter

