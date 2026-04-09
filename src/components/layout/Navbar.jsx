import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/metrics', label: 'Live Metrics' },
  { to: '/', label: 'Play Ground' },
  { to: '/gallery', label: 'Gallery' },
]

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="text-white font-bold text-lg tracking-tight" onClick={closeMenu}>
            AI <span className="text-indigo-400">Image</span>
          </NavLink>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-1">
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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-400 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-30 bg-gray-950/95 backdrop-blur-md transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeMenu}
      >
        <div 
          className={`flex flex-col items-center justify-center h-full gap-6 transition-transform duration-300 ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                `text-2xl font-medium transition-colors px-6 py-3 rounded-lg ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}