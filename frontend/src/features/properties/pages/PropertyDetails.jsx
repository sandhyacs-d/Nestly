import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPropertyById } from '../propertyService'

function PropertyDetails() {
  const { id } = useParams()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(id)
        setProperty(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load property.')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

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
          <span>{property.kitchen ? 'Kitchen available' : 'No kitchen'}</span>
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