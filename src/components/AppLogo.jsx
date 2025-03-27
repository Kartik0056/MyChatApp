
import { motion } from "framer-motion"

const AppLogo = ({ size = "large" }) => {
  const logoSize = size === "large" ? "text-4xl" : "text-2xl"
  const iconSize = size === "large" ? "w-12 h-12" : "w-8 h-8"

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`${iconSize} rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold`}
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-7"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </motion.div>
      <motion.div whileHover={{ scale: 1.03 }} className="font-bold">
        <h1 className={`${logoSize} bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
        K-Chat
        </h1>
        <p className="text-xs text-gray-500">Connect. Communicate. Collaborate.</p>
      </motion.div>
    </motion.div>
  )
}

export default AppLogo

