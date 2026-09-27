import { Link, useParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { PageSection } from '../components/PageSection'
import { PostMeta } from '../components/PostMeta'
import { usePageMeta } from '../hooks/usePageMeta'
import { useContent } from '../hooks/useContent'
import { NotFound, NOT_FOUND_META } from './NotFound'

export function Post() {
  const { posts } = useContent().content
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find((item) => item.slug === slug)

  usePageMeta(
    post ? post.title : NOT_FOUND_META.title,
    post ? post.summary : NOT_FOUND_META.description,
  )

  if (!post) {
    return <NotFound />
  }

  return (
    <PageSection desc="Article" title="文章">
      <h1 className="article-title">{post.title}</h1>
      <PostMeta className="article-meta" date={post.date} tags={post.tags} />

      <div className="article-content">
        <Markdown source={post.content} />
      </div>

      <Link to="/blog" className="back-link">
        ← 返回博客列表
      </Link>
    </PageSection>
  )
}
