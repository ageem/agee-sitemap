import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sitemap Analyzer Dashboard</h1>
        <Button variant="outline" onClick={signOut}>Sign Out</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Analyze New Sitemap</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Email: {user?.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
