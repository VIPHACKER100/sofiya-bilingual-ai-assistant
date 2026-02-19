import React from 'react';

export interface UndoRedoState<T> {
  present: T;
  past: T[];
  future: T[];
}

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = React.useState<UndoRedoState<T>>({
    present: initialState,
    past: [],
    future: []
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const updateState = (newPresent: T | ((prev: T) => T)) => {
    const resolvedNew = typeof newPresent === 'function' 
      ? (newPresent as (prev: T) => T)(state.present)
      : newPresent;

    setState({
      present: resolvedNew,
      past: [...state.past, state.present],
      future: []
    });
  };

  const undo = () => {
    if (!canUndo) return;

    const newPresent = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);

    setState({
      present: newPresent,
      past: newPast,
      future: [state.present, ...state.future]
    });
  };

  const redo = () => {
    if (!canRedo) return;

    const newPresent = state.future[0];
    const newFuture = state.future.slice(1);

    setState({
      present: newPresent,
      past: [...state.past, state.present],
      future: newFuture
    });
  };

  const reset = (newPresent: T) => {
    setState({
      present: newPresent,
      past: [],
      future: []
    });
  };

  return {
    state: state.present,
    setState: updateState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    pastLength: state.past.length,
    futureLength: state.future.length
  };
}
