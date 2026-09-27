import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Skills } from './pages/Skills'
import { Projects } from './pages/Projects'
import { Blog } from './pages/Blog'
import { Post } from './pages/Post'
import { Contact } from './pages/Contact'
import { NotFound } from './pages/NotFound'

/** 后台体量大且只有站长访问，单独分包，不计入首屏主包。 */
const Admin = lazy(() => import('./admin/Admin').then((module) => ({ default: module.Admin })))

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 后台独立于前台布局，不套用 Header / Footer */}
        <Route
          path="admin"
          element={
            <Suspense
              fallback={
                <div className="admin-page">
                  <div className="container admin-login">
                    <p className="admin-hint">正在加载后台…</p>
                  </div>
                </div>
              }
            >
              <Admin />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="skills" element={<Skills />} />
          <Route path="projects" element={<Projects />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<Post />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
