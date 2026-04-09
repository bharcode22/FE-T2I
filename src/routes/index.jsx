import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import GalleryPage from '../pages/GalleryPage'
import MetricsPage from '../pages/MetricsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'metrics', element: <MetricsPage /> },
    ],
  },
])

export default router
