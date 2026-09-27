/**
 * 内容读写：D1 里只存被后台改过的分区，其余回退到代码内置的默认值。
 */

import { defaultContent, isContentSection, type ContentSection, type SiteContent } from '../data/defaults'
import { deleteKey, upsertJson } from './db'

interface ContentRow {
  key: string
  value: string
}

export async function loadContent(db: D1Database): Promise<SiteContent> {
  const { results } = await db.prepare('SELECT key, value FROM content').all<ContentRow>()
  const content = { ...defaultContent } as unknown as Record<string, unknown>

  for (const row of results) {
    if (!isContentSection(row.key)) continue

    let stored: unknown
    try {
      stored = JSON.parse(row.value)
    } catch {
      // 数据损坏时跳过该行，仍然回退到内置默认值
      continue
    }

    const repaired = repairSection(row.key, stored)
    content[row.key] = repaired

    // 存量残缺数据在读取时自愈并回写，避免每次请求都重复修复
    if (!matchesSectionShape(row.key, stored)) {
      try {
        await upsertJson(db, 'content', row.key, repaired)
      } catch (error) {
        console.error('[content] 自愈回写失败', row.key, error)
      }
    }
  }

  return content as unknown as SiteContent
}

export async function saveSection(
  db: D1Database,
  section: ContentSection,
  value: unknown,
): Promise<void> {
  await upsertJson(db, 'content', section, value)
}

export async function resetSection(db: D1Database, section: ContentSection): Promise<void> {
  await deleteKey(db, 'content', section)
}

/**
 * 各分区数组元素里允许缺省的字段，须与类型定义上的 `?` 可选属性保持一致。
 * 深度校验默认要求对象字段齐全，只有这里列出的字段可以缺失（如 Project.href）。
 */
const OPTIONAL_ITEM_KEYS: Partial<Record<ContentSection, readonly string[]>> = {
  projects: ['href'],
}

/**
 * 按内置默认值比对形态：对象分区的每个字段都必须存在，且字段形态递归一致；
 * 数组分区的元素也按同样规则逐个递归比对。
 * 防止 `{}`、`[null]`、`[{ tags: 1 }]` 这类数据通过外层类型检查后把整个分区写坏，
 * 导致前台渲染报错（例如 `project.tags.map`）。
 */
export function matchesSectionShape(section: ContentSection, value: unknown): boolean {
  const template = defaultContent[section]
  // 数组分区：把「允许缺省的字段」下传到元素对象那一层
  if (Array.isArray(template) && template.length > 0) {
    if (!Array.isArray(value)) return false
    const optional = OPTIONAL_ITEM_KEYS[section] ?? []
    return value.every((item) => matchesShape(item, template[0], optional))
  }
  return matchesShape(value, template)
}

/** 只比对最外层的形态（数组 / 对象 / 标量类型），不递归字段。 */
function sameKind(value: unknown, template: unknown): boolean {
  if (Array.isArray(template)) return Array.isArray(value)
  if (template !== null && typeof template === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
  }
  return typeof value === typeof template
}

/**
 * 把存量数据修复成与默认值同形（读取时自愈）。
 * - 对象分区（站点信息、链接）属于设置：缺失 / 类型不符的字段回填内置默认值；
 * - 数组元素属于用户内容：只用「同类型空值」补齐，绝不回填示例数据；
 * - 数组元素形态完全不符（如 null）时直接丢弃，避免前台取字段时报错。
 */
export function repairSection(section: ContentSection, value: unknown): unknown {
  const template = defaultContent[section]
  return repair(value, template, !Array.isArray(template))
}

/**
 * @param useDefaults 缺失 / 类型不符时是否回填模板里的真实默认值。
 *   仅对象分区为 true；一旦进入数组元素就固定为 false。
 */
function repair(value: unknown, template: unknown, useDefaults: boolean): unknown {
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return useDefaults ? template : []
    const sample = template[0]
    if (sample === undefined) return []
    // 元素一律按「用户内容」处理，不回填样例值
    return value
      .filter((item) => sameKind(item, sample))
      .map((item) => repair(item, sample, false))
  }

  if (template !== null && typeof template === 'object') {
    const templateRecord = template as Record<string, unknown>
    const source = sameKind(value, template) ? (value as Record<string, unknown>) : {}
    const result: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(templateRecord)) {
      result[key] = key in source ? repair(source[key], child, useDefaults) : fillMissing(child, useDefaults)
    }
    return result
  }

  if (typeof value === typeof template) return value
  return useDefaults ? template : emptyLike(template)
}

/** 缺失字段的回填值：设置类分区用模板默认值，用户内容用同类型空值。 */
function fillMissing(template: unknown, useDefaults: boolean): unknown {
  return useDefaults ? template : emptyLike(template)
}

/** 与模板同类型的空值（字符串 ''、数字 0、布尔 false、数组 []、对象递归空值）。 */
function emptyLike(template: unknown): unknown {
  if (Array.isArray(template)) return []
  if (template !== null && typeof template === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(template as Record<string, unknown>)) {
      result[key] = emptyLike(child)
    }
    return result
  }
  if (typeof template === 'number') return 0
  if (typeof template === 'boolean') return false
  return ''
}

/**
 * 递归比对形态。
 * @param optionalKeys 仅作用于当前这一层对象：这些字段允许缺失，其余字段必须存在。
 */
function matchesShape(
  value: unknown,
  template: unknown,
  optionalKeys: readonly string[] = [],
): boolean {
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return false
    const sample = template[0]
    // 元素也递归比对，避免 [null] / [{}] 这类数据把前台渲染打崩
    return sample === undefined || value.every((item) => matchesShape(item, sample))
  }

  if (template !== null && typeof template === 'object') {
    if (!sameKind(value, template)) return false
    const templateRecord = template as Record<string, unknown>
    const record = value as Record<string, unknown>
    return Object.keys(templateRecord).every((key) => {
      if (!(key in record)) return optionalKeys.includes(key)
      return matchesShape(record[key], templateRecord[key])
    })
  }

  return typeof value === typeof template
}
