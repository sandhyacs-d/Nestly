
import PropertyCard from './PropertyCard'

function FeaturedProperties({
  properties,
  loading,
  error,
  favoriteIds = [],
  onFavoriteChange,
}) {
  if (loading) {
    return <p className="loading-message">Loading properties...</p>
  }

  if (error) {
    return <p className="error-message">{error}</p>
  }

  if (!properties || properties.length === 0) {
    return (
      <section className="featured-properties">
        <h2>Available Properties</h2>
        <p>No properties available at the moment.</p>
      </section>
    )
  }

  return (
    <section className="featured-properties">
      <h2>Available Properties</h2>

      <div className="property-grid">
        {properties.map((property) => (
          <PropertyCard
            key={property._id}
            property={property}
            isFavorite={favoriteIds.includes(property._id)}
            onFavoriteChange={onFavoriteChange}
          />
        ))}
      </div>
    </section>
  )
}

export default FeaturedProperties
