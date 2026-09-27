/** 文章元信息：日期 · 标签。列表页与详情页共用，靠 className 区分样式。 */
export function PostMeta({
  date,
  tags,
  className,
}: {
  date: string
  tags: string[]
  className: string
}) {
  return (
    <div className={className}>
      {date ? <span>{date}</span> : null}
      {date && tags.length > 0 ? <span>·</span> : null}
      {tags.length > 0 ? <span>{tags.join(' / ')}</span> : null}
    </div>
  )
}
