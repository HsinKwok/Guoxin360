import { PageSection } from '../components/PageSection'
import { PostListItem } from '../components/PostListItem'
import { usePageMeta } from '../hooks/usePageMeta'
import { useContent } from '../hooks/useContent'

export function Blog() {
  const { posts } = useContent().content
  usePageMeta('博客', '技术复盘、项目笔记和偶尔的随笔。')

  return (
    <PageSection desc="Blog" title="博客">
      <div className="post-list">
        {posts.map((post) => (
          <PostListItem post={post} showTags key={post.slug} />
        ))}
      </div>
    </PageSection>
  )
}
