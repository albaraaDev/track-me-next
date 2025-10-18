"use client";

import { createJSONStorage, StateStorage } from "zustand/middleware";

export const STORAGE_KEY = "track-me-app-state";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function getStateStorage(): StateStorage {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  return {
    getItem: (name) => window.localStorage.getItem(name),
    setItem: (name, value) => window.localStorage.setItem(name, value),
    removeItem: (name) => window.localStorage.removeItem(name),
  };
}

export const createPersistStorage = () => createJSONStorage(() => getStateStorage());
