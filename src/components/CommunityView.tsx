import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import { CREATIVE_CATEGORIES, CreativeCategory } from '../types/unseen';
import { useUnseen } from '../context/UnseenContext';
import { CreatorAvatar } from './CreatorAvatar';
import { FrameStepSpinner, MorphingEyeCreature } from './UnseenPlaygroundGraphics';

export const CommunityView: React.FC = () => {
  const {
    currentUser,
    allCreators,
    openAuthModal,
    wsConnected,
    onlineCount,
    communities,
    communitiesLoading,
    activeCommunityId,
    selectCommunity,
    communityMessagesByRoom,
    loadingRoomMessages,
    createCommunity,
    toggleCommunityMembership,
    sendCommunityMessage,
    conversations,
    activeConversationId,
    setActiveConversationId,
    communitySection,
    setCommunitySection,
    startConversationWithCreator,
    sendDirectMessage,
  } = useUnseen();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | CreativeCategory>('All');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [dmInput, setDmInput] = useState('');
  const [sendingDm, setSendingDm] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);
  const [showCreatorPicker, setShowCreatorPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dmEndRef = useRef<HTMLDivElement | null>(null);

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return communities.filter((c) => {
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [communities, categoryFilter, searchQuery]);

  const activeCommunity = useMemo(
    () => communities.find((c) => c.id === activeCommunityId) ?? null,
    [communities, activeCommunityId]
  );

  const activeRoomMessages = useMemo(
    () => (activeCommunity ? communityMessagesByRoom[activeCommunity.id] ?? [] : []),
    [activeCommunity, communityMessagesByRoom]
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  useEffect(() => {
    if (
      communitySection === 'circles' &&
      !activeCommunityId &&
      communities.length > 0 &&
      window.innerWidth >= 1024
    ) {
      selectCommunity(communities[0].id);
    }
  }, [communitySection, activeCommunityId, communities, selectCommunity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeRoomMessages.length, activeCommunityId]);

  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversation?.messages.length, activeConversationId]);

  const handleSendCommunityMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommunity) return;
    setSendError(null);
    setSendingMsg(true);
    const res = await sendCommunityMessage(activeCommunity.id, newMessageText);
    setSendingMsg(false);
    if (!res.ok) {
      if (res.error && res.error !== 'Sign in required.') {
        setSendError(res.error);
      }
      return;
    }
    setNewMessageText('');
  };

  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    setDmError(null);
    setSendingDm(true);
    const res = await sendDirectMessage(activeConversation.id, dmInput);
    setSendingDm(false);
    if (!res.ok) {
      if (res.error && res.error !== 'Sign in required.') {
        setDmError(res.error);
      }
      return;
    }
    setDmInput('');
  };

  const availableCreatorsToMessage = useMemo(
    () => allCreators.filter((c) => !currentUser || c.id !== currentUser.id),
    [allCreators, currentUser]
  );

  return (
    <div className="bg-[#000000] bg-playground-grid min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {/* Masthead */}
        <header className="pb-5 border-b border-white/15">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#A0A0A0] mb-2">
                <span
                  aria-hidden="true"
                  className={`inline-block w-2 h-2 rounded-full ${
                    wsConnected ? 'bg-[#00FF99]' : 'bg-[#A0A0A0]/40'
                  }`}
                />
                <span>
                  {wsConnected
                    ? `Live · ${onlineCount} ${onlineCount === 1 ? 'session' : 'sessions'} connected`
                    : 'Reconnecting to studio server...'}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold tracking-[-0.03em] text-[#FFFFFF] leading-[0.96] [text-wrap:balance]">
                Creator Circles <span className="text-[#9933FF]">&amp;</span>{' '}
                <span className="text-[#00D4FF]">Live Chat</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex border-2 border-[#FFFFFF] bg-[#1A1A1A]">
                <button
                  type="button"
                  onClick={() => setCommunitySection('circles')}
                  className={`min-h-[42px] px-4 text-xs font-bold transition-colors whitespace-nowrap ${
                    communitySection === 'circles'
                      ? 'bg-[#FFE600] text-[#000000]'
                      : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
                  }`}
                >
                  Communities ({communities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCommunitySection('messages')}
                  className={`min-h-[42px] px-4 text-xs font-bold transition-colors whitespace-nowrap ${
                    communitySection === 'messages'
                      ? 'bg-[#FFE600] text-[#000000]'
                      : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
                  }`}
                >
                  Direct Chat ({conversations.length})
                </button>
              </div>

              {communitySection === 'circles' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      openAuthModal('signup', 'Sign in to create a new creative community.');
                      return;
                    }
                    setCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#00D4FF] transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Community</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* SECTION 1: COMMUNITIES DIRECTORY + LIVE CHAT ROOM */}
        {communitySection === 'circles' ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Directory Column */}
            <div
              className={`lg:col-span-5 space-y-4 ${
                activeCommunity ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find a community or discipline..."
                    aria-label="Search communities"
                    className="w-full min-h-[44px] pl-10 pr-9 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[38px] min-h-[38px] flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div
                  data-no-swipe="true"
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
                >
                  {(['All', ...CREATIVE_CATEGORIES] as const).map((cat) => {
                    const active = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`min-h-[36px] px-3 text-xs font-bold border whitespace-nowrap shrink-0 transition-colors ${
                          active
                            ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                            : 'bg-[#1A1A1A] border-white/20 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {communitiesLoading ? (
                <div className="p-8 border border-white/20 bg-[#1A1A1A] flex flex-col items-center gap-3 text-sm text-[#A0A0A0]">
                  <FrameStepSpinner size={28} label="Loading creator circles" />
                  <span>Loading creator circles...</span>
                </div>
              ) : filteredCommunities.length === 0 ? (
                <div className="p-8 border border-white/20 bg-[#1A1A1A] text-center flex flex-col items-center">
                  <MorphingEyeCreature size={72} className="mb-3" />
                  <p className="text-sm font-bold text-[#FFFFFF]">No matching communities</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Try clearing your filter or start a new circle for your discipline.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCommunities.map((comm, idx) => {
                    const isSelected = activeCommunity?.id === comm.id;
                    const isMember = Boolean(currentUser && comm.memberIds.includes(currentUser.id));

                    return (
                      <article
                        key={comm.id}
                        className={`border-2 transition-colors bg-[#1A1A1A] ${
                          isSelected
                            ? 'border-[#00D4FF] shadow-[4px_4px_0_0_#9933FF]'
                            : 'border-white/20 hover:border-[#FFFFFF]'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-2 text-xs pb-2 border-b border-white/15">
                            <span className="font-mono-tabular font-bold text-[#00D4FF]">
                              {String(idx + 1).padStart(2, '0')}. · {comm.category}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono-tabular text-[#A0A0A0]">
                              <Users className="w-3.5 h-3.5" />
                              {comm.memberIds.length}
                            </span>
                          </div>

                          <div className="mt-3 flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => selectCommunity(comm.id)}
                              className="text-left min-w-0 flex-1 group focus-visible:outline-none"
                            >
                              <h2 className="font-display text-lg font-extrabold text-[#FFFFFF] group-hover:text-[#00D4FF] transition-colors">
                                {comm.name}
                              </h2>
                              <p className="text-xs text-[#A0A0A0] mt-1 line-clamp-2 leading-relaxed">
                                {comm.lastMessageText ?? comm.description}
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => void toggleCommunityMembership(comm.id)}
                              className={`min-h-[38px] px-3 text-xs font-bold border shrink-0 transition-colors ${
                                isMember
                                  ? 'bg-[#9933FF] border-[#FFFFFF] text-[#FFFFFF]'
                                  : 'bg-[#2A2A2A] border-white/25 text-[#FFFFFF] hover:bg-[#00FF99] hover:text-[#000000]'
                              }`}
                            >
                              {isMember ? 'Joined' : 'Join'}
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-[#A0A0A0]">
                            <button
                              type="button"
                              onClick={() => selectCommunity(comm.id)}
                              className="font-bold text-[#00FF99] hover:underline"
                            >
                              Open Room →
                            </button>
                            <span className="font-mono-tabular">{comm.messageCount} messages</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Room Chat Column */}
            <div
              className={`lg:col-span-7 ${
                activeCommunity ? 'block' : 'hidden lg:block'
              }`}
            >
              {activeCommunity ? (
                <div className="border-2 border-[#FFFFFF] bg-[#1A1A1A] shadow-[6px_6px_0_0_#9933FF] flex flex-col h-[calc(100dvh-230px)] min-h-[420px] max-h-[680px]">
                  {/* Room Header */}
                  <div className="px-4 sm:px-5 py-3.5 border-b border-white/15 bg-[#000000] text-[#FFFFFF] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => selectCommunity(null)}
                        aria-label="Back to communities"
                        className="lg:hidden min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center text-[#FFFFFF]"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="min-w-0">
                        <h2 className="font-display text-lg font-extrabold text-[#FFFFFF] truncate">
                          {activeCommunity.name}
                        </h2>
                        <p className="text-xs text-[#00D4FF] truncate">
                          {activeCommunity.category} · {activeCommunity.memberIds.length} members
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleCommunityMembership(activeCommunity.id)}
                      className={`min-h-[40px] px-3.5 text-xs font-bold border shrink-0 transition-colors ${
                        currentUser && activeCommunity.memberIds.includes(currentUser.id)
                          ? 'bg-[#2A2A2A] border-white/30 text-[#FFFFFF] hover:border-[#FF3DAE] hover:text-[#FF3DAE]'
                          : 'bg-[#00FF99] border-[#FFFFFF] text-[#000000] hover:bg-[#FFE600]'
                      }`}
                    >
                      {currentUser && activeCommunity.memberIds.includes(currentUser.id)
                        ? 'Leave Circle'
                        : 'Join Circle'}
                    </button>
                  </div>

                  {/* Room Description Strip */}
                  <div className="px-4 sm:px-5 py-2.5 border-b border-white/15 bg-[#2A2A2A] text-xs text-[#A0A0A0] shrink-0">
                    {activeCommunity.description}
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                    {loadingRoomMessages && activeRoomMessages.length === 0 ? (
                      <div className="py-12 flex flex-col items-center gap-2 text-sm text-[#A0A0A0]">
                        <FrameStepSpinner size={26} label="Loading conversation" />
                        <span>Loading conversation...</span>
                      </div>
                    ) : activeRoomMessages.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center">
                        <MorphingEyeCreature size={72} className="mb-3" />
                        <p className="font-display text-base font-bold text-[#FFFFFF]">
                          Start the conversation
                        </p>
                        <p className="text-xs text-[#A0A0A0] mt-1">
                          Share a question, work-in-progress note, or introduction with the circle.
                        </p>
                      </div>
                    ) : (
                      activeRoomMessages.map((msg) => {
                        const isSelf = Boolean(currentUser && msg.senderId === currentUser.id);
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-3 ${
                              isSelf ? 'flex-row-reverse text-right' : ''
                            }`}
                          >
                            <CreatorAvatar
                              src={msg.senderAvatarUrl}
                              name={msg.senderDisplayName || msg.senderUsername}
                              size="sm"
                              className="mt-0.5 rounded-[2px]"
                            />
                            <div className={`max-w-[82%] min-w-0 ${isSelf ? 'items-end' : ''}`}>
                              <div
                                className={`flex items-baseline gap-2 text-[11px] text-[#A0A0A0] ${
                                  isSelf ? 'justify-end' : ''
                                }`}
                              >
                                <span className="font-bold text-[#FFFFFF]">
                                  {msg.senderDisplayName || `@${msg.senderUsername}`}
                                </span>
                                <span className="font-mono-tabular">
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div
                                className={`mt-1 px-3.5 py-2.5 text-sm leading-relaxed break-words inline-block text-left ${
                                  isSelf
                                    ? 'bg-[#9933FF] text-[#FFFFFF] border border-[#FFFFFF]'
                                    : 'bg-[#2A2A2A] border border-white/15 text-[#FFFFFF]'
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer */}
                  <div className="p-3 sm:p-4 border-t border-white/15 bg-[#000000] shrink-0">
                    {sendError && (
                      <p className="text-xs text-[#FF3DAE] font-medium mb-2">{sendError}</p>
                    )}
                    {currentUser ? (
                      <form onSubmit={(e) => void handleSendCommunityMsg(e)} className="flex gap-2">
                        <input
                          type="text"
                          maxLength={1000}
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          placeholder={`Message ${activeCommunity.name}...`}
                          aria-label="Write a community message"
                          className="flex-1 min-h-[44px] px-3.5 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                        />
                        <button
                          type="submit"
                          disabled={sendingMsg || !newMessageText.trim()}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#FFE600] disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-xs text-[#A0A0A0]">
                          Sign in or create an account to chat in this circle.
                        </p>
                        <button
                          type="button"
                          onClick={() => openAuthModal('signup', 'Join UNSEEN to chat in communities.')}
                          className="min-h-[40px] px-4 bg-[#FFE600] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#00FF99] shrink-0"
                        >
                          Sign In to Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-white/25 bg-[#1A1A1A] p-12 text-center flex flex-col items-center">
                  <MorphingEyeCreature size={80} className="mb-3" />
                  <p className="font-display text-lg font-extrabold text-[#FFFFFF]">
                    Select a Community Room
                  </p>
                  <p className="text-sm text-[#A0A0A0] mt-1">
                    Pick a creative circle on the left to read notes and join the live conversation.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SECTION 2: DIRECT CREATOR CONVERSATIONS */
          <div className="mt-6">
            {!currentUser ? (
              <div className="max-w-xl border-2 border-[#FFFFFF] bg-[#1A1A1A] text-[#FFFFFF] p-7 shadow-[6px_6px_0_0_#00D4FF]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono-tabular font-bold text-[#00D4FF]">
                      DIRECT CHAT
                    </span>
                    <h2 className="font-display text-2xl font-extrabold text-[#FFFFFF] mt-1.5">
                      Direct Creator Conversations
                    </h2>
                  </div>
                  <MorphingEyeCreature size={72} className="shrink-0" />
                </div>
                <p className="text-sm text-[#A0A0A0] mt-2 leading-relaxed">
                  Sign in or create a creator profile to start one-on-one conversations with other creators, share feedback, and collaborate across disciplines.
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup', 'Sign in to message other creators.')}
                  className="mt-5 min-h-[46px] px-5 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600] transition-colors"
                >
                  Create Account or Sign In
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Threads Column */}
                <div
                  className={`lg:col-span-5 space-y-3 ${
                    activeConversation ? 'hidden lg:block' : 'block'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/15">
                    <span className="text-xs font-bold text-[#FFFFFF]">Conversations</span>
                    <button
                      type="button"
                      onClick={() => setShowCreatorPicker((v) => !v)}
                      className="inline-flex items-center gap-1 min-h-[36px] px-3 bg-[#00D4FF] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#00FF99] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Chat</span>
                    </button>
                  </div>

                  {showCreatorPicker && (
                    <div className="p-3 border-2 border-[#FFFFFF] bg-[#1A1A1A] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#FFFFFF]">Message a Creator</span>
                        <button
                          type="button"
                          onClick={() => setShowCreatorPicker(false)}
                          className="text-[#A0A0A0] hover:text-[#FFFFFF]"
                        >
                          Close
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto divide-y divide-white/10">
                        {availableCreatorsToMessage.map((creator) => (
                          <button
                            key={creator.id}
                            type="button"
                            onClick={() => {
                              setShowCreatorPicker(false);
                              void startConversationWithCreator(creator.id);
                            }}
                            className="w-full py-2.5 px-1 flex items-center gap-2.5 text-left hover:bg-[#2A2A2A]"
                          >
                            <CreatorAvatar
                              src={creator.avatarUrl}
                              name={creator.displayName}
                              size="sm"
                              className="rounded-[2px]"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#FFFFFF] truncate">
                                {creator.displayName}
                              </p>
                              <p className="text-[11px] text-[#A0A0A0] truncate">
                                @{creator.username}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {conversations.length === 0 ? (
                    <div className="p-8 border border-white/20 bg-[#1A1A1A] text-center">
                      <MessageSquare className="w-6 h-6 mx-auto text-[#00D4FF] mb-2" strokeWidth={1.7} />
                      <p className="text-sm font-bold text-[#FFFFFF]">No direct messages yet</p>
                      <p className="text-xs text-[#A0A0A0] mt-1">
                        Tap New Chat or open any creator’s profile in Explore to start a conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {conversations.map((conv) => {
                        const other =
                          conv.participants.find((p) => p.id !== currentUser.id) ??
                          conv.participants[0];
                        const lastMsg = conv.messages[conv.messages.length - 1];
                        const selected = activeConversation?.id === conv.id;

                        return (
                          <button
                            key={conv.id}
                            type="button"
                            onClick={() => setActiveConversationId(conv.id)}
                            className={`w-full p-3.5 border-2 bg-[#1A1A1A] flex items-center gap-3 text-left transition-colors ${
                              selected
                                ? 'border-[#00D4FF] shadow-[4px_4px_0_0_#9933FF]'
                                : 'border-white/20 hover:border-[#FFFFFF]'
                            }`}
                          >
                            <CreatorAvatar
                              src={other?.avatarUrl}
                              name={other?.displayName ?? 'Creator'}
                              size="md"
                              className="rounded-[2px]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-display text-sm font-bold text-[#FFFFFF] truncate">
                                  {other?.displayName ?? 'Creator'}
                                </p>
                                <span className="text-[11px] font-mono-tabular text-[#A0A0A0] shrink-0">
                                  {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-[#A0A0A0] truncate mt-0.5">
                                {lastMsg ? lastMsg.text : `Say hello to @${other?.username}`}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active DM Room */}
                <div
                  className={`lg:col-span-7 ${
                    activeConversation ? 'block' : 'hidden lg:block'
                  }`}
                >
                  {activeConversation ? (
                    (() => {
                      const other =
                        activeConversation.participants.find((p) => p.id !== currentUser.id) ??
                        activeConversation.participants[0];
                      return (
                        <div className="border-2 border-[#FFFFFF] bg-[#1A1A1A] shadow-[6px_6px_0_0_#00D4FF] flex flex-col h-[calc(100dvh-230px)] min-h-[420px] max-h-[680px]">
                          <div className="px-4 sm:px-5 py-3.5 border-b border-white/15 bg-[#000000] text-[#FFFFFF] flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveConversationId(null)}
                              aria-label="Back to conversations"
                              className="lg:hidden min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center text-[#FFFFFF]"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <CreatorAvatar
                              src={other?.avatarUrl}
                              name={other?.displayName ?? 'Creator'}
                              size="sm"
                              className="rounded-[2px]"
                            />
                            <div className="min-w-0">
                              <h2 className="font-display text-base font-extrabold text-[#FFFFFF] truncate">
                                {other?.displayName ?? 'Creator'}
                              </h2>
                              <p className="text-xs text-[#00D4FF] truncate">@{other?.username}</p>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                            {activeConversation.messages.length === 0 ? (
                              <div className="py-12 text-center flex flex-col items-center">
                                <MorphingEyeCreature size={72} className="mb-3" />
                                <p className="font-display text-base font-bold text-[#FFFFFF]">
                                  Start a conversation with {other?.displayName}
                                </p>
                                <p className="text-xs text-[#A0A0A0] mt-1">
                                  Messages deliver in real time when both creators are connected.
                                </p>
                              </div>
                            ) : (
                              activeConversation.messages.map((msg) => {
                                const isSelf = msg.senderId === currentUser.id;
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col ${
                                      isSelf ? 'items-end' : 'items-start'
                                    }`}
                                  >
                                    <span className="text-[11px] font-mono-tabular text-[#A0A0A0] mb-1">
                                      {isSelf ? 'You' : `@${msg.senderUsername}`} ·{' '}
                                      {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                    <div
                                      className={`max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                                        isSelf
                                          ? 'bg-[#9933FF] text-[#FFFFFF] border border-[#FFFFFF]'
                                          : 'bg-[#2A2A2A] border border-white/15 text-[#FFFFFF]'
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            <div ref={dmEndRef} />
                          </div>

                          <div className="p-3 sm:p-4 border-t border-white/15 bg-[#000000] shrink-0">
                            {dmError && (
                              <p className="text-xs text-[#FF3DAE] font-medium mb-2">{dmError}</p>
                            )}
                            <form onSubmit={(e) => void handleSendDm(e)} className="flex gap-2">
                              <input
                                type="text"
                                maxLength={1000}
                                value={dmInput}
                                onChange={(e) => setDmInput(e.target.value)}
                                placeholder={`Write to @${other?.username ?? 'creator'}...`}
                                className="flex-1 min-h-[44px] px-3.5 bg-[#1A1A1A] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                              />
                              <button
                                type="submit"
                                disabled={sendingDm || !dmInput.trim()}
                                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#FFE600] disabled:opacity-50 transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send</span>
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="border-2 border-white/25 bg-[#1A1A1A] p-12 text-center flex flex-col items-center">
                      <MorphingEyeCreature size={76} className="mb-3" />
                      <p className="font-display text-lg font-extrabold text-[#FFFFFF]">
                        Select or Start a Conversation
                      </p>
                      <p className="text-sm text-[#A0A0A0] mt-1">
                        Choose a thread or message any emerging creator directly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Community Modal */}
        {createModalOpen && (
          <CreateCommunityModal
            onClose={() => setCreateModalOpen(false)}
            onCreate={async (payload) => {
              const res = await createCommunity(payload);
              if (res.ok) setCreateModalOpen(false);
              return res;
            }}
          />
        )}
      </div>
    </div>
  );
};

interface CreateCommunityModalProps {
  onClose: () => void;
  onCreate: (input: {
    name: string;
    category: CreativeCategory;
    description: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CreativeCategory>('Graphic Design');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await onCreate({ name, category, description });
    setSubmitting(false);
    if (!res.ok && res.error) {
      setError(res.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-community-heading"
    >
      <div className="w-full sm:max-w-md bg-[#1A1A1A] border-2 border-[#FFFFFF] p-6 shadow-[6px_6px_0_0_#00FF99]">
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <h2 id="create-community-heading" className="font-display text-xl font-extrabold text-[#FFFFFF]">
            Start a Creator Community
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 border border-[#FF3DAE] bg-[#2A2A2A] text-xs font-medium text-[#FF3DAE]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="comm-name" className="block text-xs font-bold text-[#FFFFFF] mb-1">
              Community Name
            </label>
            <input
              id="comm-name"
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Analog Risograph Collective"
              className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <span className="block text-xs font-bold text-[#FFFFFF] mb-2">
              Primary Discipline
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CREATIVE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[36px] px-3 border text-xs font-bold transition-colors ${
                    category === cat
                      ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                      : 'bg-[#000000] border-white/25 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comm-desc" className="block text-xs font-bold text-[#FFFFFF] mb-1">
              Focus & Purpose
            </label>
            <textarea
              id="comm-desc"
              rows={3}
              required
              maxLength={240}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do creators share and discuss in this circle?"
              className="w-full px-3.5 py-2.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600] transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating Circle...' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
};
