import { Link } from 'react-router-dom'
import { FeatureGrid } from '../components/FeatureGrid'
import { Markdown } from '../components/Markdown'
import { PageSection } from '../components/PageSection'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useContent'

export function About() {
  const site = useSite()
  usePageMeta('关于我', `关于 ${site.name}：${site.role}，${site.tagline}。`)

  return (
    <PageSection desc="About" title="关于我">
      <Markdown className="body-lead" source={site.about} />

      <FeatureGrid items={site.principles} />

      <div className="section-more">
        <Link to="/contact" className="btn btn-outline">
          聊聊合作
        </Link>
      </div>
    </PageSection>
  )
}
