import { Link } from 'react-router-dom'
import { FeatureGrid } from '../components/FeatureGrid'
import { Markdown } from '../components/Markdown'
import { PageSection } from '../components/PageSection'
import { PostListItem } from '../components/PostListItem'
import { ProjectCard } from '../components/ProjectCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useContent } from '../hooks/useContent'

export function Home() {
  const { site, features, projects, posts } = useContent().content
  usePageMeta('')

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url("${site.cover}")` }} />
        <div className="container hero-inner">
          <img className="hero-avatar" src={site.avatar} alt={site.name} />
          <div className="hero-text">
            <div className="hero-hello">Hello, I am</div>
            <h1 className="hero-name">
              {site.name}
              <span>{site.nameEn}</span>
            </h1>
            <div className="hero-role">{site.role}</div>
            <p className="hero-tagline">{site.tagline}</p>
            <Markdown className="hero-intro" source={site.intro} />
            <div className="hero-actions">
              <Link to="/projects" className="btn btn-primary">
                查看作品
              </Link>
              <Link to="/contact" className="btn btn-ghost">
                联系我
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageSection desc="Focus" title="核心方向">
        <FeatureGrid items={features} />
      </PageSection>

      <PageSection desc="Selected Works" title="精选项目">
        <div className="project-grid">
          {projects.slice(0, 3).map((project) => (
            <ProjectCard project={project} key={project.slug} />
          ))}
        </div>
        <div className="section-more">
          <Link to="/projects" className="btn btn-outline">
            查看全部作品
          </Link>
        </div>
      </PageSection>

      <PageSection desc="Blog" title="最新动态">
        <div className="post-list">
          {posts.slice(0, 3).map((post) => (
            <PostListItem post={post} key={post.slug} />
          ))}
        </div>
        <div className="section-more">
          <Link to="/blog" className="btn btn-outline">
            阅读全部文章
          </Link>
        </div>
      </PageSection>
    </>
  )
}
