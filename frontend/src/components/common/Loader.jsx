export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent
                      rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  )
}
