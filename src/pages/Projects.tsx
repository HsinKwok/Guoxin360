import { EmptyHint, PageSection } from '../components/PageSection'
import { ProjectCard } from '../components/ProjectCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useContent } from '../hooks/useContent'

export function Projects() {
  const { projects } = useContent().content
  usePageMeta('项目作品', '自己做过的项目、小工具与实验性尝试。')

  return (
    <PageSection desc="Works" title="项目作品">
      <p className="body-lead">
        这里放我自己从零做完的项目。它们大多解决的是我自己的问题，所以能一直维护下去。
      </p>
      {projects.length > 0 ? (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard project={project} key={project.slug} />
          ))}
        </div>
      ) : (
        <EmptyHint>还没有发布任何项目。</EmptyHint>
      )}
    </PageSection>
  )
}
