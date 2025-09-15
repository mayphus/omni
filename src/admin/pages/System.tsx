import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export function System() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">System</h2>
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm">
            <li>App: tongmeng-plant (admin)</li>
            <li>Mode: development/production</li>
            <li>Runtime: React 18</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

