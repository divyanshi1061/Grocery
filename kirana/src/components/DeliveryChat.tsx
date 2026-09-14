'use client'
import { AlertCircle, Send, Sparkles } from 'lucide-react'
import mongoose from 'mongoose'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getSocket } from '../lib/socket'
import { IMessage } from '../models/message.model'
import axios from 'axios'
import { AnimatePresence, motion } from 'motion/react'

type Props = {
  orderId: mongoose.Types.ObjectId | string
  senderId: mongoose.Types.ObjectId | string
  /** 'user' = customer side, 'delivery_boy' = delivery partner side */
  role: 'user' | 'delivery_boy'
}

type SuggestionState = 'idle' | 'loading' | 'success' | 'error'

function DeliveryChat({ orderId, senderId, role }: Props) {
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<IMessage[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionState, setSuggestionState] = useState<SuggestionState>('idle')

  const chatBotRef = useRef<HTMLDivElement>(null)
  // Prevent fetching suggestions for the same latest message twice
  const lastSuggestedMsgRef = useRef<string>('')

  /* ── Auto-scroll ─────────────────────────────────────────── */
  useEffect(() => {
    chatBotRef.current?.scrollTo({ top: chatBotRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  /* ── Join socket room + listen for messages ──────────────── */
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-room', orderId)
    socket.off('send-message')
    const onMessage = (msg: IMessage) => setMessages((prev) => [...prev, msg])
    socket.on('send-message', onMessage)
    return () => { socket.off('send-message', onMessage) }
  }, [orderId])

  /* ── Fetch message history ───────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.post('/api/chat/messages', { roomId: orderId })
        setMessages(res.data)
      } catch (e) {
        console.error('Error fetching messages:', e)
      }
    }
    load()
  }, [orderId])

  /* ── AI Suggest (manual trigger) ────────────────────────── */
  const handleAISuggest = useCallback(async () => {
    if (messages.length === 0) return

    const latestMessage = messages[messages.length - 1].text

    // Don't re-fetch suggestions for the exact same last message
    if (latestMessage === lastSuggestedMsgRef.current && suggestions.length > 0) return

    setSuggestionState('loading')
    setSuggestions([])
    lastSuggestedMsgRef.current = latestMessage

    // Build conversation history for context (sender label from senderId)
    const history = messages.map((m) => ({
      sender: m.senderId.toString() === senderId.toString() ? 'me' : 'other',
      text: m.text,
    }))

    try {
      const res = await axios.post('/api/chat/ai-suggestions', {
        latestMessage,
        messages: history,
        role,
      })
      const raw: string[] = res.data.suggestions ?? []
      const valid = raw.filter((s: string) => typeof s === 'string' && s.trim().length > 0)

      if (valid.length === 0) {
        setSuggestionState('error')
        return
      }
      setSuggestions(valid)
      setSuggestionState('success')
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.response?.data?.error ?? err?.message
      console.error('[DeliveryChat] AI suggestion error:', detail)
      setSuggestionState('error')
    }
  }, [messages, senderId, role, suggestions.length])

  /* ── Send message ────────────────────────────────────────── */
  const sendMsg = () => {
    if (!newMessage.trim()) return
    const socket = getSocket()
    socket.emit('send-message', {
      roomId: orderId,
      text: newMessage,
      senderId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    // Clear suggestions + allow fresh fetch for reply
    lastSuggestedMsgRef.current = ''
    setSuggestions([])
    setSuggestionState('idle')
    setNewMessage('')
  }

  const handleSuggestionClick = (s: string) => {
    setNewMessage(s)
    setSuggestions([])
    setSuggestionState('idle')
  }

  const latestMsg = messages[messages.length - 1]
  const canSuggest = messages.length > 0

  return (
    <div className='bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col' style={{ height: 480 }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className='flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white shrink-0'>
        <div className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
        <p className='text-sm font-semibold text-gray-700'>Chat Support</p>

        {/* AI Suggest button */}
        <motion.button
          id='ai-suggest-btn'
          whileTap={{ scale: 0.94 }}
          disabled={!canSuggest || suggestionState === 'loading'}
          onClick={handleAISuggest}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all
            ${suggestionState === 'loading'
              ? 'bg-purple-50 border-purple-200 text-purple-400 cursor-wait'
              : suggestionState === 'error'
                ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                : 'bg-gradient-to-r from-purple-500 to-violet-600 border-transparent text-white hover:opacity-90 shadow-sm shadow-purple-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {suggestionState === 'loading' ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className='w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full'
              />
              Thinking…
            </>
          ) : suggestionState === 'error' ? (
            <>
              <AlertCircle size={11} />
              Retry
            </>
          ) : (
            <>
              <Sparkles size={11} />
              AI Suggest
            </>
          )}
        </motion.button>
      </div>

      {/* ── Message list ──────────────────────────────────────── */}
      <div className='flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2' ref={chatBotRef}>
        {messages.length === 0 && (
          <div className='flex-1 flex flex-col items-center justify-center text-center gap-2 py-10'>
            <div className='w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center'>
              <Send size={20} className='text-orange-400' />
            </div>
            <p className='text-sm text-gray-400'>No messages yet. Say hello! 👋</p>
            <p className='text-xs text-gray-300'>Use <span className='text-purple-400 font-medium'>AI Suggest</span> after a message arrives</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, index) => {
            const isMine = msg.senderId.toString() === senderId.toString()
            const isLatest = index === messages.length - 1
            return (
              <motion.div
                key={msg._id?.toString() ?? index}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col max-w-[78%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`px-3 py-2 rounded-2xl ${isMine
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}
                >
                  <p className='text-sm leading-relaxed'>{msg.text}</p>
                </div>
                <p className={`text-[10px] mt-0.5 opacity-50 ${isMine ? 'text-right' : ''}`}>{msg.time}</p>

                {/* Inline suggestion chips below the latest message */}
                {isLatest && suggestionState === 'success' && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='mt-2 flex flex-col gap-1.5 w-full max-w-[260px]'
                  >
                    <p className='text-[10px] text-purple-400 font-semibold flex items-center gap-1'>
                      <Sparkles size={9} /> AI Suggestions
                    </p>
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.06 }}
                        onClick={() => handleSuggestionClick(s)}
                        className='text-left px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-700 text-xs font-medium hover:bg-purple-50 hover:border-purple-400 active:scale-95 transition-all shadow-sm'
                      >
                        {s}
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Shimmer chips while loading — shown below latest message */}
                {isLatest && suggestionState === 'loading' && (
                  <div className='mt-2 flex flex-col gap-1.5 w-full max-w-[240px]'>
                    {[130, 160, 110].map((w, i) => (
                      <div
                        key={i}
                        className='h-7 rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse'
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                )}

                {/* Error hint below latest message */}
                {isLatest && suggestionState === 'error' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='mt-1 text-[10px] text-red-400 flex items-center gap-1'
                  >
                    <AlertCircle size={9} /> Couldn't load suggestions. Tap Retry.
                  </motion.p>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* ── Input area ────────────────────────────────────────── */}
      <div className='flex gap-2 px-3 pb-3 pt-2 border-t border-gray-100 shrink-0'>
        <input
          id='chat-input'
          type='text'
          placeholder='Type a message…'
          className='flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
        />
        <motion.button
          id='chat-send-btn'
          whileTap={{ scale: 0.92 }}
          className='bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl transition shrink-0 disabled:opacity-40'
          onClick={sendMsg}
          disabled={!newMessage.trim()}
        >
          <Send size={17} />
        </motion.button>
      </div>
    </div>
  )
}

export default DeliveryChat