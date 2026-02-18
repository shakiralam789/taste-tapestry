"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWishbook } from '@/contexts/WishbookContext';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video,
  Smile,
  Paperclip,
  Share2
} from 'lucide-react';

interface Conversation {
  id: string;
  userId: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'recommendation';
}

export default function MessagesPage() {
  const { allUsers, user } = useWishbook();
  const [selectedConversation, setSelectedConversation] = useState<string | null>('2');
  const [messageInput, setMessageInput] = useState('');

  // Mock conversations
  const conversations: Conversation[] = allUsers
    .filter(u => u.id !== user.id)
    .map(u => ({
      id: u.id,
      userId: u.id,
      lastMessage: "Hey! Have you seen that movie I recommended?",
      timestamp: new Date(),
      unread: u.id === '2' ? 2 : 0,
    }));

  // Mock messages
  const messages: ChatMessage[] = [
    {
      id: '1',
      senderId: '2',
      content: "Hey! Have you watched Eternal Sunshine yet?",
      timestamp: new Date(Date.now() - 3600000),
      type: 'text',
    },
    {
      id: '2',
      senderId: '1',
      content: "Yes! It was absolutely beautiful. The concept of erasing memories is so thought-provoking.",
      timestamp: new Date(Date.now() - 3500000),
      type: 'text',
    },
    {
      id: '3',
      senderId: '2',
      content: "Right?! I knew you'd love it. It's one of those movies that stays with you.",
      timestamp: new Date(Date.now() - 3400000),
      type: 'text',
    },
    {
      id: '4',
      senderId: '2',
      content: "I have another recommendation for you! 🎬",
      timestamp: new Date(Date.now() - 1800000),
      type: 'text',
    },
  ];

  const selectedUser = allUsers.find(u => u.id === selectedConversation);

  const handleSend = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message
      setMessageInput('');
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-background">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-xl font-semibold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {conversations.map((conv) => {
                const convUser = allUsers.find(u => u.id === conv.userId);
                if (!convUser) return null;

                return (
                  <motion.button
                    key={conv.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                      selectedConversation === conv.id 
                        ? 'bg-primary/10' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={convUser.avatar} alt={convUser.name} />
                        <AvatarFallback>{convUser.name[0]}</AvatarFallback>
                      </Avatar>
                      {conv.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{convUser.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {conv.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-muted/20">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                    <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedUser.name}</h2>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === user.id;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                          <div
                            className={`p-3 rounded-2xl ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-card rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button variant="gradient" size="icon" onClick={handleSend}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Send className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Your Messages</h3>
                <p className="text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
