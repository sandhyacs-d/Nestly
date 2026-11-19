
function PropertyCard({ property }) {
  const formattedPrice = Number(property.price).toLocaleString('en-IN')

  return (
    <article className="property-card">
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

        <p className="property-location">
          {property.location}
        </p>

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
    </article>
  )
}

export default PropertyCard
