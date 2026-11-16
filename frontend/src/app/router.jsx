
import { Routes, Route } from 'react-router-dom'
import Login from '../features/auth/login.jsx'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<h1>Welcome to Nestly</h1>} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default AppRouter

