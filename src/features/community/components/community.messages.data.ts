export type MessageThread = {
  id: string;
  name: string;
  roleLabel?: string;
  avatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
  sentByMe?: boolean;
  isPinned?: boolean;
};

export type ConversationMessage = {
  id: string;
  threadId: string;
  sender: "me" | "other";
  text: string;
  sentAt: string;
};

const avatarUrl = (name: string, bgColor: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=FFFFFF`;

export const messageThreadsMock: MessageThread[] = [
  {
    id: "thread-1",
    name: "Ky su Le Anh",
    roleLabel: "Plant Protection Expert",
    avatar: avatarUrl("Le Anh", "2F7F34"),
    lastMessage: "The leaf spots look fungal. Send me a close-up if you can.",
    lastMessageAt: "2m",
    unreadCount: 2,
    isOnline: true,
    isPinned: true,
  },
  {
    id: "thread-2",
    name: "Buon Ma Thuot Growers",
    roleLabel: "Community Group",
    avatar: avatarUrl("BMT Growers", "0EA5E9"),
    lastMessage: "Can anyone share a trusted supplier for drip lines?",
    lastMessageAt: "13m",
    unreadCount: 8,
    isOnline: true,
  },
  {
    id: "thread-3",
    name: "Tran Thi Lan",
    roleLabel: "Nearby Farmer",
    avatar: avatarUrl("Tran Thi Lan", "F59E0B"),
    lastMessage: "I can bring the pH meter tomorrow morning.",
    lastMessageAt: "1h",
    unreadCount: 0,
    isOnline: false,
    sentByMe: true,
  },
  {
    id: "thread-4",
    name: "Leafy Support",
    roleLabel: "Official",
    avatar: avatarUrl("Leafy Support", "334155"),
    lastMessage: "",
    lastMessageAt: "3h",
    unreadCount: 0,
    isOnline: true,
    isTyping: true,
  },
  {
    id: "thread-5",
    name: "Dak Lak Cooperative",
    roleLabel: "Co-op",
    avatar: avatarUrl("Dak Lak Co-op", "7C3AED"),
    lastMessage:
      "Weekly market sheet is ready. We highlighted arabica quality bands.",
    lastMessageAt: "5h",
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: "thread-6",
    name: "Nguyen Van Nam",
    roleLabel: "Farm Neighbor",
    avatar: avatarUrl("Nguyen Van Nam", "14B8A6"),
    lastMessage: "Thanks! The irrigation schedule worked very well.",
    lastMessageAt: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    sentByMe: true,
  },
];

const conversationMessagesByThreadId: Record<string, ConversationMessage[]> = {
  "thread-1": [
    {
      id: "thread-1-msg-1",
      threadId: "thread-1",
      sender: "other",
      text: "Hi, I checked your leaf photo. It looks like early rust.",
      sentAt: "08:36",
    },
    {
      id: "thread-1-msg-2",
      threadId: "thread-1",
      sender: "me",
      text: "Thanks! Should I isolate those trees first?",
      sentAt: "08:38",
    },
    {
      id: "thread-1-msg-3",
      threadId: "thread-1",
      sender: "other",
      text: "Yes, isolate and spray copper solution in the afternoon.",
      sentAt: "08:40",
    },
  ],
  "thread-2": [
    {
      id: "thread-2-msg-1",
      threadId: "thread-2",
      sender: "other",
      text: "Morning team, share your drip suppliers in Dak Lak.",
      sentAt: "07:11",
    },
    {
      id: "thread-2-msg-2",
      threadId: "thread-2",
      sender: "me",
      text: "I bought from GreenFlow last season. Pretty stable quality.",
      sentAt: "07:16",
    },
  ],
  "thread-3": [
    {
      id: "thread-3-msg-1",
      threadId: "thread-3",
      sender: "me",
      text: "Can you bring the pH meter tomorrow?",
      sentAt: "19:42",
    },
    {
      id: "thread-3-msg-2",
      threadId: "thread-3",
      sender: "other",
      text: "Sure, I can come by around 8 AM.",
      sentAt: "19:44",
    },
  ],
  "thread-4": [
    {
      id: "thread-4-msg-1",
      threadId: "thread-4",
      sender: "other",
      text: "Your account verification is complete.",
      sentAt: "16:03",
    },
  ],
};

export const getConversationMessagesMock = (
  threadId: string,
): ConversationMessage[] => {
  return conversationMessagesByThreadId[threadId] ?? [];
};
