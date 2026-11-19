
import api from '../../services/api'

export const getProperties = async (params = {}) => {
  const response = await api.get('/properties', { params })
  return response.data
}
