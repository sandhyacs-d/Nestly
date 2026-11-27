
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFavorites, removeFavorite } from '../propertyService'

function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await getFavorites()
        setFavorites(data.data.favorites)
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load favorites.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  const handleRemove = async (propertyId) => {
    try {
      setRemovingId(propertyId)
      await removeFavorite(propertyId)

      setFavorites((current) =>
        current.filter(
          (favorite) => favorite.property?._id !== propertyId
        )
      )
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to remove favorite.'
      )
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return <p>Loading favorites...</p>
  }

  return (
    <main className="favorites-page">
      <div className="favorites-header">
        <h1>My Favorites</h1>
        <p>Your saved properties, all in one place.</p>
      </div>

      {error && <p className="error-message">{error}</p>}

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <h2>No favorites yet</h2>
          <p>Explore properties and save the ones you like.</p>
          <Link to="/">Explore properties</Link>
        </div>
      ) : (
        <div className="property-grid">
          {favorites.map((favorite) => {
            const property = favorite.property

            if (!property) return null

            return (
              <div className="favorite-card" key={favorite._id}>
                <Link
                  to={`/properties/${property._id}`}
                  className="favorite-property-link"
                >
                  <h3>{property.title}</h3>
                  <p>{property.location}</p>
                  <p>
                    Rs. {Number(property.price).toLocaleString('en-IN')}
                    {' / month'}
                  </p>
                </Link>

                <button
                  type="button"
                  onClick={() => handleRemove(property._id)}
                  disabled={removingId === property._id}
                >
                  {removingId === property._id
                    ? 'Removing...'
                    : 'Remove'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default Favorites
