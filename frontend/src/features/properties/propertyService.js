
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

export const getMyProperties = async (params = {}) => {
  const response = await api.get('/properties/my-properties', { params })
  return response.data
}


export const updateProperty = async (id, propertyData) => {
  const response = await api.patch(`/properties/${id}`, propertyData)
  return response.data
}

export const deleteProperty = async (id) => {
  const response = await api.delete(`/properties/${id}`)
  return response.data
}

export const getFavorites = async () => {
  const response = await api.get('/favorites')
  return response.data
}

export const addFavorite = async (propertyId) => {
  const response = await api.post(`/favorites/${propertyId}`)
  return response.data
}

export const removeFavorite = async (propertyId) => {
  const response = await api.delete(`/favorites/${propertyId}`)
  return response.data
}

