
import PropertyCard from './PropertyCard'

function FeaturedProperties({ properties, loading, error }) {
  return (
    <section className="featured-properties">
      <div className="section-header">
        <h2>Explore available properties</h2>
        <p>Find a space that fits your lifestyle.</p>
      </div>

      {loading && <p>Loading properties...</p>}

      {!loading && error && <p className="error-message">{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <p>No properties available at the moment.</p>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="property-grid">
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default FeaturedProperties
