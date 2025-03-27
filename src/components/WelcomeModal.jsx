
import { useState } from "react"
import { motion } from "framer-motion"
import { X, MessageSquare, Video, Phone, Users, Shield } from "lucide-react"

const WelcomeModal = ({ onClose }) => {
  const [step, setStep] = useState(1)
  const totalSteps = 5

  const features = [
    {
      icon: <MessageSquare size={48} />,
      title: "Real-time Messaging",
      description: "Exchange messages instantly with friends and colleagues around the world.",
      color: "bg-gradient-to-r from-blue-500 to-indigo-600",
    },
    {
      icon: <Video size={48} />,
      title: "Video Calls",
      description: "Connect face-to-face with crystal clear video calling functionality.",
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
    },
    {
      icon: <Phone size={48} />,
      title: "Voice Calls",
      description: "Make high-quality voice calls when video isn't necessary.",
      color: "bg-gradient-to-r from-green-500 to-teal-600",
    },
    {
      icon: <Users size={48} />,
      title: "User Profiles",
      description: "Customize your profile and connect with people who matter.",
      color: "bg-gradient-to-r from-orange-500 to-red-600",
    },
    {
      icon: <Shield size={48} />,
      title: "Secure Communication",
      description: "Your conversations are private and protected with advanced security.",
      color: "bg-gradient-to-r from-yellow-500 to-amber-600",
    },
  ]

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
            <X size={24} />
          </button>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to K-Chat!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                We're excited to have you join our community. Let's take a quick tour of what you can do with K-Chat.
              </p>
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md"
                >
                  Let's Get Started
                </motion.button>
              </div>
            </motion.div>
          )}

          {step > 1 && step < totalSteps && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-8"
            >
              <div
                className={`w-20 h-20 ${features[step - 2].color} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                {features[step - 2].icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{features[step - 2].title}</h2>
              <p className="text-gray-600 mb-8 text-center max-w-md mx-auto">{features[step - 2].description}</p>

              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md"
                >
                  Next
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === totalSteps && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">You're All Set!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You're now ready to start using K-Chat. Connect with friends, make calls, and enjoy secure
                communication.
              </p>
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium shadow-md"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          )}

          <div className="px-8 pb-6 pt-2">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index + 1 === step ? "w-8 bg-indigo-600" : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default WelcomeModal

