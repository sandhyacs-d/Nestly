import { Routes, Route } from 'react-router-dom'
import Login from '../features/auth/login.jsx'
import Register from '../features/auth/Register.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import PublicRoute from '../components/common/PublicRoute.jsx'
import Home from '../features/properties/pages/home.jsx'
import PropertyDetails from '../features/properties/pages/PropertyDetails'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/properties/:id" element={<PropertyDetails />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <h1>Dashboard</h1>
          </ProtectedRoute>
        }
      />

    </Routes>
  )
}

export default AppRouter