/** 「标题 + 描述」卡片组：首页「核心方向」与关于我「原则卡片」共用。 */
export function FeatureGrid({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="feature-grid">
      {items.map((item) => (
        <div className="feature-card" key={item.title}>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </div>
      ))}
    </div>
  )
}
