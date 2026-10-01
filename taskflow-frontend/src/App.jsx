import { Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import Protected from './component/Protected.jsx'
import Navbar from './component/Navbar.jsx'
import Footer from './component/Footer.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/SignUp.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import MyTasks from './pages/MyTasks.jsx'

// Har protected page ke upar navbar
const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
)

const protectedPage = (Page) => (
  <Protected>
    <Layout>
      <Page />
    </Layout>
  </Protected>
)

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    <Route path="/" element={protectedPage(Dashboard)} />
    <Route path="/projects" element={protectedPage(Projects)} />
    <Route path="/projects/:id" element={protectedPage(ProjectDetails)} />
    <Route path="/my-tasks" element={protectedPage(MyTasks)} />

    {/* Abhi bana nahi hua page */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}