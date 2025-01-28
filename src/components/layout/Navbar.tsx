import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Sitemap Analyzer
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link to="/history" className="text-sm hover:text-blue-600">
                  Analysis History
                </Link>
                <div className="text-sm text-gray-500">
                  {user.email}
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
