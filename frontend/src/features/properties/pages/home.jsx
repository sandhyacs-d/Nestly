
import { useEffect, useState } from 'react'
import { getProperties } from '../propertyService'
import FeaturedProperties from '../components/FeaturedProperties'

function Home() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties({ limit: 6, sort: 'newest' })
        setProperties(data.properties)
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load properties.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <h1>Find a place you'll love to call home.</h1>

          <p>
            Discover rental spaces and find people you'd love to live with.
          </p>

          <div className="hero-search">
            <input
              type="text"
              placeholder="Where do you want to live?"
            />

            <button type="button">
              Search
            </button>
          </div>
        </div>
      </section>

      <FeaturedProperties
        properties={properties}
        loading={loading}
        error={error}
      />
    </main>
  )
}

export default Home
