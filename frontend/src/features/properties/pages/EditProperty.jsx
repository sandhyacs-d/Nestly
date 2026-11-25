
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getPropertyById,
  updateProperty
} from '../propertyService'

function EditProperty() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    kitchen: false,
    furnished: false,
    amenities: '',
    images: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)
        setError('')

        const property = await getPropertyById(id)

        setFormData({
          title: property.title || '',
          description: property.description || '',
          propertyType: property.propertyType || '',
          price: property.price ?? '',
          location: property.location || '',
          bedrooms: property.bedrooms ?? '',
          bathrooms: property.bathrooms ?? '',
          kitchen: property.kitchen ?? false,
          furnished: property.furnished ?? false,
          amenities: property.amenities?.join(', ') || '',
          images: property.images?.join(', ') || '',
        })
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Failed to load property details.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError('')

    const propertyData = {
      ...formData,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      amenities: formData.amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      images: formData.images
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    try {
      await updateProperty(id, propertyData)
      navigate(`/properties/${id}`)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to update property.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Loading property details...</p>
  }

  if (error && !formData.title) {
    return <p className="error-message">{error}</p>
  }

  return (
    <main className="create-property-page">
      <h1>Edit your property</h1>
      <p>Update your listing details.</p>

      <form className="property-form" onSubmit={handleSubmit}>
        <section>
          <h2>Basic information</h2>

          <label htmlFor="title">Property title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={100}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={1000}
          />
        </section>

        <section>
          <h2>Property details</h2>

          <label htmlFor="propertyType">Property type</label>
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            required
          >
            <option value="">Select property type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="room">Room</option>
            <option value="studio">Studio</option>
          </select>

          <label htmlFor="price">Monthly rent (Rs.)</label>
          <input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            min="0.01"
            max="10000000"
            step="any"
          />

          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={200}
          />

          <label htmlFor="bedrooms">Bedrooms</label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={handleChange}
            required
            min="1"
            step="1"
          />

          <label htmlFor="bathrooms">Bathrooms</label>
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            value={formData.bathrooms}
            onChange={handleChange}
            required
            min="1"
            step="1"
          />
        </section>

        <section>
          <h2>Features</h2>

          <label>
            <input
              type="checkbox"
              name="kitchen"
              checked={formData.kitchen}
              onChange={handleChange}
            />
            Kitchen available
          </label>

          <label>
            <input
              type="checkbox"
              name="furnished"
              checked={formData.furnished}
              onChange={handleChange}
            />
            Furnished
          </label>

          <label htmlFor="amenities">Amenities</label>
          <input
            id="amenities"
            name="amenities"
            type="text"
            value={formData.amenities}
            onChange={handleChange}
            placeholder="WiFi, Parking, Water"
          />

          <label htmlFor="images">Image URLs</label>
          <textarea
            id="images"
            name="images"
            value={formData.images}
            onChange={handleChange}
            placeholder="Enter image URLs separated by commas"
          />
        </section>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Saving changes...' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}

export default EditProperty
