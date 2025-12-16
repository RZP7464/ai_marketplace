import React, { useRef, useEffect } from 'react'
import { User, Package, MessageCircle } from 'lucide-react'
import Message from './Message'

const ChatArea = ({ messages, cart, onAddToCart }) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">👨‍💼</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Welcome to [Merchant] Assistant!
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    I'm here you help suind find what yo need.
                  </p>
                  <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                    📋 Uetund fle hetts
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <button className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow hover:shadow-md transition-all border-b-4 border-blue-500">
                <User className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Shop Now</span>
              </button>
              <button className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow hover:shadow-md transition-all">
                <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Track Order</span>
              </button>
              <button className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow hover:shadow-md transition-all">
                <MessageCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Support Chat</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  )
}

export default ChatArea

