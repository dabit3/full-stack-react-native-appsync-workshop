// query
import React, { useEffect, useReducer } from 'react'

const initialState = {
  restaurants: [],
  error: false
}

function reducer(state, action) {
  switch (action.type) {
    case 'set':
      return {...state, restaurants: action.restaurants};
    case 'error':
      return { ...state, error: true}
    default:
      throw new Error();
  }
}

async function fetchRestaurants(dispatch) {
  try {
    const restaurantData = await API.graphql(graphqlOperation(listRestaurants))
    dispatch({
      type: 'set',
      restaurants: restaurantData.data.listRestaurants.items
    })
  } catch (err) {
    dispatch({ type: 'error' })
  }
}

// within the component
const [state, dispatch] = useReducer(reducer, initialState)

useEffect(() => {
  fetchRestaurants(dispatch)
}, [])

state.restaurants.map((restaurant, index) => (
  <Text key={index}>{restaurant.name}</Text>
))

// mutation

// First, update the a form state
const initialState = {
  restaurants: [],
  error: false,
  name: '',
  description: '',
  city: ''
}

// update the reducer
function reducer(state, action) {
  switch (action.type) {
    case 'set':
      return {...state, restaurants: action.restaurants};
    case 'add':
      return {
        ...state,
        restaurants: [...state.restaurants, action.restaurant]
      };
    case 'updateInput':
      return {
        ...state,
        [action.inputType]: action.inputValue
      }
    case 'error':
      return { ...state, error: true}
    default:
      throw new Error();
  }
}

// Update form inputs
<TextInput
  name='name'
  value={this.state.name}
  onChangeText={v => dispatch({
      type: 'updateInput',
      inputType: 'name',
      inputValue: v
    })}
/>

async function createRestaurant(dispatch, state) {
  const { name, description, city } = state
  const restaurant = {
    name, description, city, clientId: CLIENTID
  }
  
  dispatch({
    type: 'add',
    restaurant
  })
  
  try {
    await API.graphql(graphqlOperation(createRestaurant, {
      input: restaurant
    }))
    console.log('item created!')
  } catch (err) {
    dispatch({
      error: true,
    })
  }
}

// subscription
useEffect(() => {
  const subscriber = API.graphql(graphqlOperation(onCreateRestaurant)).subscribe({
    next: eventData => {
      const restaurant = eventData.value.data.onCreateRestaurant
      if(CLIENTID === restaurant.clientId) return
      dispatch({ type: "add", restaurant })
    }
  })
  return () => subscriber.unsubscribe()
}, [])