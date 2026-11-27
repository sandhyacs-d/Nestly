
import { useEffect, useState } from 'react'
import { getProperties, getFavorites } from '../propertyService'
import FeaturedProperties from '../components/FeaturedProperties'
import { useAuth } from '../../../context/AuthContext'

function Home() {
  const { user, isAuthenticated } = useAuth()

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [favoriteIds, setFavoriteIds] = useState([])

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      setError('')

      try {
        const params = {
          limit: 6,
          page,
          sort,
        }

        if (location) params.location = location
        if (propertyType) params.propertyType = propertyType
        if (minPrice !== '') params.minPrice = minPrice
        if (maxPrice !== '') params.maxPrice = maxPrice

        const data = await getProperties(params)

        setProperties(data.properties)
        setPagination(data.pagination)
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load properties.'
        )
      } finally {
        setLoading(false)
      }

      if (isAuthenticated && user?.role === 'renter') {
        try {
          const favoriteData = await getFavorites()

          setFavoriteIds(
            favoriteData.data.favorites
              .map((favorite) => favorite.property?._id)
              .filter(Boolean)
          )
        } catch (err) {
          console.error('Failed to load favorites:', err)
        }
      } else {
        setFavoriteIds([])
      }
    }

    fetchProperties()
  }, [
    location,
    propertyType,
    minPrice,
    maxPrice,
    sort,
    page,
    isAuthenticated,
    user,
  ])

  useEffect(() => {
    setPage(1)
  }, [location, propertyType, minPrice, maxPrice, sort])

  const handleSearch = (e) => {
    e.preventDefault()
    setLocation(searchInput.trim())
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setLocation('')
    setPropertyType('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
  }

  const handleFavoriteChange = (propertyId, isFavorite) => {
    setFavoriteIds((current) =>
      isFavorite
        ? current.includes(propertyId)
          ? current
          : [...current, propertyId]
        : current.filter((id) => id !== propertyId)
    )
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <h1>Find a place you'll love to call home.</h1>

          <p>
            Discover rental spaces and find people you'd love to live with.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Where do you want to live?"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="property-filters">
        <div className="filter-group">
          <label htmlFor="propertyType">Property type</label>

          <select
            id="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="room">Room</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="minPrice">Min. price (Rs.)</label>

          <input
            id="minPrice"
            type="number"
            min="0"
            placeholder="Minimum"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="maxPrice">Max. price (Rs.)</label>

          <input
            id="maxPrice"
            type="number"
            min="0"
            placeholder="Maximum"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort">Sort by</label>

          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
          </select>
        </div>

        <button
          type="button"
          className="clear-filters"
          onClick={handleClearFilters}
        >
          Clear filters
        </button>
      </section>

      <FeaturedProperties
        properties={properties}
        loading={loading}
        error={error}
        favoriteIds={favoriteIds}
        onFavoriteChange={handleFavoriteChange}
      />

      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}

export default Home
