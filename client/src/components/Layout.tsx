// Layout.tsx

/**
 * Layout
 * - Layout은 페이지의 전체적인 레이아웃을 담당하는 컴포넌트입니다.
 * - children으로 받은 컴포넌트를 렌더링합니다.
 * @param children : React.ReactNode
 * @returns {JSX.Element} JSX.Element
 */

import classNames from 'classnames'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <main className={classNames('w-full min-h-[calc(100vh-4rem)] h-fit relative')}>{children}</main>
    </>
  )
}
