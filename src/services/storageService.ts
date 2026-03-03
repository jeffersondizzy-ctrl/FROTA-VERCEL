
const STORAGE_KEYS = {
  GROUPS: 'frota_scale_groups',
  ESCALA: 'frota_escala_items',
  CHECKLISTS: 'frota_checklists',
  NOTIFICATIONS: 'frota_notifications',
};

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Helper to simulate async behavior of Supabase
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  async getScaleGroups() {
    await delay();
    return getStorage<any[]>(STORAGE_KEYS.GROUPS, []).sort((a, b) => b.id - a.id);
  },

  async saveScaleGroup(group: any) {
    await delay();
    const groups = getStorage<any[]>(STORAGE_KEYS.GROUPS, []);
    const index = groups.findIndex(g => g.id === group.id);
    
    if (index >= 0) {
      groups[index] = { ...groups[index], ...group };
    } else {
      // Auto-increment ID if not present (though usually passed from frontend for new items in this app context?)
      // Looking at App.tsx, IDs seem to be handled. If not, we might need to generate one.
      // For now, assume ID is present or we just push.
      groups.push(group);
    }
    setStorage(STORAGE_KEYS.GROUPS, groups);
    return group;
  },

  async deleteScaleGroup(id: number) {
    await delay();
    const groups = getStorage<any[]>(STORAGE_KEYS.GROUPS, []);
    const filtered = groups.filter(g => g.id !== id);
    setStorage(STORAGE_KEYS.GROUPS, filtered);
  },

  async getEscalaItems() {
    await delay();
    return getStorage<any[]>(STORAGE_KEYS.ESCALA, []).sort((a, b) => b.id - a.id);
  },

  async saveEscalaItem(item: any) {
    await delay();
    const items = getStorage<any[]>(STORAGE_KEYS.ESCALA, []);
    const index = items.findIndex(i => i.id === item.id);
    
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
    } else {
      items.push(item);
    }
    setStorage(STORAGE_KEYS.ESCALA, items);
    return item;
  },

  async saveEscalaItems(newItems: any[]) {
    await delay();
    const items = getStorage<any[]>(STORAGE_KEYS.ESCALA, []);
    // Upsert logic
    newItems.forEach(newItem => {
      const index = items.findIndex(i => i.id === newItem.id);
      if (index >= 0) {
        items[index] = { ...items[index], ...newItem };
      } else {
        items.push(newItem);
      }
    });
    setStorage(STORAGE_KEYS.ESCALA, items);
    return newItems;
  },

  async deleteEscalaItem(id: number) {
    await delay();
    const items = getStorage<any[]>(STORAGE_KEYS.ESCALA, []);
    const filtered = items.filter(i => i.id !== id);
    setStorage(STORAGE_KEYS.ESCALA, filtered);
  },

  async getChecklists() {
    await delay();
    return getStorage<any[]>(STORAGE_KEYS.CHECKLISTS, []).sort((a, b) => a.placa.localeCompare(b.placa));
  },

  async saveChecklist(checklist: any) {
    await delay();
    const checklists = getStorage<any[]>(STORAGE_KEYS.CHECKLISTS, []);
    const index = checklists.findIndex(c => c.placa === checklist.placa);
    
    if (index >= 0) {
      checklists[index] = { ...checklists[index], ...checklist };
    } else {
      checklists.push(checklist);
    }
    setStorage(STORAGE_KEYS.CHECKLISTS, checklists);
    return checklist;
  },

  async saveChecklists(newChecklists: any[]) {
    await delay();
    const checklists = getStorage<any[]>(STORAGE_KEYS.CHECKLISTS, []);
    newChecklists.forEach(newItem => {
      const index = checklists.findIndex(c => c.placa === newItem.placa);
      if (index >= 0) {
        checklists[index] = { ...checklists[index], ...newItem };
      } else {
        checklists.push(newItem);
      }
    });
    setStorage(STORAGE_KEYS.CHECKLISTS, checklists);
    return newChecklists;
  },

  async deleteChecklist(placa: string) {
    await delay();
    const checklists = getStorage<any[]>(STORAGE_KEYS.CHECKLISTS, []);
    const filtered = checklists.filter(c => c.placa !== placa);
    setStorage(STORAGE_KEYS.CHECKLISTS, filtered);
  },

  async getNotifications() {
    await delay();
    return getStorage<any[]>(STORAGE_KEYS.NOTIFICATIONS, []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
  },

  async saveNotification(notification: any) {
    await delay();
    const notifications = getStorage<any[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.unshift(notification);
    // Keep only last 50
    const trimmed = notifications.slice(0, 50);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, trimmed);
  },

  async clearNotifications() {
    await delay();
    setStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  }
};
