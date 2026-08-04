import { useNavigate } from 'react-router-dom'
import { MdErrorOutline } from 'react-icons/md'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <MdErrorOutline className="text-gray-600 mx-auto mb-4" size={64} />
        <h1 className="text-6xl font-bold text-gray-700 mb-2">404</h1>
        <p className="text-gray-400 text-lg mb-1">Page not found</p>
        <p className="text-gray-600 text-sm mb-8">
          The page you're looking for doesn't exist.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary px-6 py-2.5">
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
