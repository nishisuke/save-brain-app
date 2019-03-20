import React, { useReducer, useEffect, useMemo, useCallback } from 'react'
import db from '../db'

const reducer = (state, action) => {
  switch (action.type) {
    case 'waiting':    return { ...state, statusName: 'waiting'                                                    }
    case 'begin':      return { ...state, statusName: 'begin',    editingText: action.text }
    case 'willSave':   return { ...state, statusName: 'willSave', timeoutID: action.timeoutID, editingText: action.editingText }
    case 'setPromise': return { ...state, statusName: 'setPromise'                                                 }
    case 'saved':      return { ...state, statusName: 'saved'                                                      }
    case 'stopped':    return { ...state, statusName: 'stopped',  prevState: state.statusName                           }
    default: throw new Error();
  }
}

let promise = new Promise(resolve => {
  resolve(1)
})

const initialState = {
  statusName: 'waiting',
  editingText: {},
  timeoutID: -1,
}

export default () => {
  const [autoSave, dispatch] = useReducer(reducer, initialState);

  const change = useCallback(e => {
    const t = e.target.value;

    clearTimeout(autoSave.timeoutID)

    const timeoutID = setTimeout(() => {
      dispatch({ type: 'setPromise'})

      promise = promise.then(num => {
        return new Promise(resolve => {
          db.putMemo(autoSave.editingText.getEdited(t))
            .then(() => {
              dispatch({ type: 'saved' })
              resolve(true)
            }).catch(e => {
              alert(`save failed!!: ${t}`)
              resolve(false)
            })
        })
      })
    }, 1500)

    dispatch({ type: 'willSave', timeoutID: timeoutID, editingText: autoSave.editingText.getEdited(t) })
  }, [autoSave.timeoutID, autoSave.editingText.id])

  useEffect(() => {
    if (autoSave.statusName !== 'stopped') return;

    switch (autoSave.prevState) {
      case 'willSave':
        clearTimeout(autoSave.timeoutID)

        promise = promise.then(num => {
          return new Promise(resolve => {
            db.putMemo(autoSave.editingText)
              .then(() => {
                dispatch({ type: 'waiting' })
                resolve(true)
              })
              .catch(e => {
                alert(`save failed!!: ${t}`)
                resolve(false)
              })
          })
        })

        break;
      case 'setPromise':
        promise = promise.then(() => {
          return new Promise(resolve => {
            dispatch({ type: 'waiting' })
            resolve(1)
          })
        })
        break;
      default:
        dispatch({ type: 'waiting' })
        break;
    }
  })

  return {
    statusName: autoSave.statusName,
    value: autoSave.editingText.text,
    change: change,
    startEditing: t => dispatch({ type: 'begin', text: t }),
    finishEditing: () => dispatch({ type: 'stopped' }),
  }
}