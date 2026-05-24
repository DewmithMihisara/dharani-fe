import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Logo from '../components/Logo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }
    setError('')
    navigate('/app')
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

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-center text-red-600">{error}</p>
            )}

            <div className="mt-2">
              <Button type="submit" fullWidth>
                Sign In
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
