
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { addFavorite, removeFavorite } from '../propertyService'

function PropertyCard({
  property,
  isFavorite,
  onFavoriteChange,
}) {
  const { user, isAuthenticated } = useAuth()

  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')

  const formattedPrice = Number(property.price).toLocaleString('en-IN')

  const canFavorite = isAuthenticated && user?.role === 'renter'

  const handleFavorite = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!canFavorite || favoriteLoading) return

    setFavoriteLoading(true)
    setFavoriteError('')

    try {
      if (isFavorite) {
        await removeFavorite(property._id)
        onFavoriteChange(property._id, false)
      } else {
        await addFavorite(property._id)
        onFavoriteChange(property._id, true)
      }
    } catch (err) {
      setFavoriteError(
        err.response?.data?.message || 'Could not update favorite.'
      )
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <div className="property-card">
      <Link to={`/properties/${property._id}`} className="property-card-link">
        <div className="property-image">
          {property.images?.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              loading="lazy"
            />
          ) : (
            <div className="property-image-placeholder">
              <span>{property.propertyType}</span>
            </div>
          )}
        </div>

        <div className="property-card-content">
          <h3>{property.title}</h3>

          <p className="property-location">{property.location}</p>

          <p className="property-price">
            Rs. {formattedPrice} <span>/ month</span>
          </p>

          <div className="property-details">
            <span>{property.bedrooms} bed</span>
            <span>{property.bathrooms} bath</span>
            <span>{property.propertyType}</span>
          </div>

          <div className="property-features">
            {property.furnished && <span>Furnished</span>}
            {property.kitchen && <span>Kitchen</span>}
          </div>
        </div>
      </Link>

      {canFavorite && (
        <div className="property-card-favorite">
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
                : '♡ Save'}
          </button>

          {favoriteError && (
            <p className="error-message">{favoriteError}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default PropertyCard
