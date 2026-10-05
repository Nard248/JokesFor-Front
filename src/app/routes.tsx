import { createBrowserRouter, RouterProvider } from 'react-router'
import { ContentSelectionBoundary } from '@/features/discovery/ContentSelectionBoundary'
import { routes } from './routeConfig'

const router = createBrowserRouter([{ element: <ContentSelectionBoundary />, children: routes }])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
