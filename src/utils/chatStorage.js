import { get, set, del } from 'idb-keyval';

const MESSAGES_PREFIX = 'HZ_MSGS_v1_';
const CONVERSATIONS_KEY = 'HZ_CONVS_v1';
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONV = 70;

// --- Conversations ---

export const saveConversationsToDisk = async (conversations) => {
    try {
        await set(CONVERSATIONS_KEY, conversations.slice(0, MAX_CONVERSATIONS));
    } catch (e) {
        console.warn('[IDB] Failed to save conversations:', e);
    }
};

export const getConversationsFromDisk = async () => {
    try {
        return (await get(CONVERSATIONS_KEY)) || [];
    } catch (e) {
        return [];
    }
};

// --- Messages ---

export const saveMessagesToDisk = async (conversationId, messages) => {
    try {
        await set(`${MESSAGES_PREFIX}${conversationId}`, messages.slice(0, MAX_MESSAGES_PER_CONV));
    } catch (e) {
        console.warn('[IDB] Failed to save messages:', e);
    }
};

export const getMessagesFromDisk = async (conversationId) => {
    try {
        return (await get(`${MESSAGES_PREFIX}${conversationId}`)) || null;
    } catch (e) {
        return null;
    }
};

export const clearMessagesFromDisk = async (conversationId) => {
    try {
        await del(`${MESSAGES_PREFIX}${conversationId}`);
    } catch (e) {}
};
