import { useEffect, useState } from "react"

const DarkModeToggle = () => {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDark(true)
    }
  }, [])

  const toggle = () => {
    const root = document.documentElement

    if (dark) {
      root.removeAttribute("data-theme")
      localStorage.setItem("theme", "light")
    } else {
      root.setAttribute("data-theme", "dark")
      localStorage.setItem("theme", "dark")
    }

    setDark(!dark)
  }

  return (
    <button className="secondary" onClick={toggle}>
      {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  )
}

export default DarkModeToggle