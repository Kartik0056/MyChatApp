
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Video, Phone, Users, Shield, Clock, ChevronLeft, ChevronRight } from "lucide-react"

const features = [
  {
    icon: <MessageSquare size={40} />,
    title: "Real-time Messaging",
    description: "Exchange messages instantly with friends and colleagues around the world.",
    color: "bg-gradient-to-r from-blue-500 to-indigo-600",
  },
  {
    icon: <Video size={40} />,
    title: "Video Calls",
    description: "Connect face-to-face with crystal clear video calling functionality.",
    color: "bg-gradient-to-r from-purple-500 to-pink-600",
  },
  {
    icon: <Phone size={40} />,
    title: "Voice Calls",
    description: "Make high-quality voice calls when video isn't necessary.",
    color: "bg-gradient-to-r from-green-500 to-teal-600",
  },
  {
    icon: <Users size={40} />,
    title: "User Profiles",
    description: "Customize your profile and connect with people who matter.",
    color: "bg-gradient-to-r from-orange-500 to-red-600",
  },
  {
    icon: <Shield size={40} />,
    title: "Secure Communication",
    description: "Your conversations are private and protected with advanced security.",
    color: "bg-gradient-to-r from-yellow-500 to-amber-600",
  },
  {
    icon: <Clock size={40} />,
    title: "Always Available",
    description: "Stay connected 24/7 with our reliable messaging platform.",
    color: "bg-gradient-to-r from-cyan-500 to-blue-600",
  },
]

const FeatureSlides = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2">
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2">
        <button
          onClick={nextSlide}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className={`w-full h-full flex flex-col items-center justify-center text-white p-8 ${features[currentSlide].color}`}
        >
          <div className="mb-6 p-4 bg-white/20 rounded-full">{features[currentSlide].icon}</div>
          <h3 className="text-2xl font-bold mb-3">{features[currentSlide].title}</h3>
          <p className="text-center text-white/90 max-w-md">{features[currentSlide].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default FeatureSlides

