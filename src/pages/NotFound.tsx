import { Link } from 'react-router-dom'
import { PageSection } from '../components/PageSection'
import { usePageMeta } from '../hooks/usePageMeta'

/** 404 页的标题与描述：/404 路由与文章详情未命中时共用，保证两处写入一致。 */
export const NOT_FOUND_META = {
  title: '页面不存在',
  description: '你要找的页面不存在，可能已经被移动或删除。',
}

export function NotFound() {
  usePageMeta(NOT_FOUND_META.title, NOT_FOUND_META.description)

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
