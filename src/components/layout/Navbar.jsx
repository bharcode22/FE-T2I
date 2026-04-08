import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Play Ground' },
  { to: '/gallery', label: 'Gallery' },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="text-white font-bold text-lg tracking-tight">
          AI <span className="text-indigo-400">Image </span>
        </NavLink>

        {/* Links */}
        <ul className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
