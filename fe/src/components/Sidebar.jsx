import React, { useState } from 'react'
import { MessageSquare, Plus, Store, UserCircle } from 'lucide-react'

const Sidebar = ({ selectedChat, onSelectChat, onMerchantLogin }) => {
  const [chats] = useState([
    { id: 1, title: 'Shopping Session 1', date: '2 hours ago', preview: 'Looking for sneakers...' },
    { id: 2, title: 'Previous Order', date: 'Yesterday', preview: 'Checked out 3 items' },
    { id: 3, title: 'Product Inquiry', date: '2 days ago', preview: 'Asked about shipping' },
  ])

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Icon/Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <button
            onClick={onMerchantLogin}
            className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl hover:shadow-lg transition-all hover:scale-105"
            title="Merchant Login"
          >
            <UserCircle className="w-6 h-6 text-white" />
          </button>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Chat Commerce</h1>
        <p className="text-sm text-gray-500 mt-1">AI-Powered Shopping</p>
      </div>
      
      {/* Chats Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Chats</h2>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full p-4 rounded-xl mb-2 text-left transition-all hover:shadow-md ${
                selectedChat === chat.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedChat === chat.id ? 'bg-white/20' : 'bg-blue-100'
                }`}>
                  <MessageSquare className={`w-4 h-4 ${
                    selectedChat === chat.id ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm mb-1 truncate ${
                    selectedChat === chat.id ? 'text-white' : 'text-gray-800'
                  }`}>
                    {chat.title}
                  </h3>
                  <p className={`text-xs truncate ${
                    selectedChat === chat.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {chat.preview}
                  </p>
                  <p className={`text-xs mt-1 ${
                    selectedChat === chat.id ? 'text-white/70' : 'text-gray-400'
                  }`}>
                    {chat.date}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sidebar

