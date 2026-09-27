import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLinks, useSite } from '../hooks/useContent'

export function Header() {
  const site = useSite()
  const links = useLinks()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="header">
      <div className="container">
        <div className="logo-box">
          <Link to="/" className="logo-title">
            {site.brand}
            <span className="logo-sub">{site.nameEn}</span>
          </Link>

          <nav className="nav-right">
            {links.actions.map((action) => (
              <Link key={action.to} to={action.to}>
                {action.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            id="icon-menu"
            className={menuOpen ? 'active' : undefined}
            aria-label="切换导航菜单"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          />
        </div>

        <nav className={menuOpen ? 'navigation active' : 'navigation'}>
          {links.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
