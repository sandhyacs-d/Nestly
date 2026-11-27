
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyProperties,
  updateProperty,
  deleteProperty,
} from '../propertyService'
import './OwnerDashboard.css'

const PAGE_SIZE = 5

function OwnerDashboard() {
  const [properties, setProperties] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchMyProperties = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getMyProperties({
          page,
          limit: PAGE_SIZE,
        })

        setProperties(data.properties)
        setPagination(data.pagination)
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Failed to load your properties.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMyProperties()
  }, [page, refreshKey])

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      setUpdatingStatusId(propertyId)
      setError('')
      setSuccess('')

      await updateProperty(propertyId, { status: newStatus })

      setProperties((previousProperties) =>
        previousProperties.map((property) =>
          property._id === propertyId
            ? { ...property, status: newStatus }
            : property
        )
      )

      setSuccess('Property status updated successfully.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to update property status.'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleDelete = async (propertyId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this property? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      setDeletingId(propertyId)
      setError('')
      setSuccess('')

      await deleteProperty(propertyId)

      setSuccess('Property deleted successfully.')

      // Move back if the deleted property was the only item on this page.
      if (properties.length === 1 && page > 1) {
        setPage((previousPage) => previousPage - 1)
      } else {
        setRefreshKey((previousKey) => previousKey + 1)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to delete property.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <main className="owner-dashboard">
        <p>Loading your properties...</p>
      </main>
    )
  }

  return (
    <main className="owner-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>My Properties</h1>
          <p>Manage and track your property listings.</p>
        </div>

        <Link
          to="/properties/new"
          className="add-property-link"
        >
          + Add New Property
        </Link>
      </header>

      {error && (
        <p className="error-message">{error}</p>
      )}

      {success && (
        <p className="success-message">{success}</p>
      )}

      <div className="dashboard-summary">
        <div className="summary-card">
          <span>Total Listings</span>
          <h2>{pagination?.totalProperties ?? properties.length}</h2>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="empty-properties">
          <h2>No properties listed yet</h2>
          <p>Start by adding your first rental property.</p>

          <Link to="/properties/new" className="add-property-link">
            Add a Property
          </Link>
        </div>
      ) : (
        <>
          <div className="owner-properties-list">
            {properties.map((property) => (
              <article
                className="owner-property-card"
                key={property._id}
              >
                <div className="property-card-header">
                  <h2>{property.title}</h2>

                  <span className={`property-status ${property.status}`}>
                    {property.status}
                  </span>
                </div>

                <div className="property-card-details">
                  <p>
                    <strong>Location:</strong> {property.location}
                  </p>

                  <p>
                    <strong>Rent:</strong> Rs. {property.price} / month
                  </p>
                </div>

                <div className="property-status-control">
                  <label htmlFor={`status-${property._id}`}>
                    Listing Status
                  </label>

                  <select
                    id={`status-${property._id}`}
                    value={property.status}
                    onChange={(e) =>
                      handleStatusChange(property._id, e.target.value)
                    }
                    disabled={updatingStatusId === property._id}
                  >
                    <option value="active">Active</option>
                    <option value="rented">Rented</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  {updatingStatusId === property._id && (
                    <span className="status-loading">
                      Updating...
                    </span>
                  )}
                </div>

                <div className="property-card-actions">
                  <Link to={`/properties/${property._id}/edit`}>
                    Edit Property
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(property._id)}
                    disabled={deletingId === property._id}
                  >
                    {deletingId === property._id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="dashboard-pagination">
              <button
                type="button"
                onClick={() => setPage((previousPage) => previousPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((previousPage) => previousPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {pagination && (
        <p className="dashboard-total">
          Showing {properties.length} properties · Total listings:{' '}
          {pagination.totalProperties}
        </p>
      )}
    </main>
  )
}

export default OwnerDashboard
