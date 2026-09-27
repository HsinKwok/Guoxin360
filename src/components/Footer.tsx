import { Link } from 'react-router-dom'
import { Markdown } from './Markdown'
import { useLinks, useSite } from '../hooks/useContent'

export function Footer() {
  const site = useSite()
  const links = useLinks()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-top-inner">
          <div className="friendly-warp">
            <div className="tit">站点导航</div>
            <div className="friendly-box">
              {links.nav.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
              {links.socials.map((item) => (
                <a key={item.href} href={item.href} target="_blank" rel="noreferrer noopener">
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="about">
            <div className="tit">关于本站</div>
            <Markdown className="cont" source={site.footerAbout} />
            <Link to="/about" className="more">
              <span>more</span> &gt;
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-center">
        {site.role ? <span>{site.role}</span> : null}
        {site.role && site.location ? <span>·</span> : null}
        {site.location ? <span>{site.location}</span> : null}
        {(site.role || site.location) && site.email ? <span>·</span> : null}
        {site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}
      </div>

      <div className="footer-bom">
        <span>
          © {year}
          {site.name ? <> {site.name}</> : null}
          {site.domain ? <> · {site.domain}</> : null}
        </span>
      </div>
    </footer>
  )
}
