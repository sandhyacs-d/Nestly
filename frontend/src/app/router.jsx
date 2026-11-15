
import { Routes, Route } from 'react-router-dom'

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<h1>Welcome to Nestly</h1>}
      />
    </Routes>
  )
}

export default AppRouter
