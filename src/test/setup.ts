import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// The first render in a test file pays for module evaluation and the router's
// redirect pass; on shared CI runners that exceeds the 1 s default. A longer
// ceiling only delays tests that would fail anyway.
configure({ asyncUtilTimeout: 5000 })
