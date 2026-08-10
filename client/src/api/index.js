import axios from 'axios';

// Get base URL from env if available, otherwise assume it's running on the same domain
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
