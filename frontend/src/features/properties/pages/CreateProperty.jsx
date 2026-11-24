import { useState } from 'react'
import { createProperty } from '../propertyService'
import { useNavigate } from 'react-router-dom'

function CreateProperty() {
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

    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        setFormData((previousData) => ({
            ...previousData,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)
        setError('')
        setSuccess('')

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
            const data = await createProperty(propertyData)
            navigate(`/properties/${data.property._id}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create property.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="create-property-page">
            <h1>List your property</h1>
            <p>Share your space with people looking for a place to call home.</p>

            <form className="property-form" onSubmit={handleSubmit}>
                {/* Basic information */}
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

                {/* Property details */}
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

                {/* Features */}
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
                {success && <p className="success-message">{success}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating listing...' : 'Create listing'}
                </button>

            </form>
        </main>
    )
}

export default CreateProperty