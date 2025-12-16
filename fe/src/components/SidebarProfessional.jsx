import React, { useState } from 'react'
import { MessageSquare, Plus, Store, UserCircle, Clock } from 'lucide-react'

const SidebarProfessional = ({ selectedChat, onSelectChat, onMerchantLogin }) => {
  const [chats] = useState([
    { id: 1, title: 'Shopping Session 1', date: '2 hours ago', preview: 'Looking for sneakers...' },
    { id: 2, title: 'Previous Order', date: 'Yesterday', preview: 'Checked out 3 items' },
    { id: 3, title: 'Product Inquiry', date: '2 days ago', preview: 'Asked about shipping' },
  ])

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Chat Commerce</h1>
              <p className="text-xs text-gray-500">AI Shopping</p>
            </div>
          </div>
          <button
            onClick={onMerchantLogin}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Merchant Login"
          >
            <UserCircle className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      
      {/* Chats List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
          Recent Chats
        </div>
        
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
              selectedChat === chat.id
                ? 'bg-gray-100'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedChat === chat.id ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <MessageSquare className={`w-4 h-4 ${
                  selectedChat === chat.id ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                  {chat.title}
                </h3>
                <p className="text-xs text-gray-500 truncate mb-1">
                  {chat.preview}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {chat.date}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Powered by AI Marketplace
        </p>
      </div>
    </div>
  )
}

export default SidebarProfessional

