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
      <span>{date}</span>
      <span>·</span>
      <span>{tags.join(' / ')}</span>
    </div>
  )
}
