import React, { useState } from 'react'
import { Send, Sparkles, MessageCircle } from 'lucide-react'

const CommandBar = ({ onCommand, onCheckout, onRegkart }) => {
  const [command, setCommand] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (command.trim()) {
      onCommand(command)
      setCommand('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Command Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-gray-200 focus-within:border-blue-400 transition-colors p-3 shadow-md">
          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ask me anything... (e.g., 'Show products under $100')"
            className="flex-1 bg-transparent px-2 py-1 text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!command.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
      
      {/* Bottom Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onRegkart}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Regkart</span>
        </button>
        <button 
          onClick={onCheckout}
          className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold shadow-lg transition-all hover:scale-105"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}

export default CommandBar

