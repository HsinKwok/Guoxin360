import { PageSection } from '../components/PageSection'
import { usePageMeta } from '../hooks/usePageMeta'
import { useContent } from '../hooks/useContent'

export function Skills() {
  const { skillGroups, toolchain } = useContent().content
  usePageMeta('技能', '常用的技术栈与工具链，以及各项技能的熟练程度。')

  return (
    <>
      <PageSection desc="Skills" title="技能">
        <p className="body-lead">
          下面是我日常真正在用的技术栈。百分比只代表我对自己熟练度的主观判断，用来区分「写过」和「敢在生产环境用」。
        </p>
        <div className="skill-groups">
          {skillGroups.map((group) => (
            <div className="skill-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((item) => (
                <div className="skill-item" key={item.name}>
                  <div className="skill-item-top">
                    <span>{item.name}</span>
                    <span>{item.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <i style={{ width: `${item.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection desc="Toolchain" title="工具链">
        <p className="body-lead">日常开发中反复用到的工具与依赖。</p>
        <div className="tool-list">
          {toolchain.map((tool) => (
            <span className="tool" key={tool}>
              {tool}
            </span>
          ))}
        </div>
      </PageSection>
    </>
  )
}
