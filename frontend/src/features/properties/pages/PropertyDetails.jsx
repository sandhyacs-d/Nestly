
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  getPropertyById,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../propertyService'

function PropertyDetails() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')

  const canFavorite = isAuthenticated && user?.role === 'renter'

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await getPropertyById(id)
        setProperty(data)
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load property.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  useEffect(() => {
    if (!canFavorite) {
      setIsFavorite(false)
      return
    }

    const fetchFavoriteStatus = async () => {
      setFavoriteError('')

      try {
        const data = await getFavorites()

        const isSaved = data.data.favorites.some(
          (favorite) => favorite.property?._id === id
        )

        setIsFavorite(isSaved)
      } catch (err) {
        console.error('Failed to load favorite status:', err)
        setFavoriteError('Could not load favorite status.')
      }
    }

    fetchFavoriteStatus()
  }, [id, canFavorite])

  const handleFavorite = async () => {
    if (!canFavorite || favoriteLoading) return

    setFavoriteLoading(true)
    setFavoriteError('')

    try {
      if (isFavorite) {
        await removeFavorite(id)
        setIsFavorite(false)
      } else {
        await addFavorite(id)
        setIsFavorite(true)
      }
    } catch (err) {
      setFavoriteError(
        err.response?.data?.message || 'Could not update favorite.'
      )
    } finally {
      setFavoriteLoading(false)
    }
  }

  if (loading) {
    return <p>Loading property details...</p>
  }

  if (error) {
    return <p className="error-message">{error}</p>
  }

  if (!property) {
    return <p>Property not found.</p>
  }

  return (
    <main className="property-details-page">
      <div className="property-details-header">
        <div>
          <p className="property-details-location">{property.location}</p>
          <h1>{property.title}</h1>
        </div>

        <p className="property-details-price">
          Rs. {Number(property.price).toLocaleString('en-IN')} / month
        </p>
      </div>

      {canFavorite && (
        <div className="property-details-favorite">
          <button
            type="button"
            onClick={handleFavorite}
            disabled={favoriteLoading}
            aria-label={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            {favoriteLoading
              ? 'Saving...'
              : isFavorite
                ? '♥ Saved'
                : '♡ Save property'}
          </button>

          {favoriteError && (
            <p className="error-message">{favoriteError}</p>
          )}
        </div>
      )}

      <section className="property-details-gallery">
        {property.images?.length > 0 ? (
          property.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${property.title} ${index + 1}`}
            />
          ))
        ) : (
          <div className="property-details-placeholder">
            No images available
          </div>
        )}
      </section>

      <section className="property-details-content">
        <div className="property-details-main">
          <h2>About this property</h2>
          <p>{property.description}</p>

          <div className="property-details-specs">
            <div>
              <strong>{property.bedrooms}</strong>
              <span>Bedrooms</span>
            </div>

            <div>
              <strong>{property.bathrooms}</strong>
              <span>Bathrooms</span>
            </div>

            <div>
              <strong>{property.propertyType}</strong>
              <span>Property type</span>
            </div>
          </div>

          <h2>Features</h2>

          <div className="property-details-features">
            <span>{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
            <span>
              {property.kitchen ? 'Kitchen available' : 'No kitchen'}
            </span>
          </div>

          {property.amenities?.length > 0 && (
            <>
              <h2>Amenities</h2>
              <ul className="property-amenities">
                {property.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default PropertyDetails
