import { Outlet } from 'react-router-dom'

export default function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
