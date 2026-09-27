import type { Project } from '../data/content'

/** 项目卡片：首页「精选项目」与项目作品页共用；有 href 时整卡可跳转。 */
export function ProjectCard({ project }: { project: Project }) {
  const content = (
    <>
      <div className="project-head">
        <div className="project-name">{project.name}</div>
        <div className="project-year">{project.year}</div>
      </div>
      <p className="project-summary">{project.summary}</p>
      <div className="tag-list">
        {project.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </>
  )

  if (!project.href) {
    return <div className="project-card">{content}</div>
  }

  return (
    <a className="project-card" href={project.href} target="_blank" rel="noreferrer noopener">
      {content}
    </a>
  )
}
