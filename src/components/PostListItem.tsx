import { Link } from 'react-router-dom'
import type { Post } from '../data/content'
import { PostMeta } from './PostMeta'

/** 文章列表项：首页「最新动态」与博客列表共用；博客列表额外显示标签。 */
export function PostListItem({ post, showTags = false }: { post: Post; showTags?: boolean }) {
  return (
    <Link className="post-item" to={`/blog/${post.slug}`}>
      <PostMeta className="post-meta" date={post.date} tags={showTags ? [] : post.tags} />
      <h3 className="post-title">{post.title}</h3>
      <p className="post-summary">{post.summary}</p>
      {showTags ? (
        <div className="post-tags">
          {post.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  )
}
