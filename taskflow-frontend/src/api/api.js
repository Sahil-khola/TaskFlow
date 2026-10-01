import axios from 'axios'

// Token httpOnly cookie me hai — JS ise dekh nahi sakta, isliye na localStorage
// na sessionStorage me kuch rakhna hai. Sirf cookie har request ke saath jaani chahiye.
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true, // bina iske browser cookie nahi bhejta
})

// Cookie expire/invalid ho gayi to user ko login page pe bhej do
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const isLogin = error.config?.url?.includes('/auth/login')
    if (status === 401 && !isLogin) {
      if (!window.location.pathname.includes('/login')) window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api