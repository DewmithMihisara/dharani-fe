import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Logo from '../components/Logo'
import { apiPost } from '../api/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await apiPost('/auth/login', { userName: username, password })
      if (data.status === 200) {
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        navigate('/app')
      } else {
        setError(data.message || 'Login failed. Please try again.')
      }
    } catch {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e5e5e5] px-4">
      <div className="w-full max-w-sm">

        <Card className="px-10 py-10">
          <div className="flex flex-col items-center mb-8">
            <Logo />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Username"
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#222]">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#000] placeholder-[#bbb] focus:outline-none focus:border-[#14213d] transition-colors duration-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#14213d] transition-colors duration-100 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-center text-red-600">{error}</p>
            )}

            <div className="mt-2">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs mt-5 text-[#aaa]">
          © 2025 Dharani Ceylon Furnitures
        </p>
      </div>
    </div>
  )
}
