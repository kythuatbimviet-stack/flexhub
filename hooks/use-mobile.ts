import * as React from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)")
    const onChange = () => {
      setIsMobile(window.innerWidth < 640)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < 640)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
