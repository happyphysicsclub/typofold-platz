declare module 'react-bubble-ui' {
  import { ReactNode, CSSProperties } from 'react'

  interface BubbleUIOptions {
    size?: number
    minSize?: number
    gutter?: number
    provideProps?: boolean
    numCols?: number
    fringeWidth?: number
    yRadius?: number
    xRadius?: number
    cornerRadius?: number
    showGuides?: boolean
    compact?: boolean
    gravitation?: number
  }

  interface BubbleUIProps {
    options?: BubbleUIOptions
    className?: string
    style?: CSSProperties
    children: ReactNode
  }

  export default function BubbleUI(props: BubbleUIProps): JSX.Element
}
