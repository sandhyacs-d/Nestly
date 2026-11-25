
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyProperties } from '../propertyService'

function OwnerDashboard() {
  const [properties, setProperties] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMyProperties = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getMyProperties()

        setProperties(data.properties)
        setPagination(data.pagination)
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Failed to load your properties.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMyProperties()
  }, [])

  if (loading) return <p>Loading your properties...</p>
  if (error) return <p>{error}</p>

  return (
    <main className="owner-dashboard">
      <h1>My Properties</h1>
      <p>Manage your property listings.</p>

      <Link to="/properties/new">
        Add a new property
      </Link>

      {properties.length === 0 ? (
        <p>You haven't listed any properties yet.</p>
      ) : (
        <div className="owner-properties-list">
          {properties.map((property) => (
            <article key={property._id}>
              <h2>{property.title}</h2>
              <p>{property.location}</p>
              <p>Rs. {property.price} / month</p>
              <p>Status: {property.status}</p>

              <Link to={`/properties/${property._id}/edit`}>
                Edit property
              </Link>
            </article>
          ))}
        </div>
      )}

      {pagination && (
        <p>Total listings: {pagination.totalProperties}</p>
      )}
    </main>
  )
}

export default OwnerDashboard
