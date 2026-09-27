import { Link } from 'react-router-dom'
import { PageSection } from '../components/PageSection'
import { usePageMeta } from '../hooks/usePageMeta'

export function NotFound() {
  usePageMeta('页面不存在', '你要找的页面不存在，可能已经被移动或删除。')

  return (
    <PageSection desc="Error" title="404">
      <p className="body-lead">你要找的页面不存在，可能已经被移动或删除了。</p>
      <div className="section-more">
        <Link to="/" className="btn btn-outline">
          返回首页
        </Link>
      </div>
    </PageSection>
  )
}
