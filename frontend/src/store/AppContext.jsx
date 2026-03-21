import React, { createContext, useContext, useReducer, useCallback } from "react";
import * as apiService from "../services/api";

// ── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  items: [],
  loading: false,
  error: null,
  apiStatus: "checking", // "checking" | "online" | "offline"
  searchResult: null,
  lastAction: null,
};

// ── Action Types ──────────────────────────────────────────────────────────────
export const ACTIONS = {
  SET_LOADING:    "SET_LOADING",
  SET_ERROR:      "SET_ERROR",
  SET_ITEMS:      "SET_ITEMS",
  ADD_ITEM:       "ADD_ITEM",
  UPDATE_ITEM:    "UPDATE_ITEM",
  DELETE_ITEM:    "DELETE_ITEM",
  SET_SEARCH:     "SET_SEARCH",
  SET_API_STATUS: "SET_API_STATUS",
  SET_LAST_ACTION:"SET_LAST_ACTION",
  CLEAR_ERROR:    "CLEAR_ERROR",
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SET_LOADING:    return { ...state, loading: payload };
    case ACTIONS.SET_ERROR:      return { ...state, error: payload, loading: false };
    case ACTIONS.CLEAR_ERROR:    return { ...state, error: null };
    case ACTIONS.SET_ITEMS:      return { ...state, items: payload, loading: false };
    case ACTIONS.SET_API_STATUS: return { ...state, apiStatus: payload };
    case ACTIONS.SET_SEARCH:     return { ...state, searchResult: payload };
    case ACTIONS.SET_LAST_ACTION:return { ...state, lastAction: payload };

    case ACTIONS.ADD_ITEM:
      return { ...state, items: [payload, ...state.items] };

    case ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map((item) =>
          item.item_name.toLowerCase() === payload.item_name.toLowerCase()
            ? { ...item, location: payload.location }
            : item
        ),
      };

    case ACTIONS.DELETE_ITEM:
      return {
        ...state,
        items: state.items.filter(
          (item) => item.item_name.toLowerCase() !== payload.toLowerCase()
        ),
      };

    default: return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Health check
  const checkApiHealth = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_API_STATUS, payload: "checking" });
    try {
      await apiService.checkHealth();
      dispatch({ type: ACTIONS.SET_API_STATUS, payload: "online" });
      return true;
    } catch {
      dispatch({ type: ACTIONS.SET_API_STATUS, payload: "offline" });
      return false;
    }
  }, []);

  // Fetch all items
  const fetchAllItems = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const res = await apiService.getAllItems();
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      dispatch({ type: ACTIONS.SET_ITEMS, payload: items });
    } catch (e) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: e.message });
    }
  }, []);

  // Log item
  const addItem = useCallback(async (name, location) => {
    const res = await apiService.logItem(name, location);
    const newItem = { item_name: name, location, timestamp: new Date().toISOString(), ...res.data };
    dispatch({ type: ACTIONS.ADD_ITEM, payload: newItem });
    dispatch({ type: ACTIONS.SET_LAST_ACTION, payload: { type: "add", name } });
    return res.data;
  }, []);

  // Search item
  const searchItemByName = useCallback(async (name) => {
    const res = await apiService.searchItem(name);
    dispatch({ type: ACTIONS.SET_SEARCH, payload: res.data });
    return res.data;
  }, []);

  // Update item
  const updateItemLocation = useCallback(async (name, location) => {
    const res = await apiService.updateItem(name, location);
    dispatch({ type: ACTIONS.UPDATE_ITEM, payload: { item_name: name, location } });
    dispatch({ type: ACTIONS.SET_LAST_ACTION, payload: { type: "update", name } });
    return res.data;
  }, []);

  // Delete item
  const removeItem = useCallback(async (name) => {
    await apiService.deleteItem(name);
    dispatch({ type: ACTIONS.DELETE_ITEM, payload: name });
    dispatch({ type: ACTIONS.SET_LAST_ACTION, payload: { type: "delete", name } });
  }, []);

  const value = {
    ...state,
    checkApiHealth,
    fetchAllItems,
    addItem,
    searchItemByName,
    updateItemLocation,
    removeItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
