
import api from '../../services/api'

export const getProperties = async (params = {}) => {
  const response = await api.get('/properties', { params })
  return response.data
}

export const getPropertyById = async (id) => {
  const response = await api.get(`/properties/${id}`)
  return response.data
}

export const createProperty = async (propertyData) => {
  const response = await api.post('/properties', propertyData)
  return response.data
}
